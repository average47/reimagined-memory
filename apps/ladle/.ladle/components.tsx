import type { GlobalProvider } from '@ladle/react';
import '../src/styles.css';

const BRANDS = ['amcplus', 'shudder', 'acorn', 'sundancenow', 'wetv'] as const;

/**
 * Resolve the active brand so stories pick up the domain's theming via the
 * `[data-brand]` token overrides (colors.css). When this app is proxied under
 * a brand site (e.g. amcplus.localhost/styleguide), the brand comes from the
 * subdomain; a `?brand=` query param overrides it for standalone use. Falls
 * back to the white-label defaults when neither matches.
 */
function resolveBrand(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const list = BRANDS as readonly string[];

  const override = new URLSearchParams(window.location.search).get('brand');
  if (override && list.includes(override)) return override;

  const subdomain = window.location.hostname.split('.')[0] ?? '';
  return list.includes(subdomain) ? subdomain : undefined;
}

// Wraps every story. `data-brand` activates the matching token overrides;
// the base font + text token render components in context.
export const Provider: GlobalProvider = ({ children }) => (
  <div data-brand={resolveBrand()} className="font-body text-text-primary">
    {children}
  </div>
);
