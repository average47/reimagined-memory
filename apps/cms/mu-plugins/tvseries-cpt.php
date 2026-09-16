<?php
/**
 * Plugin Name: TV Series Post Type
 * Description: Registers the `tv_series` custom post type (schema.org/TVSeason),
 *              reuses the `genre` taxonomy, and its custom fields — exposed over
 *              both the REST API and WPGraphQL for the headless `apps/web`
 *              frontend.
 * Network:     true
 *
 * Dropped in wp-content/mu-plugins, so it auto-activates for every tenant in
 * the Multisite network without a separate activation step.
 *
 * The source JSON-LD is a schema.org/TVSeason (a numbered season that points at
 * its parent TVSeries via `partOfSeries`); the type is named `tv_series` per the
 * request. Data model:
 *
 *   name            -> post_title
 *   description     -> post_content
 *   genre[]         -> `genre` taxonomy terms (shared with the movie type)
 *   url             -> _tvseries_url             (string)
 *   contentRating[] -> _tvseries_content_rating  (string[])
 *   seasonNumber    -> _tvseries_season_number   (int)
 *   partOfSeries    -> _tvseries_part_of_series   ({ id, name })
 *   releasedEvent   -> _tvseries_date_published   (date string)
 *                      _tvseries_release_regions  (string[] of country names)
 *   actor[].name    -> _tvseries_actors           (string[], order preserved)
 *   image           -> _tvseries_image            ({ contentUrl, dateModified, regionsAllowed[] })
 *   potentialAction -> _tvseries_watch_targets     ({ urlTemplate, actionPlatform[] }[])
 *                      _tvseries_access_specs       (subscription/availability specs[])
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Underscore-prefixed meta keys, each registered explicitly for REST + GraphQL. */
const TVSERIES_META = array(
	'url'             => '_tvseries_url',
	'content_rating'  => '_tvseries_content_rating',
	'season_number'   => '_tvseries_season_number',
	'part_of_series'  => '_tvseries_part_of_series',
	'date_published'  => '_tvseries_date_published',
	'release_regions' => '_tvseries_release_regions',
	'actors'          => '_tvseries_actors',
	'image'           => '_tvseries_image',
	'watch_targets'   => '_tvseries_watch_targets',
	'access_specs'    => '_tvseries_access_specs',
);

/**
 * Only logged-in editors may write TV series meta over REST/GraphQL.
 *
 * @return bool
 */
function tvseries_meta_auth() {
	return current_user_can( 'edit_posts' );
}

/* -------------------------------------------------------------------------- */
/* Post type                                                                  */
/* -------------------------------------------------------------------------- */

add_action(
	'init',
	function () {
		register_post_type(
			'tv_series',
			array(
				'labels'              => array(
					'name'          => 'TV Series',
					'singular_name' => 'TV Series',
					'menu_name'     => 'TV Series',
					'add_new_item'  => 'Add New TV Series',
					'edit_item'     => 'Edit TV Series',
					'search_items'  => 'Search TV Series',
				),
				'public'              => true,
				'has_archive'         => true,
				'menu_icon'           => 'dashicons-format-video',
				'supports'            => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
				'rewrite'             => array( 'slug' => 'tv-series' ),
				// Native WP REST at /wp/v2/tv-series.
				'show_in_rest'        => true,
				'rest_base'           => 'tv-series',
				// WPGraphQL: exposes tvSeries(id:) / tvSeriesCollection connection.
				'show_in_graphql'     => true,
				'graphql_single_name' => 'TvSeries',
				'graphql_plural_name' => 'TvSeriesCollection',
			)
		);
	}
);

/**
 * Attach the shared `genre` taxonomy (registered by movie-cpt.php) to
 * `tv_series`. Runs at priority 11 so it is guaranteed to fire after the
 * default-priority registration; falls back to registering `genre` itself if
 * the movie plugin is absent, so this type stays self-sufficient.
 */
add_action(
	'init',
	function () {
		if ( taxonomy_exists( 'genre' ) ) {
			register_taxonomy_for_object_type( 'genre', 'tv_series' );
			return;
		}

		register_taxonomy(
			'genre',
			'tv_series',
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
	},
	11
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

		$part_of_series_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'   => array( 'type' => 'string' ),
				'name' => array( 'type' => 'string' ),
			),
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
			TVSERIES_META['url']             => array( 'type' => 'string' ),
			TVSERIES_META['content_rating']  => array(
				'type'   => 'array',
				'schema' => $string_array_schema,
			),
			TVSERIES_META['season_number']   => array( 'type' => 'integer' ),
			TVSERIES_META['part_of_series']  => array(
				'type'   => 'object',
				'schema' => $part_of_series_schema,
			),
			TVSERIES_META['date_published']  => array( 'type' => 'string' ),
			TVSERIES_META['release_regions'] => array(
				'type'   => 'array',
				'schema' => $string_array_schema,
			),
			TVSERIES_META['actors']          => array(
				'type'   => 'array',
				'schema' => $string_array_schema,
			),
			TVSERIES_META['image']           => array(
				'type'   => 'object',
				'schema' => $image_schema,
			),
			TVSERIES_META['watch_targets']   => array(
				'type'   => 'array',
				'schema' => $watch_targets_schema,
			),
			TVSERIES_META['access_specs']    => array(
				'type'   => 'array',
				'schema' => $access_specs_schema,
			),
		);

		foreach ( $definitions as $key => $def ) {
			register_post_meta(
				'tv_series',
				$key,
				array(
					'single'        => true,
					'type'          => $def['type'],
					'auth_callback' => 'tvseries_meta_auth',
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
			'TvSeriesParent',
			array(
				'description' => 'schema.org/TVSeries this season belongs to (partOfSeries).',
				'fields'      => array(
					'id'   => array( 'type' => 'String' ),
					'name' => array( 'type' => 'String' ),
				),
			)
		);

		register_graphql_object_type(
			'TvSeriesImage',
			array(
				'description' => 'schema.org/ImageObject for a TV series.',
				'fields'      => array(
					'contentUrl'     => array( 'type' => 'String' ),
					'dateModified'   => array( 'type' => 'String' ),
					'regionsAllowed' => array( 'type' => array( 'list_of' => 'String' ) ),
				),
			)
		);

		register_graphql_object_type(
			'TvSeriesWatchTarget',
			array(
				'description' => 'A WatchAction EntryPoint: a deep link and the platforms it serves.',
				'fields'      => array(
					'urlTemplate'    => array( 'type' => 'String' ),
					'actionPlatform' => array( 'type' => array( 'list_of' => 'String' ) ),
				),
			)
		);

		register_graphql_object_type(
			'TvSeriesAccessSpecification',
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

		$meta = TVSERIES_META;

		register_graphql_field(
			'TvSeries',
			'seasonNumber',
			array(
				'type'    => 'Int',
				'resolve' => function ( $post ) use ( $meta ) {
					$value = get_post_meta( $post->ID, $meta['season_number'], true );
					return '' === $value ? null : (int) $value;
				},
			)
		);

		$scalar_fields = array(
			'seriesUrl'     => array( 'type' => 'String', 'key' => $meta['url'] ),
			'datePublished' => array( 'type' => 'String', 'key' => $meta['date_published'] ),
		);
		foreach ( $scalar_fields as $name => $conf ) {
			register_graphql_field(
				'TvSeries',
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
				'TvSeries',
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
			'TvSeries',
			'partOfSeries',
			array(
				'type'    => 'TvSeriesParent',
				'resolve' => function ( $post ) use ( $meta ) {
					$value = get_post_meta( $post->ID, $meta['part_of_series'], true );
					return is_array( $value ) ? $value : null;
				},
			)
		);

		register_graphql_field(
			'TvSeries',
			'image',
			array(
				'type'    => 'TvSeriesImage',
				'resolve' => function ( $post ) use ( $meta ) {
					$value = get_post_meta( $post->ID, $meta['image'], true );
					return is_array( $value ) ? $value : null;
				},
			)
		);

		register_graphql_field(
			'TvSeries',
			'watchTargets',
			array(
				'type'    => array( 'list_of' => 'TvSeriesWatchTarget' ),
				'resolve' => function ( $post ) use ( $meta ) {
					$value = get_post_meta( $post->ID, $meta['watch_targets'], true );
					return is_array( $value ) ? array_values( $value ) : array();
				},
			)
		);

		register_graphql_field(
			'TvSeries',
			'accessSpecifications',
			array(
				'type'    => array( 'list_of' => 'TvSeriesAccessSpecification' ),
				'resolve' => function ( $post ) use ( $meta ) {
					$value = get_post_meta( $post->ID, $meta['access_specs'], true );
					return is_array( $value ) ? array_values( $value ) : array();
				},
			)
		);
	}
);
