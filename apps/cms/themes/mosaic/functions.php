<?php
/**
 * Mosaic theme bootstrap. Registers Header and Footer nav-menu locations so the
 * classic, drag-and-drop Menus screen (Appearance → Menus) is used to author
 * header/footer links — including nested sub-links — instead of the block
 * editor. `register_nav_menus()` also calls `add_theme_support('menus')`, which
 * restores that screen in a block theme. The menus are exposed over WPGraphQL
 * (by location) for the decoupled Next.js frontend to render.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action(
	'after_setup_theme',
	function () {
		register_nav_menus(
			array(
				'header' => __( 'Header', 'mosaic' ),
				'footer' => __( 'Footer', 'mosaic' ),
			)
		);
	}
);
