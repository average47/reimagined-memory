/**
 * Editor registration for `mosaic/header` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/Header/Header.types.ts`. The real UI is
 * rendered by `apps/web`, so `edit` shows Inspector fields and a placeholder
 * preview; `save` returns null because this is a dynamic block.
 */
(function (wp) {
  const el = wp.element.createElement;
  const { __ } = wp.i18n;
  const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } =
    wp.blockEditor;
  const { PanelBody, TextControl, Button } = wp.components;

  wp.blocks.registerBlockType('mosaic/header', {
    apiVersion: 3,
    title: __('Header'),
    description: __('Site header from the Mosaic design system.'),
    category: 'design',
    icon: 'align-wide',
    attributes: {
      siteName: { type: 'string', default: '' },
      logoSrc: { type: 'string', default: '' },
      href: { type: 'string', default: '' },
    },

    edit: function (props) {
      const { attributes, setAttributes } = props;
      const blockProps = useBlockProps();

      const field = (key, label, help) =>
        el(TextControl, {
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
          el(TextControl, {
            label: __(label),
            help: __('Choose from the Media Library above, or paste a URL. Leave empty to show the site name as text.'),
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
            { title: __('Header content') },
            field('siteName', 'Site name', 'Shown as text when no logo is set; also the logo alt text.'),
            field('href', 'Link URL', 'Leave empty to render the wordmark without a link.')
          ),
          el(
            PanelBody,
            { title: __('Logo'), initialOpen: false },
            mediaField('logoSrc', 'Logo image URL')
          )
        ),
        el(
          'div',
          {
            style: {
              padding: '16px 24px',
              border: '1px dashed currentColor',
              borderRadius: '12px',
            },
          },
          el('div', { style: { fontSize: '11px', letterSpacing: '1px', opacity: 0.6, textTransform: 'uppercase' } }, __('Mosaic Header')),
          // Prefer a logo preview; otherwise fall back to the site-name text.
          attributes.logoSrc
            ? el('img', {
                src: attributes.logoSrc,
                alt: attributes.siteName || '',
                style: { height: '32px', width: 'auto', marginTop: '6px' },
              })
            : el(
                'div',
                {
                  style: {
                    fontSize: '20px',
                    fontWeight: 700,
                    marginTop: '6px',
                    opacity: attributes.siteName ? 1 : 0.5,
                  },
                },
                attributes.siteName || __('(site name)')
              )
        )
      );
    },

    save: function () {
      return null;
    },
  });
})(window.wp);
