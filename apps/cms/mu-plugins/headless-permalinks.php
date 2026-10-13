<?php
/**
 * Plugin Name: Headless Permalinks
 * Description: Points WordPress's "View Page" / "View Post" links at the
 *              decoupled Next.js frontend (`apps/web`) instead of WordPress's
 *              own theme, resolving the right brand origin per Multisite tenant.
 * Network:     true
 *
 * Dropped in wp-content/mu-plugins, so it auto-activates for every tenant in
 * the Multisite network without a separate activation step.
 *
 * WordPress builds every "view" affordance from `get_permalink()` — the row
 * action in the posts/pages list, the admin bar's "View Page", the editor's
 * "View Page" link, and the "Page published." notice. Filtering the permalink
 * therefore redirects all of them at once.
 *
 * Two deliberate limits:
 *
 *  1. The filters only run for admin and REST requests. The frontend reads
 *     content over WPGraphQL (`apps/web/lib/wordpress.ts`), and that output is
 *     left exactly as WordPress generates it — this plugin changes editor
 *     affordances, not the content API.
 *  2. The "Preview" button still points at WordPress. `apps/web` resolves pages
 *     by slug over the public GraphQL endpoint and has no draft-preview route,
 *     so a frontend preview link would render "no content found" for exactly
 *     the unpublished posts preview exists to show.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Multisite site path => brand key. Subdirectory Multisite, so the network's
 * primary site (AMC+) lives at the root. Mirrors the tenant mapping in
 * `apps/web/lib/wordpress.ts` (NETWORK_PATH_TO_TENANT).
 */
const MOSAIC_HEADLESS_SITE_PATHS = array(
	'/'             => 'amcplus',
	'/shudder/'     => 'shudder',
	'/acorn/'       => 'acorn',
	'/sundancenow/' => 'sundancenow',
	'/wetv/'        => 'wetv',
);

/**
 * Brand key => frontend origin, defaulting to the local dev proxy
 * (`apps/proxy`), which resolves each brand from its `*.localhost` subdomain.
 *
 * Override per environment with the `MOSAIC_FRONTEND_ORIGINS` env var, as a
 * comma-separated list of `brand=origin` pairs, e.g.
 *
 *   MOSAIC_FRONTEND_ORIGINS=amcplus=https://amcplus.com,acorn=https://acorn.tv
 *
 * Unlisted brands keep their default.
 */
const MOSAIC_HEADLESS_DEFAULT_ORIGINS = array(
	'amcplus'     => 'http://amcplus.localhost:3001',
	'shudder'     => 'http://shudder.localhost:3001',
	'acorn'       => 'http://acorn.localhost:3001',
	'sundancenow' => 'http://sundancenow.localhost:3001',
	'wetv'        => 'http://wetv.localhost:3001',
);

/**
 * Re-entrancy guard. Set while we deliberately ask WordPress for its *own*
 * permalink (to build the preview link), so the filters below stand down
 * instead of rewriting it straight back to the frontend.
 */
function mosaic_headless_bypass( ?bool $set = null ): bool {
	static $bypass = false;
	if ( null !== $set ) {
		$bypass = $set;
	}
	return $bypass;
}

/** Frontend origins, with env overrides applied over the defaults. */
function mosaic_headless_origins(): array {
	static $origins = null;
	if ( null !== $origins ) {
		return $origins;
	}

	$origins = MOSAIC_HEADLESS_DEFAULT_ORIGINS;

	$raw = getenv( 'MOSAIC_FRONTEND_ORIGINS' );
	if ( ! is_string( $raw ) || '' === trim( $raw ) ) {
		return $origins;
	}

	foreach ( explode( ',', $raw ) as $pair ) {
		$parts = explode( '=', $pair, 2 );
		if ( 2 !== count( $parts ) ) {
			continue;
		}
		$brand  = trim( $parts[0] );
		$origin = untrailingslashit( trim( $parts[1] ) );
		if ( '' !== $brand && '' !== $origin ) {
			$origins[ $brand ] = $origin;
		}
	}

	return $origins;
}

/** Frontend origin for the current tenant, or null if it isn't mapped. */
function mosaic_headless_current_origin(): ?string {
	$brand = 'amcplus';

	if ( is_multisite() ) {
		$details = get_blog_details( get_current_blog_id() );
		$path    = $details ? $details->path : null;
		if ( ! $path || ! isset( MOSAIC_HEADLESS_SITE_PATHS[ $path ] ) ) {
			return null;
		}
		$brand = MOSAIC_HEADLESS_SITE_PATHS[ $path ];
	}

	return mosaic_headless_origins()[ $brand ] ?? null;
}

/**
 * Should this request's permalinks point at the frontend?
 *
 * Admin requests cover the list-table row actions and the admin bar; REST
 * covers the block editor, which reads the post's `link` field over
 * `/wp-json/wp/v2/...`. WPGraphQL is neither, so the content API is untouched.
 */
function mosaic_headless_should_rewrite(): bool {
	if ( mosaic_headless_bypass() ) {
		return false;
	}
	return is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST );
}

/**
 * Rewrite a post's permalink to its frontend URL.
 *
 * `apps/web` resolves content by slug alone — middleware rewrites
 * `/<slug>` to `/sites/<brand>/<slug>` — so the frontend URL is the origin
 * plus the post slug, regardless of post type or page hierarchy.
 *
 * @param string      $permalink The WordPress permalink.
 * @param WP_Post|int $post      Post object, or ID (the `page_link` filter passes an ID).
 */
function mosaic_headless_filter_permalink( string $permalink, $post ): string {
	if ( ! mosaic_headless_should_rewrite() ) {
		return $permalink;
	}

	$post = get_post( $post );
	if ( ! $post instanceof WP_Post ) {
		return $permalink;
	}

	// Media has no frontend route; drafts without a slug yet have nothing to
	// link to. Leave both pointing at WordPress.
	if ( 'attachment' === $post->post_type || '' === $post->post_name ) {
		return $permalink;
	}

	// Private post types (and anything not publicly queryable) aren't served
	// by the frontend either.
	$post_type = get_post_type_object( $post->post_type );
	if ( ! $post_type || ! $post_type->public ) {
		return $permalink;
	}

	$origin = mosaic_headless_current_origin();
	if ( null === $origin ) {
		return $permalink;
	}

	return $origin . '/' . $post->post_name;
}

add_filter( 'post_link', 'mosaic_headless_filter_permalink', 10, 2 );
add_filter( 'page_link', 'mosaic_headless_filter_permalink', 10, 2 );
add_filter( 'post_type_link', 'mosaic_headless_filter_permalink', 10, 2 );

/**
 * Keep "Preview" on WordPress. The incoming link was already built from the
 * rewritten permalink, so rebuild it from WordPress's own with the filters
 * bypassed.
 *
 * @param string  $preview_link The preview URL.
 * @param WP_Post $post         The post being previewed.
 */
function mosaic_headless_filter_preview_link( string $preview_link, $post ): string {
	$post = get_post( $post );
	if ( ! $post instanceof WP_Post ) {
		return $preview_link;
	}

	mosaic_headless_bypass( true );
	$wp_permalink = get_permalink( $post );
	mosaic_headless_bypass( false );

	if ( ! is_string( $wp_permalink ) || '' === $wp_permalink ) {
		return $preview_link;
	}

	return add_query_arg( 'preview', 'true', $wp_permalink );
}

add_filter( 'preview_post_link', 'mosaic_headless_filter_preview_link', 10, 2 );
