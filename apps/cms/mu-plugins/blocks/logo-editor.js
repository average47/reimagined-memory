/**
 * Editor registration for `mosaic/logo` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/Logo/Logo.types.ts`. The real UI is
 * rendered by `apps/web`, so `edit` shows Inspector fields and a placeholder
 * preview; `save` returns null because this is a dynamic block.
 */
(function (wp) {
  const el = wp.element.createElement;
  const { __ } = wp.i18n;
  const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } =
    wp.blockEditor;
  const { PanelBody, TextControl, Button } = wp.components;

  wp.blocks.registerBlockType('mosaic/logo', {
    apiVersion: 3,
    title: __('Logo'),
    description: __('Brand logo from the Mosaic design system.'),
    category: 'design',
    icon: 'format-image',
    attributes: {
      src: { type: 'string', default: '' },
      alt: { type: 'string', default: '' },
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
            { title: __('Logo') },
            // Pick from the WordPress Media Library (writes the chosen
            // attachment's URL) OR paste a URL into the text input.
            el(
              'div',
              { style: { marginBottom: '16px' } },
              el(
                MediaUploadCheck,
                null,
                el(MediaUpload, {
                  allowedTypes: ['image'],
                  onSelect: (media) =>
                    setAttributes({
                      src: media.url,
                      alt: attributes.alt || media.alt || '',
                    }),
                  render: ({ open }) =>
                    el(
                      Button,
                      {
                        variant: 'secondary',
                        onClick: open,
                        style: { marginBottom: '8px' },
                      },
                      attributes.src ? __('Replace image') : __('Select image')
                    ),
                })
              ),
              el(TextControl, {
                label: __('Logo image URL'),
                help: __('Choose from the Media Library above, or paste a URL.'),
                value: attributes.src,
                onChange: (value) => setAttributes({ src: value }),
              })
            ),
            el(TextControl, {
              label: __('Alt text'),
              help: __('Usually the brand name, e.g. "AMC+".'),
              value: attributes.alt,
              onChange: (value) => setAttributes({ alt: value }),
            })
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
          el('div', { style: { fontSize: '11px', letterSpacing: '1px', opacity: 0.6, textTransform: 'uppercase' } }, __('Mosaic Logo')),
          attributes.src
            ? el('img', {
                src: attributes.src,
                alt: attributes.alt,
                style: { display: 'block', margin: '8px auto 0', maxWidth: '100%', height: '54px', objectFit: 'contain' },
              })
            : el('div', { style: { marginTop: '6px', opacity: 0.5 } }, __('(no image selected)'))
        )
      );
    },

    save: function () {
      return null;
    },
  });
})(window.wp);
