/**
 * Editor registration for `mosaic/button` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/Button/Button.types.ts`. The real UI is
 * rendered by `apps/web`, so `edit` shows Inspector fields and a placeholder
 * preview; `save` returns null because this is a dynamic block.
 */
(function (wp) {
  const el = wp.element.createElement;
  const { __ } = wp.i18n;
  const { InspectorControls, useBlockProps } = wp.blockEditor;
  const { PanelBody, TextControl, SelectControl } = wp.components;

  wp.blocks.registerBlockType('mosaic/button', {
    apiVersion: 3,
    title: __('Button'),
    description: __('Call-to-action button from the Mosaic design system.'),
    category: 'design',
    icon: 'button',
    attributes: {
      label: { type: 'string', default: '' },
      variant: {
        type: 'string',
        enum: ['primary', 'secondary', 'tertiary'],
        default: 'primary',
      },
      icon: { type: 'string', default: '' },
      href: { type: 'string', default: '' },
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
            { title: __('Button settings') },
            el(TextControl, {
              label: __('Label'),
              value: attributes.label,
              onChange: (label) => setAttributes({ label }),
            }),
            el(SelectControl, {
              label: __('Variant'),
              value: attributes.variant,
              options: [
                { label: __('Primary'), value: 'primary' },
                { label: __('Secondary'), value: 'secondary' },
                { label: __('Tertiary'), value: 'tertiary' },
              ],
              onChange: (variant) => setAttributes({ variant }),
            }),
            el(TextControl, {
              label: __('Icon'),
              help: __('Optional sprite icon name, e.g. "play".'),
              value: attributes.icon,
              onChange: (icon) => setAttributes({ icon }),
            }),
            el(TextControl, {
              label: __('Link URL'),
              help: __('Leave empty to render a button instead of a link.'),
              type: 'url',
              value: attributes.href,
              onChange: (href) => setAttributes({ href }),
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
          (attributes.label || __('Button')) + ' · ' + attributes.variant
        )
      );
    },

    save: function () {
      return null;
    },
  });
})(window.wp);
