<?php
/**
 * Plugin Name: Schema.org Feed Importer
 * Description: WP-CLI command that imports a schema.org JSON feed into the
 *              movie / tv_series / tv_season post types, routing each record by
 *              its `@type`. The feed source defaults to the
 *              WORDPRESS_IMPORT_FEED_URL environment variable.
 * Network:     true
 *
 * Usage (run in the wp-cli container, or `docker compose exec`):
 *
 *   wp schema import                       # uses $WORDPRESS_IMPORT_FEED_URL
 *   wp schema import --feed=<url|path>     # explicit source (URL or file path)
 *   wp schema import --url=http://localhost/shudder/   # import into a tenant
 *
 * The feed may be a single JSON-LD object, a JSON array of objects, an object
 * with a top-level `@graph` array, or a schema.org DataFeed (records under
 * `dataFeedElement`). Records are upserted (matched by the source `@id`), so
 * re-running is idempotent.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! ( defined( 'WP_CLI' ) && WP_CLI ) ) {
	return;
}

/** Meta key holding the source `@id`, used to upsert on re-import. */
const SCHEMA_IMPORT_SOURCE_KEY = '_schema_source_id';

/** schema.org `@type` -> post type + its meta-key map (from the CPT plugins). */
function schema_import_type_map() {
	return array(
		'Movie'    => array( 'post_type' => 'movie', 'meta' => MOVIE_META ),
		'TVSeries' => array( 'post_type' => 'tv_series', 'meta' => TVSERIES_META ),
		'TVSeason' => array( 'post_type' => 'tv_season', 'meta' => TVSEASON_META ),
	);
}

/**
 * Read a feed from a URL or local file path.
 *
 * @param string $source URL (http/https) or filesystem path.
 * @return string Raw feed body.
 * @throws \RuntimeException on failure.
 */
function schema_import_read_feed( $source ) {
	if ( preg_match( '#^https?://#i', $source ) ) {
		$response = wp_remote_get( $source, array( 'timeout' => 30 ) );
		if ( is_wp_error( $response ) ) {
			throw new \RuntimeException( 'Feed request failed: ' . $response->get_error_message() );
		}
		$code = wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			throw new \RuntimeException( "Feed request returned HTTP {$code}." );
		}
		return wp_remote_retrieve_body( $response );
	}

	if ( ! file_exists( $source ) ) {
		throw new \RuntimeException( "Feed file not found: {$source}" );
	}
	$body = file_get_contents( $source );
	if ( false === $body ) {
		throw new \RuntimeException( "Could not read feed file: {$source}" );
	}
	return $body;
}

/**
 * Normalize a decoded feed into a flat list of records.
 *
 * Accepts a single object, a list of objects, an object with `@graph`, or a
 * schema.org DataFeed whose records live under `dataFeedElement` (each element
 * either the entity directly or a DataFeedItem wrapping it in `item`).
 *
 * @param mixed $data Decoded JSON.
 * @return array<int, array<string, mixed>>
 */
function schema_import_normalize( $data ) {
	if ( ! is_array( $data ) ) {
		return array();
	}
	if ( isset( $data['dataFeedElement'] ) && is_array( $data['dataFeedElement'] ) ) {
		$items = array();
		foreach ( $data['dataFeedElement'] as $element ) {
			if ( ! is_array( $element ) ) {
				continue;
			}
			$items[] = ( isset( $element['item'] ) && is_array( $element['item'] ) )
				? $element['item']
				: $element;
		}
		return $items;
	}
	if ( isset( $data['@graph'] ) && is_array( $data['@graph'] ) ) {
		return array_values( array_filter( $data['@graph'], 'is_array' ) );
	}
	if ( array_is_list( $data ) ) {
		return array_values( array_filter( $data, 'is_array' ) );
	}
	return array( $data );
}

/**
 * Build the full set of logical field values from a schema.org record.
 * Only the keys present in a given type's meta map are actually written.
 *
 * @param array<string, mixed> $item
 * @return array<string, mixed>
 */
function schema_import_field_values( array $item ) {
	$released = isset( $item['releasedEvent'] ) && is_array( $item['releasedEvent'] )
		? $item['releasedEvent']
		: array();

	$release_regions = array();
	if ( isset( $released['location'] ) && is_array( $released['location'] ) ) {
		foreach ( $released['location'] as $loc ) {
			if ( isset( $loc['name'] ) ) {
				$release_regions[] = (string) $loc['name'];
			}
		}
	}

	$actors = array();
	if ( isset( $item['actor'] ) && is_array( $item['actor'] ) ) {
		foreach ( $item['actor'] as $person ) {
			if ( isset( $person['name'] ) ) {
				$actors[] = (string) $person['name'];
			}
		}
	}

	$image = null;
	if ( isset( $item['image'] ) && is_array( $item['image'] ) ) {
		$image = array(
			'contentUrl'     => isset( $item['image']['contentUrl'] ) ? (string) $item['image']['contentUrl'] : '',
			'dateModified'   => isset( $item['image']['dateModified'] ) ? (string) $item['image']['dateModified'] : '',
			'regionsAllowed' => isset( $item['image']['regionsAllowed'] ) && is_array( $item['image']['regionsAllowed'] )
				? array_map( 'strval', $item['image']['regionsAllowed'] )
				: array(),
		);
	}

	$part_of_series = null;
	if ( isset( $item['partOfSeries'] ) && is_array( $item['partOfSeries'] ) ) {
		$part_of_series = array(
			'id'   => isset( $item['partOfSeries']['@id'] ) ? (string) $item['partOfSeries']['@id'] : '',
			'name' => isset( $item['partOfSeries']['name'] ) ? (string) $item['partOfSeries']['name'] : '',
		);
	}

	$action = isset( $item['potentialAction'] ) && is_array( $item['potentialAction'] )
		? $item['potentialAction']
		: array();

	$watch_targets = array();
	if ( isset( $action['target'] ) && is_array( $action['target'] ) ) {
		foreach ( $action['target'] as $target ) {
			$watch_targets[] = array(
				'urlTemplate'    => isset( $target['urlTemplate'] ) ? (string) $target['urlTemplate'] : '',
				'actionPlatform' => isset( $target['actionPlatform'] ) && is_array( $target['actionPlatform'] )
					? array_map( 'strval', $target['actionPlatform'] )
					: array(),
			);
		}
	}

	$access_specs = array();
	if ( isset( $action['actionAccessibilityRequirement'] ) && is_array( $action['actionAccessibilityRequirement'] ) ) {
		foreach ( $action['actionAccessibilityRequirement'] as $spec ) {
			$regions = array();
			if ( isset( $spec['eligibleRegion'] ) && is_array( $spec['eligibleRegion'] ) ) {
				foreach ( $spec['eligibleRegion'] as $region ) {
					if ( isset( $region['name'] ) ) {
						$regions[] = (string) $region['name'];
					}
				}
			}
			$subscription = isset( $spec['requiresSubscription'] ) && is_array( $spec['requiresSubscription'] )
				? $spec['requiresSubscription']
				: array();
			$access_specs[] = array(
				'category'           => isset( $spec['category'] ) ? (string) $spec['category'] : '',
				'availabilityStarts' => isset( $spec['availabilityStarts'] ) ? (string) $spec['availabilityStarts'] : '',
				'availabilityEnds'   => isset( $spec['availabilityEnds'] ) ? (string) $spec['availabilityEnds'] : '',
				'subscriptionName'   => isset( $subscription['name'] ) ? (string) $subscription['name'] : '',
				'commonTier'         => ! empty( $subscription['commonTier'] ),
				'eligibleRegions'    => $regions,
			);
		}
	}

	return array(
		'url'             => isset( $item['url'] ) ? (string) $item['url'] : '',
		'content_rating'  => isset( $item['contentRating'] ) && is_array( $item['contentRating'] )
			? array_map( 'strval', $item['contentRating'] )
			: array(),
		'duration'        => isset( $item['duration'] ) ? (string) $item['duration'] : '',
		'season_number'   => isset( $item['seasonNumber'] ) ? (int) $item['seasonNumber'] : 0,
		'part_of_series'  => $part_of_series,
		'date_published'  => isset( $released['startDate'] ) ? (string) $released['startDate'] : '',
		'release_regions' => $release_regions,
		'actors'          => $actors,
		'image'           => $image,
		'watch_targets'   => $watch_targets,
		'access_specs'    => $access_specs,
	);
}

/**
 * Import one schema.org record. Returns 'created', 'updated', or 'skipped'.
 *
 * @param array<string, mixed> $item
 * @return string
 */
function schema_import_record( array $item ) {
	$type = isset( $item['@type'] ) ? (string) $item['@type'] : '';
	$map  = schema_import_type_map();

	if ( ! isset( $map[ $type ] ) ) {
		// Common for large feeds (e.g. TVEpisode); summarized at the end.
		WP_CLI::debug( "Skipping unsupported @type: '" . ( $type ?: '(none)' ) . "'.", 'schema-import' );
		return 'skipped';
	}

	$post_type = $map[ $type ]['post_type'];
	$meta_map  = $map[ $type ]['meta'];
	$source_id = isset( $item['@id'] ) ? (string) $item['@id'] : '';
	$name      = isset( $item['name'] ) ? (string) $item['name'] : '';

	if ( '' === $name ) {
		WP_CLI::debug( "Skipping {$type} record with no name.", 'schema-import' );
		return 'skipped';
	}

	$postarr = array(
		'post_type'    => $post_type,
		'post_title'   => $name,
		'post_content' => isset( $item['description'] ) ? (string) $item['description'] : '',
		'post_status'  => 'publish',
	);

	// Upsert by source @id when present.
	$existing_id = 0;
	if ( '' !== $source_id ) {
		$found = get_posts(
			array(
				'post_type'      => $post_type,
				'post_status'    => 'any',
				'meta_key'       => SCHEMA_IMPORT_SOURCE_KEY,
				'meta_value'     => $source_id,
				'posts_per_page' => 1,
				'fields'         => 'ids',
			)
		);
		if ( ! empty( $found ) ) {
			$existing_id = (int) $found[0];
		}
	}

	if ( $existing_id ) {
		$postarr['ID'] = $existing_id;
		$post_id       = wp_update_post( $postarr, true );
	} else {
		$post_id = wp_insert_post( $postarr, true );
	}

	if ( is_wp_error( $post_id ) ) {
		WP_CLI::warning( "Failed to save '{$name}': " . $post_id->get_error_message() );
		return 'skipped';
	}

	if ( '' !== $source_id ) {
		update_post_meta( $post_id, SCHEMA_IMPORT_SOURCE_KEY, $source_id );
	}

	// Genre taxonomy terms.
	if ( isset( $item['genre'] ) && is_array( $item['genre'] ) ) {
		wp_set_object_terms( $post_id, array_map( 'strval', $item['genre'] ), 'genre', false );
	}

	// Write only the meta keys this post type declares.
	$values = schema_import_field_values( $item );
	foreach ( $meta_map as $logical => $meta_key ) {
		if ( array_key_exists( $logical, $values ) ) {
			update_post_meta( $post_id, $meta_key, $values[ $logical ] );
		}
	}

	return $existing_id ? 'updated' : 'created';
}

WP_CLI::add_command(
	'schema import',
	function ( $args, $assoc_args ) {
		$source = $assoc_args['feed'] ?? getenv( 'WORDPRESS_IMPORT_FEED_URL' );
		if ( empty( $source ) ) {
			WP_CLI::error( 'No feed source. Pass --feed=<url|path> or set WORDPRESS_IMPORT_FEED_URL.' );
		}

		WP_CLI::log( "Importing schema.org feed from: {$source}" );

		try {
			$raw = schema_import_read_feed( $source );
		} catch ( \RuntimeException $e ) {
			WP_CLI::error( $e->getMessage() );
		}

		$data = json_decode( $raw, true );
		if ( JSON_ERROR_NONE !== json_last_error() ) {
			WP_CLI::error( 'Feed is not valid JSON: ' . json_last_error_msg() );
		}

		$items = schema_import_normalize( $data );
		if ( empty( $items ) ) {
			WP_CLI::warning( 'Feed contained no importable records.' );
			return;
		}

		$counts       = array( 'created' => 0, 'updated' => 0, 'skipped' => 0 );
		$skipped_by   = array();
		$progress     = \WP_CLI\Utils\make_progress_bar( 'Importing', count( $items ) );

		// Speed up a bulk import: defer term/comment recounts until the end.
		wp_defer_term_counting( true );
		wp_defer_comment_counting( true );

		foreach ( $items as $item ) {
			$result = schema_import_record( $item );
			++$counts[ $result ];
			if ( 'skipped' === $result ) {
				$type              = isset( $item['@type'] ) ? (string) $item['@type'] : '(none)';
				$skipped_by[ $type ] = ( $skipped_by[ $type ] ?? 0 ) + 1;
			}
			$progress->tick();
		}

		wp_defer_term_counting( false );
		wp_defer_comment_counting( false );
		$progress->finish();

		if ( ! empty( $skipped_by ) ) {
			$parts = array();
			foreach ( $skipped_by as $type => $n ) {
				$parts[] = "{$type}: {$n}";
			}
			WP_CLI::log( 'Skipped by @type — ' . implode( ', ', $parts ) );
		}

		WP_CLI::success(
			sprintf(
				'Import complete: %d created, %d updated, %d skipped (of %d records).',
				$counts['created'],
				$counts['updated'],
				$counts['skipped'],
				count( $items )
			)
		);
	},
	array(
		'shortdesc' => 'Import a schema.org JSON feed into movie / tv_series / tv_season post types.',
		'synopsis'  => array(
			array(
				'type'        => 'assoc',
				'name'        => 'feed',
				'description' => 'Feed URL or file path. Defaults to $WORDPRESS_IMPORT_FEED_URL.',
				'optional'    => true,
			),
		),
	)
);
