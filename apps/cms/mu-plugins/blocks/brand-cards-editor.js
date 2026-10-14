/**
 * Editor registration for `mosaic/brand-cards` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/BrandCards/BrandCards.types.ts`.
 *
 * Each card attaches a `movie` or `tv_series` via a search field: typing queries
 * the REST search endpoint scoped to those two subtypes; selecting a result
 * stores a reference (`contentType` + `contentId`) and seeds the card's display
 * fields (`label`, `backgroundSrc`, `href`) from the chosen entry. The real card
 * UI is rendered by `apps/web`; `edit` only shows controls + a placeholder, and
 * `save` returns null (dynamic block).
 */
(function (wp) {
  const el = wp.element.createElement;
  const { useState, useRef } = wp.element;
  const { __ } = wp.i18n;
  const { InspectorControls, useBlockProps } = wp.blockEditor;
  const { PanelBody, TextControl, ComboboxControl, Button } = wp.components;
  const apiFetch = wp.apiFetch;

  // CPT subtype -> REST base + the meta key holding the artwork (imported from
  // the schema feed as an object with a `contentUrl`). Used by the per-item
  // fetch that seeds the card background.
  const CONTENT = {
    movie: { base: 'movies', imageKey: '_movie_image' },
    tv_series: { base: 'tv-series', imageKey: '_tvseries_image' },
  };

  // One card's controls: a debounced movie/tv_series search + a remove button.
  function CardEditor(props) {
    const { card, onChange, onRemove, index } = props;
    const [options, setOptions] = useState(
      // Seed the current selection so the Combobox shows its label.
      card.contentId
        ? [{ value: String(card.contentId), label: card.label || '(selected)' }]
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
        onChange({ contentType: '', contentId: 0, label: '', backgroundSrc: '', href: '' });
        return;
      }
      const id = parseInt(value, 10);
      const hit = results.current[id];
      const subtype = hit ? hit.subtype : card.contentType;
      // Base reference + title/link seeded from the search result.
      const next = {
        contentType: subtype,
        contentId: id,
        label: hit ? hit.title : card.label,
        href: hit ? hit.url : card.href,
        backgroundSrc: card.backgroundSrc,
      };
      onChange(next);
      // Follow-up fetch for the artwork (stored in CPT meta) to seed the card
      // background, when the subtype exposes an image.
      const info = CONTENT[subtype];
      if (info) {
        apiFetch({ path: '/wp/v2/' + info.base + '/' + id })
          .then((entry) => {
            const image = entry && entry.meta && entry.meta[info.imageKey];
            const url = image && image.contentUrl;
            if (url) onChange({ ...next, backgroundSrc: url });
          })
          .catch(() => {});
      }
    };

    return el(
      'div',
      { style: { borderTop: '1px solid #e0e0e0', paddingTop: '12px', marginTop: '12px' } },
      el('div', { style: { fontSize: '11px', opacity: 0.6, marginBottom: '4px' } }, __('Card') + ' ' + (index + 1)),
      el(ComboboxControl, {
        label: __('Movie / TV series'),
        help: __('Search the catalog and pick a title to attach.'),
        value: card.contentId ? String(card.contentId) : null,
        options: options,
        onFilterValueChange: search,
        onChange: select,
      }),
      el(
        Button,
        { variant: 'tertiary', isDestructive: true, onClick: onRemove },
        __('Remove card')
      )
    );
  }

  wp.blocks.registerBlockType('mosaic/brand-cards', {
    apiVersion: 3,
    title: __('Brand Cards'),
    description: __('Brand/category card row from the Mosaic design system.'),
    category: 'design',
    icon: 'grid-view',
    attributes: {
      headline: { type: 'string', default: '' },
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

      const updateCard = (i, patch) => {
        const next = cards.slice();
        next[i] = Object.assign({}, next[i], patch);
        setAttributes({ cards: next });
      };
      const removeCard = (i) => {
        const next = cards.slice();
        next.splice(i, 1);
        setAttributes({ cards: next });
      };
      const addCard = () =>
        setAttributes({
          cards: cards.concat([{ contentType: '', contentId: 0, label: '' }]),
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
            field('headline', 'Headline'),
            field('ctaLabel', 'CTA label'),
            field('ctaHref', 'CTA link URL', 'Leave empty to render a button instead of a link.')
          ),
          el(
            PanelBody,
            { title: __('Cards') },
            cards.map((card, i) =>
              el(CardEditor, {
                key: i,
                index: i,
                card: card,
                onChange: (patch) => updateCard(i, patch),
                onRemove: () => removeCard(i),
              })
            ),
            el(
              Button,
              { variant: 'primary', onClick: addCard, style: { marginTop: '12px' } },
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
          el('div', { style: { fontSize: '11px', letterSpacing: '1px', opacity: 0.6, textTransform: 'uppercase' } }, __('Mosaic Brand Cards')),
          el(
            'div',
            { style: { fontSize: '20px', fontWeight: 700, marginTop: '6px', opacity: attributes.headline ? 1 : 0.5 } },
            attributes.headline || __('(headline)')
          ),
          el(
            'div',
            { style: { marginTop: '8px', opacity: 0.8 } },
            cards.length
              ? cards.map((c, i) => el('div', { key: i }, '• ' + (c.label || __('(unattached card)'))))
              : el('em', null, __('No cards yet — add one and attach a title.'))
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
