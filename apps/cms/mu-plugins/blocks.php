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
		// packages/ui/src/Hero — ReactNode text props stored as strings; the
		// background and logo are URLs. (onCtaClick has no serializable form.)
		'mosaic/hero' => array(
			'script'     => 'hero',
			'attributes' => array(
				'backgroundSrc' => array(
					'type'    => 'string',
					'default' => '',
				),
				'logoSrc' => array(
					'type'    => 'string',
					'default' => '',
				),
				'logoAlt' => array(
					'type'    => 'string',
					'default' => '',
				),
				'title' => array(
					'type'    => 'string',
					'default' => '',
				),
				'description' => array(
					'type'    => 'string',
					'default' => '',
				),
				'priceText' => array(
					'type'    => 'string',
					'default' => '',
				),
				'legal' => array(
					'type'    => 'string',
					'default' => '',
				),
				'ctaLabel' => array(
					'type'    => 'string',
					'default' => '',
				),
				'ctaHref' => array(
					'type'    => 'string',
					'default' => '',
				),
			),
		),
	);
}

/**
 * Headless render payload for a Mosaic block.
 *
 * The PHP render is intentionally minimal — the frontend owns presentation — so
 * each block emits an empty placeholder carrying its block name and the full set
 * of (serializable) attributes as JSON. The `apps/web` switcher
 * (components/MosaicContent.tsx) finds `[data-mosaic-block]` nodes in a post's
 * rendered content and swaps each for the real `@repo/ui` component, passing
 * `data-mosaic-props` as its props.
 *
 * @param string $name       Block name, e.g. `mosaic/button`.
 * @param array  $attributes Saved block attributes (full set, defaults merged).
 * @return string
 */
function mosaic_render_block( $name, $attributes ) {
	return sprintf(
		'<div data-mosaic-block="%s" data-mosaic-props="%s"></div>',
		esc_attr( $name ),
		esc_attr( wp_json_encode( (object) $attributes ) )
	);
}

function mosaic_render_button( $attributes ) {
	return mosaic_render_block( 'mosaic/button', $attributes );
}

function mosaic_render_hero( $attributes ) {
	return mosaic_render_block( 'mosaic/hero', $attributes );
}

add_action(
	'init',
	function () {
		$renderers = array(
			'mosaic/button' => 'mosaic_render_button',
			'mosaic/hero'   => 'mosaic_render_hero',
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
