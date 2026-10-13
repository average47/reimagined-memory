<?php
/**
 * Plugin Name: Mosaic Menu — Open in New Tab
 * Description: Adds an "Open in new tab" checkbox to every item in the classic
 *              Menus editor (Appearance → Menus), bound to the native
 *              `_menu_item_target` meta. WPGraphQL exposes it as
 *              `MenuItem.target` ("_blank"), so the Next.js frontend can render
 *              `target="_blank"` / `rel="noopener"`.
 * Network:     true
 *
 * Dropped in wp-content/mu-plugins, so it auto-activates for every tenant.
 * WordPress has a built-in Link Target field, but it's hidden behind Screen
 * Options; this surfaces it as a plain checkbox on each menu item.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render the checkbox inside each menu item in the editor (WP 5.4+).
 *
 * @param int     $item_id Menu item (post) ID.
 * @param WP_Post $item    Menu item object.
 */
add_action(
	'wp_nav_menu_item_custom_fields',
	function ( $item_id, $item ) {
		$target = get_post_meta( $item_id, '_menu_item_target', true );
		$field  = 'menu-item-mosaic-new-tab';
		?>
		<p class="field-mosaic-new-tab description description-wide">
			<label for="edit-<?php echo esc_attr( $field . '-' . $item_id ); ?>">
				<input
					type="checkbox"
					id="edit-<?php echo esc_attr( $field . '-' . $item_id ); ?>"
					name="<?php echo esc_attr( $field ); ?>[<?php echo esc_attr( $item_id ); ?>]"
					value="_blank"
					<?php checked( $target, '_blank' ); ?>
				/>
				<?php esc_html_e( 'Open in new tab', 'mosaic' ); ?>
			</label>
		</p>
		<?php
	},
	10,
	2
);

/**
 * Persist the checkbox to the native `_menu_item_target` meta on save. The
 * clear branch is guarded on `menu-item-db-id` (posted only by the Menus
 * editor) so programmatic/API updates don't wipe the target.
 *
 * @param int $menu_id          Nav menu term ID.
 * @param int $menu_item_db_id  Menu item (post) ID.
 */
add_action(
	'wp_update_nav_menu_item',
	function ( $menu_id, $menu_item_db_id ) {
		if ( isset( $_POST['menu-item-mosaic-new-tab'][ $menu_item_db_id ] ) ) {
			update_post_meta( $menu_item_db_id, '_menu_item_target', '_blank' );
		} elseif ( isset( $_POST['menu-item-db-id'] ) ) {
			update_post_meta( $menu_item_db_id, '_menu_item_target', '' );
		}
	},
	10,
	2
);
