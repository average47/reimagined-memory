/**
 * Editor registration for `mosaic/brand-cards` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/BrandCards/BrandCards.types.ts`: the
 * headline + CTA strings, and `cards`, an array with one object per Card.
 *
 * Each card has the same attach-a-title search as `mosaic/card`: typing queries
 * the REST search endpoint scoped to the `movie`/`tv_series` subtypes; selecting
 * a result stores the reference (`contentType` + `contentId`) and seeds the
 * card's `label`, `href` and `backgroundSrc`, which stay editable. The real UI
 * is rendered by `apps/web`; `edit` only shows controls + a placeholder, and
 * `save` returns null (dynamic block).
 */
(function (wp) {
  const el = wp.element.createElement;
  const { useState, useRef } = wp.element;
  const { __, sprintf } = wp.i18n;
  const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } =
    wp.blockEditor;
  const { PanelBody, TextControl, ComboboxControl, Button, Flex } = wp.components;

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
      // Artwork uploaded to the shared library, reusable from every
      // microsite without copying the file into this site's uploads.
      SharedMediaButton ? el(SharedMediaButton, { onSelect: onChange }) : null,
      el(TextControl, {
        label: __(label),
        help: __('Choose from the Media Library or the shared library above, or paste a URL.'),
        value: value,
        onChange: onChange,
      })
    );

  /**
   * Inspector panel for one card. A component (not a helper) so each card keeps
   * its own search results and debounce timer.
   */
  function CardPanel(props) {
    const { card, index, count, update, move, remove } = props;
    const [options, setOptions] = useState(
      // Seed the current selection so the Combobox shows its label.
      card.contentId
        ? [{ value: String(card.contentId), label: card.label || __('(selected)') }]
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
        update(index, { contentType: '', contentId: 0 });
        return;
      }
      const id = parseInt(value, 10);
      const hit = results.current[id];
      const subtype = hit ? hit.subtype : card.contentType;
      // Store the reference and seed the caption/link from the search result.
      update(index, {
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
            if (url) update(index, { backgroundSrc: url });
          })
          .catch(() => {});
      }
    };

    const field = (key, label, help) =>
      el(TextControl, {
        label: __(label),
        help: help ? __(help) : undefined,
        value: card[key],
        onChange: (value) => update(index, { [key]: value }),
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
        options: options,
        onFilterValueChange: search,
        onChange: select,
      }),
      field('label', 'Caption', 'Seeded from the attached title; edit to override.'),
      field('href', 'Link URL', 'Leave empty to render the card without a link.'),
      mediaField(card.imageSrc, 'Logo image URL', (value) => update(index, { imageSrc: value })),
      field('imageAlt', 'Logo alt text'),
      mediaField(card.backgroundSrc, 'Background image URL', (value) =>
        update(index, { backgroundSrc: value })
      ),
      el(
        Flex,
        { justify: 'flex-start' },
        el(Button, { variant: 'secondary', disabled: index === 0, onClick: () => move(index, -1) }, __('Move up')),
        el(
          Button,
          { variant: 'secondary', disabled: index === count - 1, onClick: () => move(index, 1) },
          __('Move down')
        ),
        el(Button, { variant: 'secondary', isDestructive: true, onClick: () => remove(index) }, __('Remove'))
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

      // Always read the latest cards: the artwork fetch in CardPanel resolves
      // after an earlier update, so a closed-over array would drop that edit.
      const cardsRef = useRef(attributes.cards);
      cardsRef.current = attributes.cards;

      const setCards = (next) => {
        cardsRef.current = next;
        setAttributes({ cards: next });
      };
      const update = (index, patch) => {
        const next = cardsRef.current.slice();
        next[index] = Object.assign({}, next[index], patch);
        setCards(next);
      };
      const move = (index, delta) => {
        const next = cardsRef.current.slice();
        const [card] = next.splice(index, 1);
        next.splice(index + delta, 0, card);
        setCards(next);
      };
      const remove = (index) => setCards(cardsRef.current.filter((_, i) => i !== index));
      const add = () => setCards(cardsRef.current.concat([Object.assign({}, EMPTY_CARD)]));

      const field = (key, label, help) =>
        el(TextControl, {
          label: __(label),
          help: help ? __(help) : undefined,
          value: attributes[key],
          onChange: (value) => setAttributes({ [key]: value }),
        });

      const cards = attributes.cards;

      return el(
        'div',
        blockProps,
        el(
          InspectorControls,
          null,
          el(
            PanelBody,
            { title: __('Section content') },
            field('title', 'Headline'),
            field('ctaLabel', 'CTA label', 'Leave empty to hide the CTA.'),
            field('ctaHref', 'CTA link URL', 'Leave empty to render a button instead of a link.')
          ),
          cards.map((card, index) =>
            // Keyed by position: after a move/remove a panel may keep another
            // card's transient search results, which is harmless.
            el(CardPanel, {
              key: index,
              card: card,
              index: index,
              count: cards.length,
              update: update,
              move: move,
              remove: remove,
            })
          ),
          el(
            PanelBody,
            { title: __('Cards') },
            el(Button, { variant: 'primary', onClick: add }, __('Add card'))
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
            attributes.title || __('(headline)')
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
                    card.label || sprintf(__('Card %d'), index + 1)
                  )
                )
              : el('div', { style: { opacity: 0.5 } }, __('(add cards in the sidebar)'))
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
