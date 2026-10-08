/**
 * Editor registration for `mosaic/hero` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/Hero/Hero.types.ts`. The real UI is
 * rendered by `apps/web`, so `edit` shows Inspector fields and a placeholder
 * preview; `save` returns null because this is a dynamic block.
 */
(function (wp) {
  const el = wp.element.createElement;
  const { __ } = wp.i18n;
  const { InspectorControls, useBlockProps } = wp.blockEditor;
  const { PanelBody, TextControl, TextareaControl } = wp.components;

  wp.blocks.registerBlockType('mosaic/hero', {
    apiVersion: 3,
    title: __('Hero'),
    description: __('Marketing hero from the Mosaic design system.'),
    category: 'design',
    icon: 'cover-image',
    attributes: {
      backgroundSrc: { type: 'string', default: '' },
      logoSrc: { type: 'string', default: '' },
      logoAlt: { type: 'string', default: '' },
      title: { type: 'string', default: '' },
      description: { type: 'string', default: '' },
      priceText: { type: 'string', default: '' },
      legal: { type: 'string', default: '' },
      ctaLabel: { type: 'string', default: '' },
      ctaHref: { type: 'string', default: '' },
    },

    edit: function (props) {
      const { attributes, setAttributes } = props;
      const blockProps = useBlockProps();

      const field = (Control, key, label, help) =>
        el(Control, {
          label: __(label),
          help: help ? __(help) : undefined,
          value: attributes[key],
          onChange: (value) => setAttributes({ [key]: value }),
        });

      return el(
        'div',
        blockProps,
        el(
          InspectorControls,
          null,
          el(
            PanelBody,
            { title: __('Hero content') },
            field(TextControl, 'title', 'Headline'),
            field(TextareaControl, 'description', 'Subheader'),
            field(TextControl, 'priceText', 'Pricing text'),
            field(TextareaControl, 'legal', 'Legal'),
            field(TextControl, 'ctaLabel', 'CTA label'),
            field(TextControl, 'ctaHref', 'CTA link URL', 'Leave empty to render a button instead of a link.')
          ),
          el(
            PanelBody,
            { title: __('Media'), initialOpen: false },
            field(TextControl, 'backgroundSrc', 'Background image URL'),
            field(TextControl, 'logoSrc', 'Logo image URL'),
            field(TextControl, 'logoAlt', 'Logo alt text')
          )
        ),
        el(
          'div',
          {
            style: {
              padding: '24px',
              border: '1px dashed currentColor',
              borderRadius: '12px',
              textAlign: 'center',
            },
          },
          el('div', { style: { fontSize: '11px', letterSpacing: '1px', opacity: 0.6, textTransform: 'uppercase' } }, __('Mosaic Hero')),
          el('div', { style: { fontSize: '20px', fontWeight: 700, marginTop: '6px' } }, attributes.title || __('(headline)')),
          attributes.ctaLabel
            ? el('div', { style: { marginTop: '12px', opacity: 0.8 } }, '[ ' + attributes.ctaLabel + ' ]')
            : null
        )
      );
    },

    save: function () {
      return null;
    },
  });
})(window.wp);
