<?php
/**
 * Plugin Name: Shared Library
 * Description: Makes the network's unbranded primary site a shared content
 *              library: its pages, posts, media, and menus are readable from
 *              every brand tenant, so content is authored once and reused
 *              across microsites instead of duplicated per brand.
 * Network:     true
 *
 * Dropped in wp-content/mu-plugins, so it auto-activates for every tenant in
 * the Multisite network without a separate activation step.
 *
 * ## The model
 *
 * One site owns the canonical copy. The library is the network's primary site
 * (`blog_id` 1, path `/`) — the same site that `headless-permalinks.php` maps
 * to the `default` (no brand) key, which is why it is the natural home for
 * brand-neutral content. Everything published there is shared; there is no
 * per-item opt-in, because the library site exists for nothing else.
 *
 * Brand tenants never hold a copy. They read the library over the routes below,
 * so an edit in the library is live everywhere at once.
 *
 * ## Why routes instead of reading the library's own REST API
 *
 * Subdirectory Multisite puts every tenant on one origin, so a brand site's
 * editor *could* request `/wp-json/wp/v2/media` and reach the library directly.
 * These routes exist anyway because they:
 *
 *  - keep the library's location in one place (callers ask for "the library",
 *    not for `/`), so moving it is a one-constant change;
 *  - return a payload shaped for the consumers (flattened image sizes, menu
 *    items grouped by location) rather than raw WordPress REST; and
 *  - give a single place to add capability checks or an opt-in flag later.
 *
 * ## Routes (registered on every tenant, under `mosaic/v1`)
 *
 *   GET /mosaic/v1/library            -> which site is the library
 *   GET /mosaic/v1/library/media      -> ?search= &per_page= &page=
 *   GET /mosaic/v1/library/content    -> ?search= &type=page,post &per_page=
 *   GET /mosaic/v1/library/menus      -> menus by theme location
 *
 * All four are public reads returning only published (or `inherit`) items —
 * the same visibility the library's own REST API already offers anonymously.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** REST namespace shared by the Mosaic endpoints. */
const MOSAIC_LIBRARY_REST_NS = 'mosaic/v1';

/**
 * The site that holds the shared library.
 *
 * The network's primary site, which `headless-permalinks.php` maps to the
 * `default` (no brand) key. Override with the `MOSAIC_LIBRARY_BLOG_ID` env var
 * to move the library to another site.
 */
function mosaic_library_blog_id(): int {
	static $id = null;
	if ( null !== $id ) {
		return $id;
	}

	$raw = getenv( 'MOSAIC_LIBRARY_BLOG_ID' );
	$id  = ( is_string( $raw ) && ctype_digit( trim( $raw ) ) )
		? (int) trim( $raw )
		: 1;

	return $id;
}

/** Is the site currently being served the library itself? */
function mosaic_is_library_site(): bool {
	return ! is_multisite() || get_current_blog_id() === mosaic_library_blog_id();
}

/**
 * Run a callback against the library site, then switch back.
 *
 * `switch_to_blog()` swaps the table prefix but leaves the current theme's
 * mods and the object cache's blob of registered post types alone, which is
 * fine here: the CPTs come from network-wide mu-plugins and the only theme
 * mods read are nav-menu locations, which are fetched inside the switch.
 *
 * @param callable $fn Receives no arguments; its return value is passed through.
 * @return mixed
 */
function mosaic_library_with( callable $fn ) {
	$switched = false;
	if ( is_multisite() && get_current_blog_id() !== mosaic_library_blog_id() ) {
		switch_to_blog( mosaic_library_blog_id() );
		$switched = true;
	}

	try {
		return $fn();
	} finally {
		if ( $switched ) {
			restore_current_blog();
		}
	}
}

/* -------------------------------------------------------------------------- */
/* Shaping                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Flatten an attachment into the fields a block editor or frontend needs.
 *
 * @param int $id Attachment ID (already inside the library switch).
 * @return array<string, mixed>|null
 */
function mosaic_library_shape_media( int $id ): ?array {
	$url = wp_get_attachment_url( $id );
	if ( ! $url ) {
		return null;
	}

	$meta  = wp_get_attachment_metadata( $id );
	$sizes = array();
	if ( isset( $meta['sizes'] ) && is_array( $meta['sizes'] ) ) {
		foreach ( array_keys( $meta['sizes'] ) as $size ) {
			$src = wp_get_attachment_image_src( $id, $size );
			if ( $src ) {
				$sizes[ $size ] = array(
					'url'    => $src[0],
					'width'  => (int) $src[1],
					'height' => (int) $src[2],
				);
			}
		}
	}

	return array(
		'id'       => $id,
		'url'      => $url,
		'title'    => get_the_title( $id ),
		'alt'      => (string) get_post_meta( $id, '_wp_attachment_image_alt', true ),
		'mimeType' => get_post_mime_type( $id ),
		'width'    => isset( $meta['width'] ) ? (int) $meta['width'] : null,
		'height'   => isset( $meta['height'] ) ? (int) $meta['height'] : null,
		'sizes'    => $sizes,
	);
}

/**
 * Flatten a page/post into a reference a caller can link to or embed.
 *
 * @param WP_Post $post Already inside the library switch.
 * @return array<string, mixed>
 */
function mosaic_library_shape_content( WP_Post $post ): array {
	return array(
		'id'    => $post->ID,
		'type'  => $post->post_type,
		'slug'  => $post->post_name,
		'title' => get_the_title( $post ),
		'date'  => get_post_time( 'c', true, $post ),
	);
}

/* -------------------------------------------------------------------------- */
/* Routes                                                                      */
/* -------------------------------------------------------------------------- */

add_action(
	'rest_api_init',
	function () {
		$public = '__return_true';

		// Which site is the library, and is the caller already on it?
		register_rest_route(
			MOSAIC_LIBRARY_REST_NS,
			'/library',
			array(
				'methods'             => 'GET',
				'permission_callback' => $public,
				'callback'            => function () {
					$id      = mosaic_library_blog_id();
					$details = is_multisite() ? get_blog_details( $id ) : null;

					return rest_ensure_response(
						array(
							'blogId'    => $id,
							'url'       => $details ? $details->siteurl : home_url(),
							'path'      => $details ? $details->path : '/',
							'name'      => $details ? $details->blogname : get_bloginfo( 'name' ),
							'isLibrary' => mosaic_is_library_site(),
						)
					);
				},
			)
		);

		// Shared media.
		register_rest_route(
			MOSAIC_LIBRARY_REST_NS,
			'/library/media',
			array(
				'methods'             => 'GET',
				'permission_callback' => $public,
				'args'                => array(
					'search'   => array( 'type' => 'string' ),
					'per_page' => array(
						'type'    => 'integer',
						'default' => 20,
						'minimum' => 1,
						'maximum' => 100,
					),
					'page'     => array(
						'type'    => 'integer',
						'default' => 1,
						'minimum' => 1,
					),
					'mime'     => array(
						'type'        => 'string',
						'default'     => 'image',
						'description' => 'MIME type prefix to filter on, e.g. "image" or "video".',
					),
				),
				'callback'            => function ( WP_REST_Request $request ) {
					return rest_ensure_response(
						mosaic_library_with(
							function () use ( $request ) {
								$query = new WP_Query(
									array(
										'post_type'              => 'attachment',
										'post_status'            => 'inherit',
										's'                      => (string) $request['search'],
										'post_mime_type'         => (string) $request['mime'],
										'posts_per_page'         => (int) $request['per_page'],
										'paged'                  => (int) $request['page'],
										'fields'                 => 'ids',
										'no_found_rows'          => false,
										'update_post_term_cache' => false,
									)
								);

								$items = array();
								foreach ( $query->posts as $id ) {
									$shaped = mosaic_library_shape_media( (int) $id );
									if ( $shaped ) {
										$items[] = $shaped;
									}
								}

								return array(
									'items' => $items,
									'total' => (int) $query->found_posts,
									'pages' => (int) $query->max_num_pages,
								);
							}
						)
					);
				},
			)
		);

		// Shared pages/posts.
		register_rest_route(
			MOSAIC_LIBRARY_REST_NS,
			'/library/content',
			array(
				'methods'             => 'GET',
				'permission_callback' => $public,
				'args'                => array(
					'search'   => array( 'type' => 'string' ),
					'type'     => array(
						'type'        => 'string',
						'default'     => 'page,post',
						'description' => 'Comma-separated post types to search.',
					),
					'per_page' => array(
						'type'    => 'integer',
						'default' => 20,
						'minimum' => 1,
						'maximum' => 100,
					),
				),
				'callback'            => function ( WP_REST_Request $request ) {
					// Only ever expose publicly queryable types.
					$requested = array_filter( array_map( 'trim', explode( ',', (string) $request['type'] ) ) );
					$types     = array_values(
						array_filter(
							$requested,
							function ( $type ) {
								$object = get_post_type_object( $type );
								return $object && $object->public;
							}
						)
					);
					if ( empty( $types ) ) {
						return new WP_Error(
							'mosaic_library_bad_type',
							'No public post types requested.',
							array( 'status' => 400 )
						);
					}

					return rest_ensure_response(
						mosaic_library_with(
							function () use ( $request, $types ) {
								$query = new WP_Query(
									array(
										'post_type'              => $types,
										'post_status'            => 'publish',
										's'                      => (string) $request['search'],
										'posts_per_page'         => (int) $request['per_page'],
										'ignore_sticky_posts'    => true,
										'update_post_term_cache' => false,
									)
								);

								$items = array_map( 'mosaic_library_shape_content', $query->posts );

								return array(
									'items' => $items,
									'total' => (int) $query->found_posts,
								);
							}
						)
					);
				},
			)
		);

		// Shared menus, grouped by theme location.
		register_rest_route(
			MOSAIC_LIBRARY_REST_NS,
			'/library/menus',
			array(
				'methods'             => 'GET',
				'permission_callback' => $public,
				'callback'            => function () {
					return rest_ensure_response(
						mosaic_library_with(
							function () {
								$locations = get_nav_menu_locations();
								$out       = array();

								foreach ( $locations as $location => $menu_id ) {
									if ( ! $menu_id ) {
										continue;
									}
									$menu = wp_get_nav_menu_object( $menu_id );
									if ( ! $menu ) {
										continue;
									}

									$items = wp_get_nav_menu_items( $menu_id );
									$out[ $location ] = array(
										'name'  => $menu->name,
										'items' => array_map(
											function ( $item ) {
												return array(
													'id'       => (int) $item->ID,
													'label'    => $item->title,
													'url'      => $item->url,
													'parentId' => (int) $item->menu_item_parent,
													'target'   => $item->target,
												);
											},
											is_array( $items ) ? $items : array()
										),
									);
								}

								return $out;
							}
						)
					);
				},
			)
		);
	}
);
