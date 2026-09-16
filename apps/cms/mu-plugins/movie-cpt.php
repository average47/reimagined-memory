<?php
/**
 * Plugin Name: Movie Post Type
 * Description: Registers the `movie` custom post type (schema.org/Movie), a
 *              `genre` taxonomy, and its custom fields — exposed over both the
 *              REST API and WPGraphQL for the headless `apps/web` frontend.
 * Network:     true
 *
 * Dropped in wp-content/mu-plugins, so it auto-activates for every tenant in
 * the Multisite network without a separate activation step.
 *
 * The data model mirrors the schema.org/Movie JSON-LD used across the AMC
 * streaming brands:
 *
 *   name            -> post_title
 *   description     -> post_content
 *   genre[]         -> `genre` taxonomy terms
 *   url             -> _movie_url               (string)
 *   contentRating[] -> _movie_content_rating    (string[])
 *   duration        -> _movie_duration          (ISO-8601 string, e.g. PT1H53M25S)
 *   releasedEvent   -> _movie_date_published    (date string)
 *                      _movie_release_regions   (string[] of country names)
 *   actor[].name    -> _movie_actors            (string[], order preserved)
 *   image           -> _movie_image             ({ contentUrl, dateModified, regionsAllowed[] })
 *   potentialAction -> _movie_watch_targets      ({ urlTemplate, actionPlatform[] }[])
 *                      _movie_access_specs        (subscription/availability specs[])
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Meta keys are underscore-prefixed so they stay out of the default custom
 * fields UI; each is registered explicitly below for REST + GraphQL.
 */
const MOVIE_META = array(
	'url'             => '_movie_url',
	'content_rating'  => '_movie_content_rating',
	'duration'        => '_movie_duration',
	'date_published'  => '_movie_date_published',
	'release_regions' => '_movie_release_regions',
	'actors'          => '_movie_actors',
	'image'           => '_movie_image',
	'watch_targets'   => '_movie_watch_targets',
	'access_specs'    => '_movie_access_specs',
);

/**
 * Only logged-in editors may write movie meta over REST/GraphQL.
 *
 * @return bool
 */
function movie_meta_auth() {
	return current_user_can( 'edit_posts' );
}

/* -------------------------------------------------------------------------- */
/* Post type + taxonomy                                                       */
/* -------------------------------------------------------------------------- */

add_action(
	'init',
	function () {
		register_post_type(
			'movie',
			array(
				'labels'              => array(
					'name'          => 'Movies',
					'singular_name' => 'Movie',
					'menu_name'     => 'Movies',
					'add_new_item'  => 'Add New Movie',
					'edit_item'     => 'Edit Movie',
					'search_items'  => 'Search Movies',
				),
				'public'              => true,
				'has_archive'         => true,
				'menu_icon'           => 'dashicons-video-alt2',
				'supports'            => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
				'rewrite'             => array( 'slug' => 'movies' ),
				// Native WP REST at /wp/v2/movies.
				'show_in_rest'        => true,
				'rest_base'           => 'movies',
				// WPGraphQL: exposes movie(id:) / movies connection.
				'show_in_graphql'     => true,
				'graphql_single_name' => 'Movie',
				'graphql_plural_name' => 'Movies',
			)
		);

		register_taxonomy(
			'genre',
			'movie',
			array(
				'labels'              => array(
					'name'          => 'Genres',
					'singular_name' => 'Genre',
				),
				'public'              => true,
				'hierarchical'        => false,
				'show_admin_column'   => true,
				'show_in_rest'        => true,
				'rest_base'           => 'genres',
				'show_in_graphql'     => true,
				'graphql_single_name' => 'Genre',
				'graphql_plural_name' => 'Genres',
			)
		);
	}
);

/* -------------------------------------------------------------------------- */
/* Post meta (REST exposure)                                                  */
/* -------------------------------------------------------------------------- */

add_action(
	'init',
	function () {
		$string_array_schema = array(
			'type'  => 'array',
			'items' => array( 'type' => 'string' ),
		);

		$image_schema = array(
			'type'       => 'object',
			'properties' => array(
				'contentUrl'     => array( 'type' => 'string' ),
				'dateModified'   => array( 'type' => 'string' ),
				'regionsAllowed' => array(
					'type'  => 'array',
					'items' => array( 'type' => 'string' ),
				),
			),
		);

		$watch_targets_schema = array(
			'type'  => 'array',
			'items' => array(
				'type'       => 'object',
				'properties' => array(
					'urlTemplate'    => array( 'type' => 'string' ),
					'actionPlatform' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
				),
			),
		);

		$access_specs_schema = array(
			'type'  => 'array',
			'items' => array(
				'type'       => 'object',
				'properties' => array(
					'category'           => array( 'type' => 'string' ),
					'availabilityStarts' => array( 'type' => 'string' ),
					'availabilityEnds'   => array( 'type' => 'string' ),
					'subscriptionName'   => array( 'type' => 'string' ),
					'commonTier'         => array( 'type' => 'boolean' ),
					'eligibleRegions'    => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
				),
			),
		);

		$definitions = array(
			MOVIE_META['url']             => array( 'type' => 'string' ),
			MOVIE_META['content_rating']  => array(
				'type'   => 'array',
				'schema' => $string_array_schema,
			),
			MOVIE_META['duration']        => array( 'type' => 'string' ),
			MOVIE_META['date_published']  => array( 'type' => 'string' ),
			MOVIE_META['release_regions'] => array(
				'type'   => 'array',
				'schema' => $string_array_schema,
			),
			MOVIE_META['actors']          => array(
				'type'   => 'array',
				'schema' => $string_array_schema,
			),
			MOVIE_META['image']           => array(
				'type'   => 'object',
				'schema' => $image_schema,
			),
			MOVIE_META['watch_targets']   => array(
				'type'   => 'array',
				'schema' => $watch_targets_schema,
			),
			MOVIE_META['access_specs']    => array(
				'type'   => 'array',
				'schema' => $access_specs_schema,
			),
		);

		foreach ( $definitions as $key => $def ) {
			register_post_meta(
				'movie',
				$key,
				array(
					'single'        => true,
					'type'          => $def['type'],
					'auth_callback' => 'movie_meta_auth',
					'show_in_rest'  => isset( $def['schema'] )
						? array( 'schema' => $def['schema'] )
						: true,
				)
			);
		}
	}
);

/* -------------------------------------------------------------------------- */
/* WPGraphQL exposure                                                         */
/* -------------------------------------------------------------------------- */

add_action(
	'graphql_register_types',
	function () {
		if ( ! function_exists( 'register_graphql_object_type' ) ) {
			return;
		}

		register_graphql_object_type(
			'MovieImage',
			array(
				'description' => 'schema.org/ImageObject for a movie.',
				'fields'      => array(
					'contentUrl'     => array( 'type' => 'String' ),
					'dateModified'   => array( 'type' => 'String' ),
					'regionsAllowed' => array( 'type' => array( 'list_of' => 'String' ) ),
				),
			)
		);

		register_graphql_object_type(
			'MovieWatchTarget',
			array(
				'description' => 'A WatchAction EntryPoint: a deep link and the platforms it serves.',
				'fields'      => array(
					'urlTemplate'    => array( 'type' => 'String' ),
					'actionPlatform' => array( 'type' => array( 'list_of' => 'String' ) ),
				),
			)
		);

		register_graphql_object_type(
			'MovieAccessSpecification',
			array(
				'description' => 'A schema.org ActionAccessSpecification: subscription tier, availability window and regions.',
				'fields'      => array(
					'category'           => array( 'type' => 'String' ),
					'availabilityStarts' => array( 'type' => 'String' ),
					'availabilityEnds'   => array( 'type' => 'String' ),
					'subscriptionName'   => array( 'type' => 'String' ),
					'commonTier'         => array( 'type' => 'Boolean' ),
					'eligibleRegions'    => array( 'type' => array( 'list_of' => 'String' ) ),
				),
			)
		);

		$meta = MOVIE_META;

		$scalar_fields = array(
			'movieUrl'      => array( 'type' => 'String', 'key' => $meta['url'] ),
			'duration'      => array( 'type' => 'String', 'key' => $meta['duration'] ),
			'datePublished' => array( 'type' => 'String', 'key' => $meta['date_published'] ),
		);
		foreach ( $scalar_fields as $name => $conf ) {
			register_graphql_field(
				'Movie',
				$name,
				array(
					'type'    => $conf['type'],
					'resolve' => function ( $post ) use ( $conf ) {
						$value = get_post_meta( $post->ID, $conf['key'], true );
						return '' === $value ? null : $value;
					},
				)
			);
		}

		$list_fields = array(
			'contentRating'  => $meta['content_rating'],
			'releaseRegions' => $meta['release_regions'],
			'actors'         => $meta['actors'],
		);
		foreach ( $list_fields as $name => $key ) {
			register_graphql_field(
				'Movie',
				$name,
				array(
					'type'    => array( 'list_of' => 'String' ),
					'resolve' => function ( $post ) use ( $key ) {
						$value = get_post_meta( $post->ID, $key, true );
						return is_array( $value ) ? array_values( $value ) : array();
					},
				)
			);
		}

		register_graphql_field(
			'Movie',
			'image',
			array(
				'type'    => 'MovieImage',
				'resolve' => function ( $post ) use ( $meta ) {
					$value = get_post_meta( $post->ID, $meta['image'], true );
					return is_array( $value ) ? $value : null;
				},
			)
		);

		register_graphql_field(
			'Movie',
			'watchTargets',
			array(
				'type'    => array( 'list_of' => 'MovieWatchTarget' ),
				'resolve' => function ( $post ) use ( $meta ) {
					$value = get_post_meta( $post->ID, $meta['watch_targets'], true );
					return is_array( $value ) ? array_values( $value ) : array();
				},
			)
		);

		register_graphql_field(
			'Movie',
			'accessSpecifications',
			array(
				'type'    => array( 'list_of' => 'MovieAccessSpecification' ),
				'resolve' => function ( $post ) use ( $meta ) {
					$value = get_post_meta( $post->ID, $meta['access_specs'], true );
					return is_array( $value ) ? array_values( $value ) : array();
				},
			)
		);
	}
);
