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
  const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } =
    wp.blockEditor;
  const { PanelBody, TextControl, TextareaControl, Button } = wp.components;

  // Shared-library media picker, registered by blocks/library-media.js and
  // listed as a script dependency in blocks.php. Guarded so the editor still
  // works if that script ever fails to load.
  const SharedMediaButton = (window.mosaicLibrary || {}).SharedMediaButton;


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

      // Media field: pick from the WordPress Media Library (writes the chosen
      // attachment's URL to the attribute) OR paste a URL into the text input.
      const mediaField = (key, label) =>
        el(
          'div',
          { style: { marginBottom: '16px' } },
          el(
            MediaUploadCheck,
            null,
            el(MediaUpload, {
              allowedTypes: ['image'],
              onSelect: (media) => setAttributes({ [key]: media.url }),
              render: ({ open }) =>
                el(
                  Button,
                  {
                    variant: 'secondary',
                    onClick: open,
                    style: { marginBottom: '8px' },
                  },
                  attributes[key] ? __('Replace image') : __('Select image')
                ),
            })
          ),
          // Artwork uploaded to the shared library, reusable from every
          // microsite without copying the file into this site's uploads.
          SharedMediaButton
            ? el(SharedMediaButton, {
                onSelect: (url) => setAttributes({ [key]: url }),
              })
            : null,
          el(TextControl, {
            label: __(label),
            help: __('Choose from the Media Library or the shared library above, or paste a URL.'),
            value: attributes[key],
            onChange: (value) => setAttributes({ [key]: value }),
          })
        );

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
            mediaField('backgroundSrc', 'Background image URL'),
            mediaField('logoSrc', 'Logo image URL'),
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
          // Headline is required — show a muted placeholder only while empty.
          el(
            'div',
            {
              style: {
                fontSize: '20px',
                fontWeight: 700,
                marginTop: '6px',
                opacity: attributes.title ? 1 : 0.5,
              },
            },
            attributes.title || __('(headline)')
          ),
          // Optional text fields render once filled in.
          attributes.description
            ? el('div', { style: { marginTop: '8px' } }, attributes.description)
            : null,
          attributes.priceText
            ? el('div', { style: { marginTop: '8px', fontWeight: 600 } }, attributes.priceText)
            : null,
          attributes.legal
            ? el('div', { style: { marginTop: '8px', fontSize: '11px', opacity: 0.6 } }, attributes.legal)
            : null,
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
