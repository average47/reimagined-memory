<?php
/**
 * Plugin Name: Mosaic Admin — Wider Editor Sidebar
 * Description: Widens the block editor settings sidebar (the right-hand
 *              Inspector panel) from its 280px default to 400px, so the
 *              mosaic/* block controls have more room.
 * Network:     true
 *
 * Dropped in wp-content/mu-plugins, so it auto-activates for every tenant.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'enqueue_block_editor_assets',
	function () {
		// The settings sidebar lives in the editor chrome (not the iframed
		// canvas): `__sidebar` is the skeleton column, `complementary-area` the
		// panel inside it — both default to 280px, pinned via `width` AND
		// `max-width`. Core's stylesheet also defines those rules, so `!important`
		// is needed to win regardless of enqueue order.
		$css = '.interface-interface-skeleton__sidebar,'
			. '.interface-complementary-area{'
			. 'width:400px!important;max-width:400px!important;}';

		// A style handle with a `false` src carries inline CSS without a file.
		wp_register_style( 'mosaic-editor-sidebar-width', false );
		wp_enqueue_style( 'mosaic-editor-sidebar-width' );
		wp_add_inline_style( 'mosaic-editor-sidebar-width', $css );
	}
);
