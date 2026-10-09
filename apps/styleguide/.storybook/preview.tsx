import type { Decorator, Preview } from '@storybook/react-vite';
import '../src/styles.css';

const BRANDS = ['amcplus', 'shudder', 'acorn', 'sundancenow', 'wetv'] as const;

/**
 * Resolve the brand implied by the current URL, so stories pick up that
 * domain's theming via the `[data-brand]` token overrides (colors.css). When
 * this app is proxied under a brand site (e.g. amcplus.localhost/styleguide)
 * the brand comes from the subdomain; a `?brand=` query param overrides it for
 * standalone use. Returns undefined for the white-label defaults.
 */
function brandFromUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const list = BRANDS as readonly string[];

  const override = new URLSearchParams(window.location.search).get('brand');
  if (override && list.includes(override)) return override;

  const subdomain = window.location.hostname.split('.')[0] ?? '';
  return list.includes(subdomain) ? subdomain : undefined;
}

// Wraps every story. `data-brand` activates the matching token overrides; the
// base font + text token render components in context. The Brand toolbar wins
// unless left on `auto`, which defers to the brand in the URL.
const withBrand: Decorator = (Story, context) => {
  const selected = context.globals.brand as string | undefined;
  const brand = !selected || selected === 'auto' ? brandFromUrl() : selected;

  return (
    <div data-brand={brand} className="font-body text-text-primary">
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withBrand],

  initialGlobals: {
    brand: 'auto',
    backgrounds: { value: 'default' },
  },

  globalTypes: {
    brand: {
      description: 'Brand token overrides applied to the story',
      toolbar: {
        title: 'Brand',
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          { value: 'auto', title: 'Auto (from domain)' },
          ...BRANDS.map((brand) => ({ value: brand, title: brand })),
        ],
      },
    },
  },

  parameters: {
    // Canvas backgrounds resolve through the same semantic tokens the
    // components use, so switching brand re-themes the canvas too.
    backgrounds: {
      options: {
        default: { name: 'Default', value: 'var(--color-background-default)' },
        surface: { name: 'Surface', value: 'var(--color-background-surface)' },
        inverse: { name: 'Inverse', value: 'var(--color-background-inverse)' },
      },
    },
    a11y: {
      // Report violations in the panel rather than failing a run; there is no
      // test runner wired up in this repo yet.
      test: 'todo',
    },
  },
};

export default preview;
