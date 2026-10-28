/**
 * Editor registration for `mosaic/brand-cards` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/BrandCards/BrandCards.types.ts`: a `title`
 * and CTA (`ctaLabel`/`ctaHref`) wrapping a repeatable `cards` array. Each card
 * is the same shape as the standalone `mosaic/card` block — a `movie`/`tv_series`
 * reference (`contentType` + `contentId`) plus the seeded, editable display
 * fields (`label`, `imageSrc`, `imageAlt`, `backgroundSrc`, `href`).
 *
 * The real section UI is rendered by `apps/web`; `edit` only shows Inspector
 * controls + a placeholder, and `save` returns null (dynamic block).
 */
(function (wp) {
  const el = wp.element.createElement;
  const { useState, useRef } = wp.element;
  const { __ } = wp.i18n;
  const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } =
    wp.blockEditor;
  const { PanelBody, TextControl, ComboboxControl, Button } = wp.components;

  // Shared-library media picker, registered by blocks/library-media.js and
  // listed as a script dependency in blocks.php. Guarded so the editor still
  // works if that script ever fails to load.
  const SharedMediaButton = (window.mosaicLibrary || {}).SharedMediaButton;

  const apiFetch = wp.apiFetch;

  // CPT subtype -> REST base + the meta key holding the artwork (imported from
  // the schema feed as an object with a `contentUrl`). Used by the follow-up
  // fetch that seeds a card background.
  const CONTENT = {
    movie: { base: 'movies', imageKey: '_movie_image' },
    tv_series: { base: 'tv-series', imageKey: '_tvseries_image' },
  };

  const emptyCard = () => ({
    contentType: '',
    contentId: 0,
    label: '',
    imageSrc: '',
    imageAlt: '',
    backgroundSrc: '',
    href: '',
  });

  /**
   * Inspector panel for a single card in the list. Defined once at module scope
   * (stable identity) and rendered per item with a `key`, so its search hooks
   * stay attached to the right row.
   */
  function CardRow(props) {
    const { card, index, total, onChange, onRemove, onMove } = props;
    const [options, setOptions] = useState(
      card.contentId
        ? [{ value: String(card.contentId), label: card.label || __('(selected)') }]
        : []
    );
    const timer = useRef(null);
    const results = useRef({}); // id -> { subtype, title, url }

    const set = (patch) => onChange(index, patch);

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
        set({ contentType: '', contentId: 0 });
        return;
      }
      const id = parseInt(value, 10);
      const hit = results.current[id];
      const subtype = hit ? hit.subtype : card.contentType;
      set({
        contentType: subtype,
        contentId: id,
        label: hit ? hit.title : card.label,
        href: hit ? hit.url : card.href,
      });
      const info = CONTENT[subtype];
      if (info) {
        apiFetch({ path: '/wp/v2/' + info.base + '/' + id })
          .then((entry) => {
            const image = entry && entry.meta && entry.meta[info.imageKey];
            const url = image && image.contentUrl;
            if (url) set({ backgroundSrc: url });
          })
          .catch(() => {});
      }
    };

    const field = (key, label, help) =>
      el(TextControl, {
        label: __(label),
        help: help ? __(help) : undefined,
        value: card[key],
        onChange: (value) => set({ [key]: value }),
      });

    const mediaField = (key, label) =>
      el(
        'div',
        { style: { marginBottom: '16px' } },
        el(
          MediaUploadCheck,
          null,
          el(MediaUpload, {
            allowedTypes: ['image'],
            onSelect: (media) => set({ [key]: media.url }),
            render: ({ open }) =>
              el(
                Button,
                { variant: 'secondary', onClick: open, style: { marginBottom: '8px' } },
                card[key] ? __('Replace image') : __('Select image')
              ),
          })
        ),
        SharedMediaButton
          ? el(SharedMediaButton, { onSelect: (url) => set({ [key]: url }) })
          : null,
        el(TextControl, {
          label: __(label),
          help: __('Choose from the Media Library or the shared library above, or paste a URL.'),
          value: card[key],
          onChange: (value) => set({ [key]: value }),
        })
      );

    return el(
      PanelBody,
      {
        title: (card.label || __('Card')) + ' — ' + (index + 1),
        initialOpen: false,
      },
      el(ComboboxControl, {
        label: __('Movie / TV series'),
        help: __('Search the catalog and pick a title to attach.'),
        value: card.contentId ? String(card.contentId) : null,
        options: options,
        onFilterValueChange: search,
        onChange: select,
      }),
      field('label', 'Caption', 'Seeded from the attached title; edit to override.'),
      field('href', 'Link URL', 'Leave empty to render the card without a link.'),
      mediaField('imageSrc', 'Logo image URL'),
      field('imageAlt', 'Logo alt text'),
      mediaField('backgroundSrc', 'Background image URL'),
      el(
        'div',
        { style: { display: 'flex', gap: '8px', marginTop: '8px' } },
        el(
          Button,
          { variant: 'tertiary', disabled: index === 0, onClick: () => onMove(index, -1) },
          __('Move up')
        ),
        el(
          Button,
          { variant: 'tertiary', disabled: index === total - 1, onClick: () => onMove(index, 1) },
          __('Move down')
        ),
        el(
          Button,
          { isDestructive: true, variant: 'tertiary', onClick: () => onRemove(index) },
          __('Remove')
        )
      )
    );
  }

  wp.blocks.registerBlockType('mosaic/brand-cards', {
    apiVersion: 3,
    title: __('Brand Cards'),
    description: __('Headline, a grid of brand/service-category cards and a CTA, from the Mosaic design system.'),
    category: 'design',
    icon: 'grid-view',
    attributes: {
      title: { type: 'string', default: '' },
      cards: { type: 'array', default: [], items: { type: 'object' } },
      ctaLabel: { type: 'string', default: '' },
      ctaHref: { type: 'string', default: '' },
    },

    edit: function (props) {
      const { attributes, setAttributes } = props;
      const blockProps = useBlockProps();
      const cards = attributes.cards || [];

      const updateCard = (index, patch) => {
        const next = cards.slice();
        next[index] = Object.assign({}, next[index], patch);
        setAttributes({ cards: next });
      };
      const removeCard = (index) => {
        const next = cards.slice();
        next.splice(index, 1);
        setAttributes({ cards: next });
      };
      const moveCard = (index, delta) => {
        const target = index + delta;
        if (target < 0 || target >= cards.length) return;
        const next = cards.slice();
        const [item] = next.splice(index, 1);
        next.splice(target, 0, item);
        setAttributes({ cards: next });
      };
      const addCard = () => setAttributes({ cards: cards.concat([emptyCard()]) });

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
            { title: __('Section') },
            field('title', 'Headline'),
            field('ctaLabel', 'CTA label', 'Leave empty to hide the CTA.'),
            field('ctaHref', 'CTA link URL', 'Leave empty to render a button instead of a link.')
          ),
          el(
            PanelBody,
            { title: __('Cards') },
            cards.map((card, i) =>
              el(CardRow, {
                key: i,
                card: card,
                index: i,
                total: cards.length,
                onChange: updateCard,
                onRemove: removeCard,
                onMove: moveCard,
              })
            ),
            el(
              Button,
              { variant: 'primary', onClick: addCard, style: { marginTop: '8px' } },
              __('Add card')
            )
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
          el(
            'div',
            { style: { fontSize: '11px', letterSpacing: '1px', opacity: 0.6, textTransform: 'uppercase' } },
            __('Mosaic Brand Cards')
          ),
          el(
            'div',
            { style: { fontSize: '20px', fontWeight: 700, marginTop: '6px', opacity: attributes.title ? 1 : 0.5 } },
            attributes.title || __('(headline)')
          ),
          el(
            'div',
            { style: { marginTop: '8px', opacity: 0.6 } },
            cards.length
              ? cards.length + ' ' + (cards.length === 1 ? __('card') : __('cards'))
              : __('(no cards yet — add one in the sidebar)')
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
