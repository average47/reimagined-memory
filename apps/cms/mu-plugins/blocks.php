<?php
/**
 * Plugin Name: Mosaic Blocks
 * Description: Registers the `mosaic/*` dynamic blocks — one per `@repo/ui`
 *              component — so editors can place components in content and the
 *              headless `apps/web` frontend renders the real component from the
 *              block's saved attributes.
 * Network:     true
 *
 * Dropped in wp-content/mu-plugins, so it auto-activates for every tenant in
 * the Multisite network without a separate activation step.
 *
 * Each block's attributes mirror the component's serializable props in
 * `packages/ui/src/<Name>/<Name>.types.ts` (same names, types, defaults, and
 * enum values). The PHP render output is intentionally minimal; the frontend
 * owns presentation. Editor UI lives in plain-JS files under `blocks/` (no
 * build step) using the bundled `wp.*` globals.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Block definitions: block name => [ editor script slug, attributes ].
 *
 * @return array<string, array{script: string, attributes: array}>
 */
function mosaic_blocks() {
	return array(
		// packages/ui/src/Button — `label` is a ReactNode prop, stored as a string.
		'mosaic/button' => array(
			'script'     => 'button',
			'attributes' => array(
				'label'   => array(
					'type'    => 'string',
					'default' => '',
				),
				'variant' => array(
					'type'    => 'string',
					'enum'    => array( 'primary', 'secondary', 'tertiary' ),
					'default' => 'primary',
				),
				'icon'    => array(
					'type'    => 'string',
					'default' => '',
				),
				'href'    => array(
					'type'    => 'string',
					'default' => '',
				),
			),
		),
	);
}

/**
 * Minimal server render for `mosaic/button`: a link or button carrying the
 * attributes as data, for non-headless consumers and previews.
 *
 * @param array $attributes Saved block attributes.
 * @return string
 */
function mosaic_render_button( $attributes ) {
	$label   = esc_html( $attributes['label'] ?? '' );
	$variant = esc_attr( $attributes['variant'] ?? 'primary' );
	$href    = $attributes['href'] ?? '';

	if ( '' !== $href ) {
		return sprintf(
			'<a data-component="Button" data-variant="%s" href="%s">%s</a>',
			$variant,
			esc_url( $href ),
			$label
		);
	}

	return sprintf(
		'<button type="button" data-component="Button" data-variant="%s">%s</button>',
		$variant,
		$label
	);
}

add_action(
	'init',
	function () {
		$renderers = array(
			'mosaic/button' => 'mosaic_render_button',
		);

		foreach ( mosaic_blocks() as $name => $block ) {
			register_block_type(
				$name,
				array(
					'api_version'     => 3,
					'attributes'      => $block['attributes'],
					'render_callback' => $renderers[ $name ],
					'supports'        => array( 'html' => false ),
				)
			);
		}
	}
);

/*
 * PHP registration alone doesn't put a block in the inserter — the editor only
 * lists blocks registered in JavaScript, so enqueue each block's editor script.
 */
add_action(
	'enqueue_block_editor_assets',
	function () {
		foreach ( mosaic_blocks() as $block ) {
			$slug = $block['script'];
			wp_enqueue_script(
				"mosaic-{$slug}-editor",
				plugins_url( "blocks/{$slug}-editor.js", __FILE__ ),
				array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n' ),
				filemtime( __DIR__ . "/blocks/{$slug}-editor.js" ),
				true
			);
		}
	}
);
