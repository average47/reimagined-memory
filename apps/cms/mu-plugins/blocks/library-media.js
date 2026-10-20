/**
 * Shared-library media picker.
 *
 * WordPress's own `MediaUpload` only ever shows the *current* site's media
 * library, which in Multisite means a brand editor cannot reach artwork
 * uploaded to the shared library. This adds a second button that browses the
 * library site over `mosaic/v1/library/media` (see
 * `mu-plugins/shared-library.php`) and hands back an absolute URL.
 *
 * An absolute URL is all the blocks need: uploads are served from one origin,
 * so a library URL resolves from every tenant without copying the file.
 *
 * Exposed as `window.mosaicLibrary.SharedMediaButton` for the block editors to
 * compose into their own media fields. Plain JS against the bundled `wp.*`
 * globals — no JSX, no build step.
 */
(function () {
  const { createElement: el, useState, useEffect, useCallback } = wp.element;
  const { Button, Modal, SearchControl, Spinner } = wp.components;
  const { __ } = wp.i18n;
  const apiFetch = wp.apiFetch;

  /** Debounce delay for the search field, in ms. */
  const SEARCH_DEBOUNCE = 300;

  /**
   * Grid of the shared library's images, with a search field.
   *
   * @param {{onPick: (url: string, item: object) => void, onClose: () => void}} props
   */
  function LibraryBrowser({ onPick, onClose }) {
    const [term, setTerm] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback((search) => {
      setLoading(true);
      setError(null);
      apiFetch({
        path:
          '/mosaic/v1/library/media?per_page=40&mime=image' +
          (search ? '&search=' + encodeURIComponent(search) : ''),
      })
        .then((res) => {
          setItems(Array.isArray(res && res.items) ? res.items : []);
          setLoading(false);
        })
        .catch((e) => {
          setError(e && e.message ? e.message : String(e));
          setLoading(false);
        });
    }, []);

    // Debounce so typing doesn't fire a request per keystroke.
    useEffect(() => {
      const id = setTimeout(() => load(term), SEARCH_DEBOUNCE);
      return () => clearTimeout(id);
    }, [term, load]);

    let body;
    if (loading) {
      body = el(
        'div',
        { style: { padding: '32px', textAlign: 'center' } },
        el(Spinner)
      );
    } else if (error) {
      body = el(
        'p',
        { style: { color: '#b32d2e' } },
        __('Could not load the shared library: ') + error
      );
    } else if (items.length === 0) {
      body = el(
        'p',
        null,
        term
          ? __('No shared images match that search.')
          : __('The shared library has no images yet.')
      );
    } else {
      body = el(
        'div',
        {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '12px',
          },
        },
        items.map((item) => {
          // Prefer a generated thumbnail for the grid; hand back the full URL.
          const thumb =
            (item.sizes && item.sizes.thumbnail && item.sizes.thumbnail.url) ||
            item.url;
          return el(
            'button',
            {
              key: item.id,
              type: 'button',
              onClick: () => {
                onPick(item.url, item);
                onClose();
              },
              title: item.title || item.url,
              style: {
                padding: 0,
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                aspectRatio: '1 / 1',
              },
            },
            el('img', {
              src: thumb,
              alt: item.alt || item.title || '',
              loading: 'lazy',
              style: { width: '100%', height: '100%', objectFit: 'cover' },
            })
          );
        })
      );
    }

    return el(
      Modal,
      { title: __('Shared library'), onRequestClose: onClose, size: 'large' },
      el(SearchControl, {
        value: term,
        onChange: setTerm,
        label: __('Search shared images'),
        placeholder: __('Search shared images…'),
        __nextHasNoMarginBottom: true,
      }),
      el('div', { style: { marginTop: '16px' } }, body)
    );
  }

  /**
   * Button that opens the shared-library browser.
   *
   * @param {{onSelect: (url: string, item: object) => void, label?: string}} props
   */
  function SharedMediaButton({ onSelect, label }) {
    const [open, setOpen] = useState(false);

    return el(
      wp.element.Fragment,
      null,
      el(
        Button,
        {
          variant: 'secondary',
          onClick: () => setOpen(true),
          style: { marginBottom: '8px', marginLeft: '8px' },
        },
        label || __('Shared library')
      ),
      open &&
        el(LibraryBrowser, {
          onPick: onSelect,
          onClose: () => setOpen(false),
        })
    );
  }

  window.mosaicLibrary = window.mosaicLibrary || {};
  window.mosaicLibrary.SharedMediaButton = SharedMediaButton;
})();
