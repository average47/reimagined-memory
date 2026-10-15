<?php
/**
 * Plugin Name: Mosaic Admin — Hide Menu Items
 * Description: Removes the Posts, Comments and Tools items from the wp-admin
 *              sidebar (and the Posts/Comments admin-bar shortcuts). Content is
 *              authored as pages, movies, TV series and TV seasons, and the
 *              headless frontend has no comments.
 * Network:     true
 *
 * Dropped in wp-content/mu-plugins, so it auto-activates for every tenant.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Late priority so the items exist by the time we remove them.
add_action(
	'admin_menu',
	function () {
		remove_menu_page( 'edit.php' );
		remove_menu_page( 'edit-comments.php' );
		remove_menu_page( 'tools.php' );
	},
	999
);

add_action(
	'admin_bar_menu',
	function ( $admin_bar ) {
		$admin_bar->remove_node( 'new-post' );
		$admin_bar->remove_node( 'comments' );
	},
	999
);
