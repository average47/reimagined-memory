/**
 * Editor registration for `mosaic/collection-swimlane` (see ../blocks.php).
 *
 * Plain JS against the bundled `wp.*` globals — no JSX, no build step.
 * Attributes mirror `packages/ui/src/CollectionSwimlane/CollectionSwimlane.types.ts`;
 * each `items` entry also carries its attached content reference
 * (`contentType` + `contentId`).
 *
 * Every poster attaches a `movie` or `tv_series` via a search field: typing
 * queries the REST search endpoint scoped to those two subtypes; selecting a
 * result stores the reference and seeds the poster's `title`, `href` and
 * `imageSrc` from the chosen entry. Those fields stay editable so an editor can
 * override them. The real UI is rendered by `apps/web`; `edit` only shows
 * controls + a placeholder, and `save` returns null (dynamic block).
 */
(function (wp) {
  const el = wp.element.createElement;
  const { useState, useRef } = wp.element;
  const { __ } = wp.i18n;
  const { InspectorControls, useBlockProps, MediaUpload, MediaUploadCheck } =
    wp.blockEditor;
  const { PanelBody, TextControl, TextareaControl, ComboboxControl, Button } =
    wp.components;

  // Shared-library media picker, registered by blocks/library-media.js and
  // listed as a script dependency in blocks.php. Guarded so the editor still
  // works if that script ever fails to load.
  const SharedMediaButton = (window.mosaicLibrary || {}).SharedMediaButton;

  const apiFetch = wp.apiFetch;

  // CPT subtype -> REST base + the meta key holding the artwork (imported from
  // the schema feed as an object with a `contentUrl`). Used by the follow-up
  // fetch that seeds the poster image.
  const CONTENT = {
    movie: { base: 'movies', imageKey: '_movie_image' },
    tv_series: { base: 'tv-series', imageKey: '_tvseries_image' },
  };

  const EMPTY_ITEM = { contentType: '', contentId: 0, title: '', imageSrc: '', href: '' };

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
   * Inspector panel for one poster: the title search plus its display fields.
   * A component (not a helper) so each poster keeps its own search state.
   */
  function ItemPanel({ item, index, count, onChange, onMove, onRemove }) {
    const [options, setOptions] = useState(
      // Seed the current selection so the Combobox shows its label.
      item.contentId
        ? [{ value: String(item.contentId), label: item.title || __('(selected)') }]
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
          .then((hits) => {
            const next = [];
            hits.forEach((hit) => {
              results.current[hit.id] = {
                subtype: hit.subtype,
                title: hit.title,
                url: hit.url,
              };
              next.push({ value: String(hit.id), label: hit.title });
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
      const subtype = hit ? hit.subtype : item.contentType;
      // Store the reference and seed the title/link from the search result.
      onChange({
        contentType: subtype,
        contentId: id,
        title: hit ? hit.title : item.title,
        href: hit ? hit.url : item.href,
      });
      // Follow-up fetch for the artwork (stored in CPT meta) to seed the
      // poster image, when the subtype exposes one.
      const info = CONTENT[subtype];
      if (info) {
        apiFetch({ path: '/wp/v2/' + info.base + '/' + id })
          .then((entry) => {
            const image = entry && entry.meta && entry.meta[info.imageKey];
            const url = image && image.contentUrl;
            if (url) onChange({ imageSrc: url });
          })
          .catch(() => {});
      }
    };

    return el(
      PanelBody,
      {
        title: (index + 1) + '. ' + (item.title || __('(untitled)')),
        initialOpen: !item.title,
      },
      el(ComboboxControl, {
        label: __('Movie / TV series'),
        help: __('Search the catalog and pick a title to attach.'),
        value: item.contentId ? String(item.contentId) : null,
        options: options,
        onFilterValueChange: search,
        onChange: select,
      }),
      el(TextControl, {
        label: __('Title'),
        help: __('Seeded from the attached title; edit to override. Used as the poster’s alt text.'),
        value: item.title,
        onChange: (value) => onChange({ title: value }),
      }),
      el(TextControl, {
        label: __('Link URL'),
        help: __('Leave empty to render the poster without a link.'),
        value: item.href,
        onChange: (value) => onChange({ href: value }),
      }),
      mediaField(item.imageSrc, 'Poster image URL', (value) => onChange({ imageSrc: value })),
      el(
        'div',
        { style: { display: 'flex', gap: '8px' } },
        el(Button, { variant: 'secondary', disabled: index === 0, onClick: () => onMove(-1) }, __('Move up')),
        el(Button, { variant: 'secondary', disabled: index === count - 1, onClick: () => onMove(1) }, __('Move down')),
        el(Button, { variant: 'tertiary', isDestructive: true, onClick: onRemove }, __('Remove'))
      )
    );
  }

  wp.blocks.registerBlockType('mosaic/collection-swimlane', {
    apiVersion: 3,
    title: __('Collection Swimlane'),
    description: __('Intro, CTA and a scrolling row of title posters from the Mosaic design system.'),
    category: 'design',
    icon: 'images-alt2',
    attributes: {
      backgroundSrc: { type: 'string', default: '' },
      title: { type: 'string', default: '' },
      description: { type: 'string', default: '' },
      ctaLabel: { type: 'string', default: '' },
      ctaHref: { type: 'string', default: '' },
      swimlaneTitle: { type: 'string', default: '' },
      items: { type: 'array', default: [] },
    },

    edit: function (props) {
      const { attributes, setAttributes } = props;
      const blockProps = useBlockProps();
      const items = attributes.items || [];
      // Latest items, so async patches (the artwork fetch) don't write back a
      // stale copy of the array captured at render time.
      const latest = useRef(items);
      latest.current = items;

      const field = (Control, key, label, help) =>
        el(Control, {
          label: __(label),
          help: help ? __(help) : undefined,
          value: attributes[key],
          onChange: (value) => setAttributes({ [key]: value }),
        });

      // Items are an array attribute, so every edit writes a fresh copy.
      const updateItem = (index, patch) =>
        setAttributes({
          items: latest.current.map((item, i) =>
            i === index ? Object.assign({}, item, patch) : item
          ),
        });
      const moveItem = (index, delta) => {
        const next = items.slice();
        const [moved] = next.splice(index, 1);
        next.splice(index + delta, 0, moved);
        setAttributes({ items: next });
      };
      const removeItem = (index) =>
        setAttributes({ items: items.filter((_, i) => i !== index) });
      const addItem = () => setAttributes({ items: items.concat([Object.assign({}, EMPTY_ITEM)]) });

      return el(
        'div',
        blockProps,
        el(
          InspectorControls,
          null,
          el(
            PanelBody,
            { title: __('Intro') },
            field(TextControl, 'title', 'Headline'),
            field(TextareaControl, 'description', 'Subheader'),
            field(TextControl, 'ctaLabel', 'CTA label'),
            field(TextControl, 'ctaHref', 'CTA link URL', 'Leave empty to render a button instead of a link.')
          ),
          el(
            PanelBody,
            { title: __('Swimlane') },
            field(TextControl, 'swimlaneTitle', 'Swimlane heading'),
            el(Button, { variant: 'primary', onClick: addItem }, __('Add title'))
          ),
          items.map((item, index) =>
            el(ItemPanel, {
              // Posters have no stable id; re-key on the attachment so a moved or
              // removed poster's search state doesn't leak onto its neighbour.
              key: index + ':' + (item.contentId || 0),
              item: Object.assign({}, EMPTY_ITEM, item),
              index: index,
              count: items.length,
              onChange: (patch) => updateItem(index, patch),
              onMove: (delta) => moveItem(index, delta),
              onRemove: () => removeItem(index),
            })
          ),
          el(
            PanelBody,
            { title: __('Media'), initialOpen: false },
            mediaField(attributes.backgroundSrc, 'Background image URL', (value) =>
              setAttributes({ backgroundSrc: value })
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
          el('div', { style: { fontSize: '11px', letterSpacing: '1px', opacity: 0.6, textTransform: 'uppercase' } }, __('Mosaic Collection Swimlane')),
          // Headline is required — show a muted placeholder only while empty.
          el(
            'div',
            { style: { fontSize: '20px', fontWeight: 700, marginTop: '6px', opacity: attributes.title ? 1 : 0.5 } },
            attributes.title || __('(headline)')
          ),
          attributes.description
            ? el('div', { style: { marginTop: '8px' } }, attributes.description)
            : null,
          attributes.ctaLabel
            ? el('div', { style: { marginTop: '12px', opacity: 0.8 } }, '[ ' + attributes.ctaLabel + ' ]')
            : null,
          el(
            'div',
            { style: { marginTop: '12px', opacity: 0.6 } },
            (attributes.swimlaneTitle ? attributes.swimlaneTitle + ' · ' : '') +
              items.length +
              ' ' +
              (items.length === 1 ? __('title') : __('titles'))
          )
        )
      );
    },

    save: function () {
      return null;
    },
  });
})(window.wp);
