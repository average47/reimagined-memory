import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrandCards, type BrandCardsItem } from '@repo/ui';

// Self-contained placeholder media so the workbench needs no external assets;
// in real use these come from the attached movie/tv_series (via the CMS block).
const bg = (label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="232" height="317"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5a5a"/><stop offset="1" stop-color="#1b1b1b"/></linearGradient></defs><rect width="232" height="317" fill="url(#g)"/><text x="116" y="160" font-family="sans-serif" font-size="16" fill="#8a8a8a" text-anchor="middle">${label}</text></svg>`
  );
const logo = (label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="48"><text x="50" y="30" font-family="sans-serif" font-size="14" letter-spacing="1" fill="#ffffff" text-anchor="middle">${label}</text></svg>`
  );

const card = (n: number): BrandCardsItem => ({
  label: 'Service Category Goes Here',
  imageSrc: logo('LOGO HERE'),
  imageAlt: `Brand ${n}`,
  backgroundSrc: bg('Background art'),
});

const meta = {
  title: 'BrandCards',
  component: BrandCards,
  // The section is full-bleed, so give it the whole canvas.
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Your Destination for Premium Entertainment Headline',
    cards: [1, 2, 3, 4].map(card),
    ctaLabel: 'Start Free Trial',
    ctaHref: '#start',
  },
  argTypes: {
    title: { control: 'text' },
    ctaLabel: { control: 'text' },
    ctaHref: { control: 'text' },
  },
} satisfies Meta<typeof BrandCards>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Headline, four cards and the CTA. Resize past `lg` (1024px) for the desktop row. */
export const Default: Story = {};

/** Each card links to its title (Tab through to see the focus rings). */
export const LinkedCards: Story = {
  args: {
    cards: [1, 2, 3, 4].map((n) => ({ ...card(n), href: `#brand-${n}` })),
  },
};

/** No CTA — omitting `ctaLabel` hides the button. */
export const WithoutCta: Story = {
  args: { ctaLabel: undefined, ctaHref: undefined },
};

/** Odd card counts wrap and stay centred. */
export const ThreeCards: Story = {
  args: { cards: [1, 2, 3].map(card) },
};

/** Long headline and captions wrap within their columns. */
export const LongContent: Story = {
  args: {
    title:
      'Award-Winning Originals, Hit TV Series and Iconic Franchises — All in One Place',
    cards: [1, 2, 3, 4].map((n) => ({
      ...card(n),
      label: 'Award-Winning British Mysteries, Dramas and Period Pieces',
    })),
  },
};
