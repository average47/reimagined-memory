/**
 * Editor registration for `mosaic/logo` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/Logo/Logo.types.ts`. The real UI is
 * rendered by `apps/web`, so `edit` shows an Inspector field and a placeholder
 * preview; `save` returns null because this is a dynamic block.
 */
(function (wp) {
  const el = wp.element.createElement;
  const { __ } = wp.i18n;
  const { InspectorControls, useBlockProps } = wp.blockEditor;
  const { PanelBody, SelectControl } = wp.components;

  wp.blocks.registerBlockType('mosaic/logo', {
    apiVersion: 3,
    title: __('Logo'),
    description: __('Brand logo lockup from the Mosaic design system.'),
    category: 'design',
    icon: 'format-image',
    attributes: {
      brand: {
        type: 'string',
        enum: ['mosaic', 'amcplus'],
        default: 'mosaic',
      },
    },

    edit: function (props) {
      const { attributes, setAttributes } = props;
      const blockProps = useBlockProps();

      return el(
        'div',
        blockProps,
        el(
          InspectorControls,
          null,
          el(
            PanelBody,
            { title: __('Logo settings') },
            el(SelectControl, {
              label: __('Brand'),
              value: attributes.brand,
              options: [
                { label: __('Mosaic'), value: 'mosaic' },
                { label: __('AMC+'), value: 'amcplus' },
              ],
              onChange: (brand) => setAttributes({ brand }),
            })
          )
        ),
        el(
          'div',
          {
            style: {
              display: 'inline-block',
              padding: '8px 16px',
              border: '1px dashed currentColor',
              borderRadius: '12px',
            },
          },
          __('Logo') + ' · ' + attributes.brand
        )
      );
    },

    save: function () {
      return null;
    },
  });
})(window.wp);
