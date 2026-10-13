<?php
/**
 * Plugin Name: Mosaic Menu — Use Icon
 * Description: Adds a "Use icon" checkbox to every item in the classic Menus
 *              editor (Appearance → Menus), stored as the `_mosaic_use_icon`
 *              meta and exposed over WPGraphQL as `MenuItem.useIcon` (Boolean)
 *              for the Next.js frontend.
 * Network:     true
 *
 * Dropped in wp-content/mu-plugins, so it auto-activates for every tenant.
 * Unlike "Open in new tab" (the native target field), this is a custom flag, so
 * it needs its own meta + GraphQL field.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const MOSAIC_USE_ICON_META = '_mosaic_use_icon';

/**
 * Render the checkbox inside each menu item in the editor (WP 5.4+).
 *
 * @param int $item_id Menu item (post) ID.
 */
add_action(
	'wp_nav_menu_item_custom_fields',
	function ( $item_id ) {
		$on    = get_post_meta( $item_id, MOSAIC_USE_ICON_META, true );
		$field = 'menu-item-mosaic-use-icon';
		?>
		<p class="field-mosaic-use-icon description description-wide">
			<label for="edit-<?php echo esc_attr( $field . '-' . $item_id ); ?>">
				<input
					type="checkbox"
					id="edit-<?php echo esc_attr( $field . '-' . $item_id ); ?>"
					name="<?php echo esc_attr( $field ); ?>[<?php echo esc_attr( $item_id ); ?>]"
					value="1"
					<?php checked( $on, '1' ); ?>
				/>
				<?php esc_html_e( 'Use icon', 'mosaic' ); ?>
			</label>
		</p>
		<?php
	},
	10,
	1
);

/**
 * Persist on save. The clear branch is guarded on `menu-item-db-id` (posted
 * only by the Menus editor) so programmatic/API updates don't reset it.
 *
 * @param int $menu_id         Nav menu term ID.
 * @param int $menu_item_db_id Menu item (post) ID.
 */
add_action(
	'wp_update_nav_menu_item',
	function ( $menu_id, $menu_item_db_id ) {
		if ( isset( $_POST['menu-item-mosaic-use-icon'][ $menu_item_db_id ] ) ) {
			update_post_meta( $menu_item_db_id, MOSAIC_USE_ICON_META, '1' );
		} elseif ( isset( $_POST['menu-item-db-id'] ) ) {
			update_post_meta( $menu_item_db_id, MOSAIC_USE_ICON_META, '' );
		}
	},
	10,
	2
);

/**
 * Expose it as `MenuItem.useIcon` (Boolean) over WPGraphQL.
 */
add_action(
	'graphql_register_types',
	function () {
		if ( ! function_exists( 'register_graphql_field' ) ) {
			return;
		}
		register_graphql_field(
			'MenuItem',
			'useIcon',
			array(
				'type'        => 'Boolean',
				'description' => 'Whether this menu item should render with an icon.',
				'resolve'     => function ( $item ) {
					$id = $item->databaseId ?? null;
					return $id
						? '1' === get_post_meta( $id, MOSAIC_USE_ICON_META, true )
						: false;
				},
			)
		);
	}
);
