<?php
/**
 * Plugin Name: Mosaic Headless Preview
 * Description: Routes the WordPress "Preview" button to the Next.js frontend's
 *              Draft Mode endpoint, so unpublished changes preview in Next.js.
 *              Next validates the shared secret, enables Draft Mode, and fetches
 *              the draft over the authenticated REST API.
 * Network:     true
 *
 * Pairs with headless-links.php (reuses mosaic_frontend_origin / mosaic_tenant_brand)
 * and the Next route at apps/web/app/api/preview. The shared secret comes from
 * the MOSAIC_PREVIEW_SECRET env var (keep it in sync with WORDPRESS_PREVIEW_SECRET
 * on the Next side); it falls back to a known dev value for local use.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/*
 * WordPress hides Application Passwords on non-SSL, non-"local" installs, which
 * blocks the authenticated REST calls Next uses to fetch drafts. This network
 * runs on plain HTTP locally, so re-enable them. Over HTTPS (a real deploy)
 * they're available regardless, so this is a no-op there.
 */
add_filter( 'wp_is_application_passwords_available', '__return_true' );

/**
 * Shared preview secret. Override with the MOSAIC_PREVIEW_SECRET env var.
 *
 * @return string
 */
function mosaic_preview_secret() {
	$secret = getenv( 'MOSAIC_PREVIEW_SECRET' );
	return ( is_string( $secret ) && '' !== $secret )
		? $secret
		: 'mosaic-dev-preview-secret';
}

/**
 * Send the "Preview" button to Next.js Draft Mode:
 * <origin>/api/preview?secret=…&id=…&type=…&slug=…
 *
 * @param string  $link
 * @param WP_Post $post
 * @return string
 */
function mosaic_preview_link( $link, $post ) {
	if ( ! function_exists( 'mosaic_frontend_origin' ) ) {
		return $link; // headless-links.php not loaded.
	}

	return add_query_arg(
		array(
			'secret' => rawurlencode( mosaic_preview_secret() ),
			'id'     => $post->ID,
			'type'   => $post->post_type,
			'slug'   => $post->post_name,
		),
		mosaic_frontend_origin( mosaic_tenant_brand() ) . '/api/preview'
	);
}

add_filter( 'preview_post_link', 'mosaic_preview_link', 10, 2 );
