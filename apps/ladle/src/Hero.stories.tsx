import type { Story } from '@ladle/react';
import { Hero } from '@repo/ui';

export default {
  title: 'Hero',
};

// Self-contained placeholder media so the workbench needs no external assets;
// in real use `backgroundSrc`/`logoSrc` are prop-supplied (e.g. from the CMS).
const bg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><rect width="16" height="9" fill="#141414"/></svg>',
  );
const logo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="307" height="54"><text x="0" y="40" font-family="sans-serif" font-size="34" letter-spacing="8" fill="#ffffff">MOSAIC</text></svg>',
  );

const legal =
  'Discount is for one year only on new/upgraded Annual Premium subscriptions. ' +
  'Standard price automatically applies on the second billing cycle. Plan ' +
  'auto-renews unless canceled. Offer is valid only until May 25, 2026. ' +
  'Subscription must be obtained on www.amcplus.com in the U.S. Terms apply.';

/** Full hero. Resize past `lg` (1024px) to see the desktop layout. */
export const Default: Story = () => (
  <Hero
    backgroundSrc={bg}
    logoSrc={logo}
    logoAlt="Mosaic"
    title="Exceptional Stories. Unforgettable Drama."
    description="Award-winning originals, hit TV series, classic films and iconic franchises, all on AMC+."
    priceText="Plans start at $6.99/month"
    legal={legal}
    ctaLabel="Start Free Trial"
    ctaHref="#start"
  />
);

/** Headline + CTA only (the Figma show* toggles map to omitted props). */
export const Minimal: Story = () => (
  <Hero
    backgroundSrc={bg}
    logoSrc={logo}
    logoAlt="Mosaic"
    title="Exceptional Stories. Unforgettable Drama."
    ctaLabel="Start Free Trial"
    ctaHref="#start"
  />
);
