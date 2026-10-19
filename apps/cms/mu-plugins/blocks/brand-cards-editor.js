/**
 * Editor registration for `mosaic/brand-cards` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/BrandCards/BrandCards.types.ts`: the
 * headline + CTA, and a `cards` array whose items mirror `BrandCardsItem`
 * (the Card display fields) plus each card's attached content reference
 * (`contentType` + `contentId`).
 *
 * Every card has the same search field as `mosaic/card`: typing queries the
 * REST search endpoint scoped to `movie`/`tv_series`; selecting a result stores
 * the reference and seeds that card's `label`, `href` and `backgroundSrc`. Those
 * fields stay editable so an editor can override them. The real UI is rendered
 * by `apps/web`; `edit` only shows controls + a placeholder, and `save` returns
 * null (dynamic block).
 */
(function (wp) {
  const el = wp.element.createElement;
  const { useState, useRef } = wp.element;
  const { __, sprintf } = wp.i18n;
  const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } =
    wp.blockEditor;
  const { PanelBody, TextControl, ComboboxControl, Button, Flex } = wp.components;
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

  // Media field: pick from the WordPress Media Library (writes the chosen
  // attachment's URL) OR paste a URL into the text input.
  const mediaField = (value, label, onChange) =>
    el(
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
      el(TextControl, {
        label: __(label),
        help: __('Choose from the Media Library above, or paste a URL.'),
        value: value,
        onChange: onChange,
      })
    );

  /**
   * Inspector fields for one card. A component (not a helper) so each card
   * keeps its own search state.
   */
  function CardFields({ card, index, count, update, move, remove }) {
    const [options, setOptions] = useState([]);
    // Always include the current selection so the Combobox shows its label —
    // derived rather than seeded, so it stays right after cards are reordered.
    const current = card.contentId
      ? { value: String(card.contentId), label: card.label || __('(selected)') }
      : null;
    const shown =
      current && !options.some((option) => option.value === current.value)
        ? [current].concat(options)
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
        update({ contentType: '', contentId: 0 });
        return;
      }
      const id = parseInt(value, 10);
      const hit = results.current[id];
      const subtype = hit ? hit.subtype : card.contentType;
      // Store the reference and seed the caption/link from the search result.
      update({
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
            if (url) update({ backgroundSrc: url });
          })
          .catch(() => {});
      }
    };

    const field = (key, label, help) =>
      el(TextControl, {
        label: __(label),
        help: help ? __(help) : undefined,
        value: card[key],
        onChange: (value) => update({ [key]: value }),
      });

    return el(
      PanelBody,
      {
        title: sprintf(__('Card %d'), index + 1) + (card.label ? ' — ' + card.label : ''),
        initialOpen: false,
      },
      el(ComboboxControl, {
        label: __('Movie / TV series'),
        help: __('Search the catalog and pick a title to attach.'),
        value: card.contentId ? String(card.contentId) : null,
        options: shown,
        onFilterValueChange: search,
        onChange: select,
      }),
      field('label', 'Caption', 'Seeded from the attached title; edit to override.'),
      field('href', 'Link URL', 'Leave empty to render the card without a link.'),
      mediaField(card.imageSrc, 'Logo image URL', (value) => update({ imageSrc: value })),
      field('imageAlt', 'Logo alt text'),
      mediaField(card.backgroundSrc, 'Background image URL', (value) =>
        update({ backgroundSrc: value })
      ),
      el(
        Flex,
        { justify: 'flex-start' },
        el(Button, { variant: 'secondary', disabled: index === 0, onClick: () => move(-1) }, __('Move up')),
        el(
          Button,
          { variant: 'secondary', disabled: index === count - 1, onClick: () => move(1) },
          __('Move down')
        ),
        el(Button, { variant: 'tertiary', isDestructive: true, onClick: remove }, __('Remove'))
      )
    );
  }

  wp.blocks.registerBlockType('mosaic/brand-cards', {
    apiVersion: 3,
    title: __('Brand Cards'),
    description: __('Headline, a row of cards and a CTA from the Mosaic design system.'),
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

      const field = (key, label, help) =>
        el(TextControl, {
          label: __(label),
          help: help ? __(help) : undefined,
          value: attributes[key],
          onChange: (value) => setAttributes({ [key]: value }),
        });

      // Cards are stored as one array attribute, so every edit writes a copy.
      const updateCard = (index, patch) =>
        setAttributes({
          cards: cards.map((card, i) => (i === index ? Object.assign({}, card, patch) : card)),
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

      return el(
        'div',
        blockProps,
        el(
          InspectorControls,
          null,
          el(
            PanelBody,
            { title: __('Brand Cards content') },
            field('title', 'Headline'),
            field('ctaLabel', 'CTA label', 'Leave empty to hide the CTA.'),
            field('ctaHref', 'CTA link URL', 'Leave empty to render a button instead of a link.')
          ),
          cards.map((card, index) =>
            el(CardFields, {
              // Cards have no stable id; index keys keep the panel (and input
              // focus) mounted while its fields are edited.
              key: index,
              card: card,
              index: index,
              count: cards.length,
              update: (patch) => updateCard(index, patch),
              move: (delta) => moveCard(index, delta),
              remove: () => removeCard(index),
            })
          ),
          el(
            PanelBody,
            null,
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
          // Headline is required — show a muted placeholder only while empty.
          el(
            'div',
            { style: { fontSize: '20px', fontWeight: 700, marginTop: '6px', opacity: attributes.title ? 1 : 0.5 } },
            attributes.title || __('(headline)')
          ),
          el(
            'div',
            {
              style: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '12px',
              },
            },
            cards.length
              ? cards.map((card, index) =>
                  el(
                    'div',
                    {
                      key: index,
                      style: {
                        padding: '12px',
                        border: '1px solid currentColor',
                        borderRadius: '8px',
                        minWidth: '96px',
                        opacity: card.label ? 0.8 : 0.5,
                      },
                    },
                    card.label || __('(card)')
                  )
                )
              : el('div', { style: { opacity: 0.5 } }, __('(add cards in the block settings)'))
          ),
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
