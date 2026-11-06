import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hero } from '@repo/ui';

// Self-contained placeholder media so the workbench needs no external assets;
// in real use `backgroundSrc`/`logoSrc` are prop-supplied (e.g. from the CMS).
const bg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><rect width="16" height="9" fill="#141414"/></svg>'
  );
const logo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="307" height="54"><text x="0" y="40" font-family="sans-serif" font-size="34" letter-spacing="8" fill="#ffffff">MOSAIC</text></svg>'
  );

const legal =
  'Discount is for one year only on new/upgraded Annual Premium subscriptions. ' +
  'Standard price automatically applies on the second billing cycle. Plan ' +
  'auto-renews unless canceled. Offer is valid only until May 25, 2026. ' +
  'Subscription must be obtained on www.amcplus.com in the U.S. Terms apply.';

const meta = {
  title: 'Hero',
  component: Hero,
  // The hero is full-bleed, so give it the whole canvas.
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    backgroundSrc: bg,
    title: 'Exceptional Stories. Unforgettable Drama.',
    ctaLabel: 'Start Free Trial',
    ctaHref: '#start',
  },
  argTypes: {
    logo: { control: 'select', options: ['mosaic', 'amcplus'] },
    description: { control: 'text' },
    priceText: { control: 'text' },
    legal: { control: 'text' },
    title: { control: 'text' },
    ctaLabel: { control: 'text' },
  },
} satisfies Meta<typeof Hero>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Full hero as in the Figma handoff, with the shared `Logo` lockup. Resize past
 * `lg` (1024px) to see the desktop layout; switch brands in the Brand toolbar.
 */
export const Default: Story = {
  args: {
    logo: 'mosaic',
    description:
      'Award-winning originals, hit TV series, classic films and iconic franchises, all on AMC+.',
    priceText: 'Plans start at $6.99/month',
    legal,
  },
};

/** Headline + CTA only (the Figma show* toggles map to omitted props). */
export const Minimal: Story = {};

/** A custom logo image via `logoSrc`, used when no `logo` lockup is set. */
export const CustomLogoImage: Story = {
  args: {
    logoSrc: logo,
    logoAlt: 'Mosaic',
    description:
      'Award-winning originals, hit TV series, classic films and iconic franchises.',
    priceText: 'Plans start at $6.99/month',
  },
};

/** CTA without `ctaHref` renders a native `<button>` instead of a link. */
export const CtaAsButton: Story = {
  args: {
    logo: 'mosaic',
    ctaHref: undefined,
    priceText: 'Plans start at $6.99/month',
  },
};
