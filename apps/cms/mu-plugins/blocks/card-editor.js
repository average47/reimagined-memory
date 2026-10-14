/**
 * Editor registration for `mosaic/card` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/Card/Card.types.ts`, plus the attached
 * content reference (`contentType` + `contentId`).
 *
 * The card attaches a `movie` or `tv_series` via a search field: typing queries
 * the REST search endpoint scoped to those two subtypes; selecting a result
 * stores the reference and seeds the display fields (`label`, `href`,
 * `backgroundSrc`) from the chosen entry. Those fields stay editable so an
 * editor can override them. The real card UI is rendered by `apps/web`; `edit`
 * only shows controls + a placeholder, and `save` returns null (dynamic block).
 */
(function (wp) {
  const el = wp.element.createElement;
  const { useState, useRef } = wp.element;
  const { __ } = wp.i18n;
  const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } =
    wp.blockEditor;
  const { PanelBody, TextControl, ComboboxControl, Button } = wp.components;
  const apiFetch = wp.apiFetch;

  // CPT subtype -> REST base + the meta key holding the artwork (imported from
  // the schema feed as an object with a `contentUrl`). Used by the follow-up
  // fetch that seeds the card background.
  const CONTENT = {
    movie: { base: 'movies', imageKey: '_movie_image' },
    tv_series: { base: 'tv-series', imageKey: '_tvseries_image' },
  };

  wp.blocks.registerBlockType('mosaic/card', {
    apiVersion: 3,
    title: __('Card'),
    description: __('Title card (logo, artwork and caption) from the Mosaic design system.'),
    category: 'design',
    icon: 'id-alt',
    attributes: {
      contentType: { type: 'string', enum: ['', 'movie', 'tv_series'], default: '' },
      contentId: { type: 'integer', default: 0 },
      label: { type: 'string', default: '' },
      imageSrc: { type: 'string', default: '' },
      imageAlt: { type: 'string', default: '' },
      backgroundSrc: { type: 'string', default: '' },
      href: { type: 'string', default: '' },
    },

    edit: function (props) {
      const { attributes, setAttributes } = props;
      const blockProps = useBlockProps();
      const [options, setOptions] = useState(
        // Seed the current selection so the Combobox shows its label.
        attributes.contentId
          ? [{ value: String(attributes.contentId), label: attributes.label || __('(selected)') }]
          : []
      );
      const timer = useRef(null);
      const results = useRef({}); // id -> { subtype, title, url }

      const search = (term) => {
        if (timer.current) clearTimeout(timer.current);
        if (!term) {
          setOptions([]);
          return;
        }
        timer.current = setTimeout(() => {
          apiFetch({
            path:
              '/wp/v2/search?type=post&subtype=movie,tv_series&per_page=20&search=' +
              encodeURIComponent(term),
          })
            .then((items) => {
              const next = [];
              items.forEach((item) => {
                results.current[item.id] = {
                  subtype: item.subtype,
                  title: item.title,
                  url: item.url,
                };
                next.push({ value: String(item.id), label: item.title });
              });
              setOptions(next);
            })
            .catch(() => setOptions([]));
        }, 300);
      };

      const select = (value) => {
        if (!value) {
          setAttributes({ contentType: '', contentId: 0 });
          return;
        }
        const id = parseInt(value, 10);
        const hit = results.current[id];
        const subtype = hit ? hit.subtype : attributes.contentType;
        // Store the reference and seed the title/link from the search result.
        setAttributes({
          contentType: subtype,
          contentId: id,
          label: hit ? hit.title : attributes.label,
          href: hit ? hit.url : attributes.href,
        });
        // Follow-up fetch for the artwork (stored in CPT meta) to seed the card
        // background, when the subtype exposes an image.
        const info = CONTENT[subtype];
        if (info) {
          apiFetch({ path: '/wp/v2/' + info.base + '/' + id })
            .then((entry) => {
              const image = entry && entry.meta && entry.meta[info.imageKey];
              const url = image && image.contentUrl;
              if (url) setAttributes({ backgroundSrc: url });
            })
            .catch(() => {});
        }
      };

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
                  { variant: 'secondary', onClick: open, style: { marginBottom: '8px' } },
                  attributes[key] ? __('Replace image') : __('Select image')
                ),
            })
          ),
          el(TextControl, {
            label: __(label),
            help: __('Choose from the Media Library above, or paste a URL.'),
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
            { title: __('Attached title') },
            el(ComboboxControl, {
              label: __('Movie / TV series'),
              help: __('Search the catalog and pick a title to attach.'),
              value: attributes.contentId ? String(attributes.contentId) : null,
              options: options,
              onFilterValueChange: search,
              onChange: select,
            })
          ),
          el(
            PanelBody,
            { title: __('Card content') },
            field('label', 'Caption', 'Seeded from the attached title; edit to override.'),
            field('href', 'Link URL', 'Leave empty to render the card without a link.')
          ),
          el(
            PanelBody,
            { title: __('Media'), initialOpen: false },
            mediaField('imageSrc', 'Logo image URL'),
            field('imageAlt', 'Logo alt text'),
            mediaField('backgroundSrc', 'Background image URL')
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
          el('div', { style: { fontSize: '11px', letterSpacing: '1px', opacity: 0.6, textTransform: 'uppercase' } }, __('Mosaic Card')),
          el(
            'div',
            { style: { fontSize: '20px', fontWeight: 700, marginTop: '6px', opacity: attributes.label ? 1 : 0.5 } },
            attributes.label || __('(attach a title or enter a caption)')
          ),
          attributes.contentId
            ? el(
                'div',
                { style: { marginTop: '8px', opacity: 0.6 } },
                (attributes.contentType === 'tv_series' ? __('TV series') : __('Movie')) +
                  ' #' +
                  attributes.contentId
              )
            : null
        )
      );
    },

    save: function () {
      return null;
    },
  });
})(window.wp);
