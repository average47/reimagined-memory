/**
 * Editor registration for `mosaic/brand-cards` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/BrandCards/BrandCards.types.ts`: a
 * headline, a CTA, and a `cards` array whose items carry the same fields as
 * `mosaic/card` (including the attached `contentType` + `contentId`).
 *
 * Each card has its own search field, same as `mosaic/card`: typing queries the
 * REST search endpoint scoped to the `movie`/`tv_series` subtypes; selecting a
 * result stores the reference and seeds that card's `label`, `href` and
 * `backgroundSrc`, which stay editable. Cards can be added, removed and
 * reordered from the Inspector. The real UI is rendered by `apps/web`; `edit`
 * only shows controls + a placeholder, and `save` returns null (dynamic block).
 */
(function (wp) {
  const el = wp.element.createElement;
  const { useState, useRef } = wp.element;
  const { __, sprintf } = wp.i18n;
  const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } =
    wp.blockEditor;
  const { PanelBody, TextControl, ComboboxControl, Button } = wp.components;

  // Shared-library media picker, registered by blocks/library-media.js and
  // listed as a script dependency in blocks.php. Guarded so the editor still
  // works if that script ever fails to load.
  const SharedMediaButton = (window.mosaicLibrary || {}).SharedMediaButton;

  const apiFetch = wp.apiFetch;

  // CPT subtype -> REST base + the meta key holding the artwork (imported from
  // the schema feed as an object with a `contentUrl`). Same as card-editor.js.
  const CONTENT = {
    movie: { base: 'movies', imageKey: '_movie_image' },
    tv_series: { base: 'tv-series', imageKey: '_tvseries_image' },
  };

  const EMPTY_CARD = {
    contentType: '',
    contentId: 0,
    label: '',
    imageSrc: '',
    imageAlt: '',
    backgroundSrc: '',
    href: '',
  };

  // Media field: pick from the WordPress Media Library or the shared library
  // (writes the chosen URL), OR paste a URL into the text input.
  function mediaField(value, label, onChange) {
    return el(
      'div',
      { style: { marginBottom: '16px' } },
      el(
        MediaUploadCheck,
        null,
        el(MediaUpload, {
          allowedTypes: ['image'],
          onSelect: (media) => onChange(media.url),
          render: ({ open }) =>
            el(
              Button,
              { variant: 'secondary', onClick: open, style: { marginBottom: '8px' } },
              value ? __('Replace image') : __('Select image')
            ),
        })
      ),
      SharedMediaButton ? el(SharedMediaButton, { onSelect: onChange }) : null,
      el(TextControl, {
        label: __(label),
        help: __('Choose from the Media Library or the shared library above, or paste a URL.'),
        value: value,
        onChange: onChange,
      })
    );
  }

  /**
   * Inspector fields for one card. A component (not a plain helper) so each
   * card keeps its own search state.
   */
  function CardFields(props) {
    const { card, index, count, onChange, onMove, onRemove } = props;
    const [options, setOptions] = useState([]);
    // Always include the current selection so the Combobox shows its label
    // (also after a reorder hands this panel a different card).
    const selected = card.contentId
      ? { value: String(card.contentId), label: card.label || __('(selected)') }
      : null;
    const allOptions =
      selected && !options.some((option) => option.value === selected.value)
        ? [selected].concat(options)
        : options;
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
        onChange({ contentType: '', contentId: 0 });
        return;
      }
      const id = parseInt(value, 10);
      const hit = results.current[id];
      const subtype = hit ? hit.subtype : card.contentType;
      // Store the reference and seed the caption/link from the search result.
      onChange({
        contentType: subtype,
        contentId: id,
        label: hit ? hit.title : card.label,
        href: hit ? hit.url : card.href,
      });
      // Follow-up fetch for the artwork (stored in CPT meta) to seed the card
      // background, when the subtype exposes an image.
      const info = CONTENT[subtype];
      if (info) {
        apiFetch({ path: '/wp/v2/' + info.base + '/' + id })
          .then((entry) => {
            const image = entry && entry.meta && entry.meta[info.imageKey];
            const url = image && image.contentUrl;
            if (url) onChange({ backgroundSrc: url });
          })
          .catch(() => {});
      }
    };

    const field = (key, label, help) =>
      el(TextControl, {
        label: __(label),
        help: help ? __(help) : undefined,
        value: card[key] || '',
        onChange: (value) => onChange({ [key]: value }),
      });

    return el(
      PanelBody,
      {
        /* translators: 1: card position, 2: card caption. */
        title: sprintf(__('Card %1$d: %2$s'), index + 1, card.label || __('(untitled)')),
        initialOpen: false,
      },
      el(ComboboxControl, {
        label: __('Movie / TV series'),
        help: __('Search the catalog and pick a title to attach.'),
        value: card.contentId ? String(card.contentId) : null,
        options: allOptions,
        onFilterValueChange: search,
        onChange: select,
      }),
      field('label', 'Caption', 'Seeded from the attached title; edit to override.'),
      field('href', 'Link URL', 'Leave empty to render the card without a link.'),
      mediaField(card.imageSrc || '', 'Logo image URL', (url) => onChange({ imageSrc: url })),
      field('imageAlt', 'Logo alt text'),
      mediaField(card.backgroundSrc || '', 'Background image URL', (url) =>
        onChange({ backgroundSrc: url })
      ),
      el(
        'div',
        { style: { display: 'flex', gap: '8px' } },
        el(Button, { variant: 'secondary', disabled: index === 0, onClick: () => onMove(-1) }, __('Move up')),
        el(
          Button,
          { variant: 'secondary', disabled: index === count - 1, onClick: () => onMove(1) },
          __('Move down')
        ),
        el(Button, { variant: 'secondary', isDestructive: true, onClick: onRemove }, __('Remove'))
      )
    );
  }

  wp.blocks.registerBlockType('mosaic/brand-cards', {
    apiVersion: 3,
    title: __('Brand Cards'),
    description: __('Headline, a row of brand cards and a CTA from the Mosaic design system.'),
    category: 'design',
    icon: 'grid-view',
    attributes: {
      title: { type: 'string', default: '' },
      cards: { type: 'array', default: [] },
      ctaLabel: { type: 'string', default: '' },
      ctaHref: { type: 'string', default: '' },
    },

    edit: function (props) {
      const { attributes, setAttributes } = props;
      const blockProps = useBlockProps();
      const cards = attributes.cards || [];
      // Latest cards for async updates (the artwork fetch resolves after the
      // selection has already been saved, so the render-time array is stale).
      const cardsRef = useRef(cards);
      cardsRef.current = cards;

      const updateCard = (index, patch) =>
        setAttributes({
          cards: cardsRef.current.map((card, i) =>
            i === index ? Object.assign({}, card, patch) : card
          ),
        });
      const moveCard = (index, delta) => {
        const next = cards.slice();
        const [card] = next.splice(index, 1);
        next.splice(index + delta, 0, card);
        setAttributes({ cards: next });
      };
      const removeCard = (index) =>
        setAttributes({ cards: cards.filter((_, i) => i !== index) });
      const addCard = () =>
        setAttributes({ cards: cards.concat([Object.assign({}, EMPTY_CARD)]) });

      const field = (key, label, help) =>
        el(TextControl, {
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
            { title: __('Content') },
            field('title', 'Headline'),
            field('ctaLabel', 'CTA label', 'Leave empty to hide the CTA.'),
            field('ctaHref', 'CTA link URL')
          ),
          cards.map((card, index) =>
            el(CardFields, {
              // Keyed by position: keying on editable fields would remount
              // (and collapse) the panel on every keystroke.
              key: index,
              card: card,
              index: index,
              count: cards.length,
              onChange: (patch) => updateCard(index, patch),
              onMove: (delta) => moveCard(index, delta),
              onRemove: () => removeCard(index),
            })
          ),
          el(
            PanelBody,
            { title: __('Cards'), initialOpen: cards.length === 0 },
            el(Button, { variant: 'primary', onClick: addCard }, __('Add card'))
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
          el('div', { style: { fontSize: '11px', letterSpacing: '1px', opacity: 0.6, textTransform: 'uppercase' } }, __('Mosaic Brand Cards')),
          el(
            'div',
            { style: { fontSize: '20px', fontWeight: 700, marginTop: '6px', opacity: attributes.title ? 1 : 0.5 } },
            attributes.title || __('(enter a headline)')
          ),
          el(
            'div',
            { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '12px' } },
            cards.length
              ? cards.map((card, index) =>
                  el(
                    'div',
                    {
                      key: index,
                      style: { padding: '8px 12px', border: '1px solid currentColor', borderRadius: '8px', opacity: 0.8 },
                    },
                    card.label || __('(untitled card)')
                  )
                )
              : el('div', { style: { opacity: 0.5 } }, __('(add cards in the sidebar)'))
          ),
          attributes.ctaLabel
            ? el('div', { style: { marginTop: '12px', fontWeight: 700 } }, attributes.ctaLabel)
            : null
        )
      );
    },

    save: function () {
      return null;
    },
  });
})(window.wp);
