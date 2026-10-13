<?php
/**
 * Plugin Name: Mosaic Headless Links
 * Description: Points permalinks at the decoupled Next.js frontend so WordPress
 *              "View Page/Post" (and the Gutenberg view link, admin bar, and row
 *              "View" actions) open the page in Next.js instead of the headless
 *              WordPress render.
 * Network:     true
 *
 * Dropped in wp-content/mu-plugins, so it auto-activates for every tenant in the
 * Multisite network without a separate activation step.
 *
 * Each tenant maps to a brand frontend: the primary (network) site is AMC+, and
 * the other sites' path segment IS the brand (`/shudder/` -> shudder, etc.).
 * In dev the frontend is served per-brand by apps/proxy at
 * http://<brand>.localhost:3001/<slug>; override the origin template with the
 * MOSAIC_FRONTEND_URL env var (use `{brand}` as the placeholder) for other
 * environments.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Brand slug for the current tenant. Primary site -> `amcplus`; sub-sites use
 * their path segment (which matches the brand).
 *
 * @return string
 */
function mosaic_tenant_brand() {
	$path = trim( get_blog_details()->path, '/' );
	return '' === $path ? 'amcplus' : $path;
}

/**
 * Origin of the Next.js frontend for a brand, e.g. http://shudder.localhost:3001.
 *
 * @param string $brand
 * @return string
 */
function mosaic_frontend_origin( $brand ) {
	$template = getenv( 'MOSAIC_FRONTEND_URL' );
	if ( ! is_string( $template ) || '' === $template ) {
		$template = 'http://{brand}.localhost:3001';
	}
	return untrailingslashit( str_replace( '{brand}', $brand, $template ) );
}

/**
 * Rewrite a permalink to the Next.js frontend: <origin>/<slug>.
 *
 * Only published content is rewritten; drafts keep the WordPress link so the
 * built-in preview still works (headless draft preview is a separate concern).
 * Accepts either a WP_Post or an ID — `page_link` passes an ID while
 * `post_link`/`post_type_link` pass the object.
 *
 * @param string      $permalink
 * @param WP_Post|int $post
 * @return string
 */
function mosaic_frontend_permalink( $permalink, $post ) {
	$post = get_post( $post );
	if ( ! $post || 'publish' !== $post->post_status || '' === $post->post_name ) {
		return $permalink;
	}
	return mosaic_frontend_origin( mosaic_tenant_brand() ) . '/' . $post->post_name;
}

add_filter( 'post_link', 'mosaic_frontend_permalink', 10, 2 );
add_filter( 'page_link', 'mosaic_frontend_permalink', 10, 2 );
add_filter( 'post_type_link', 'mosaic_frontend_permalink', 10, 2 );
