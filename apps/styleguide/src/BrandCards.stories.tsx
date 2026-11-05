import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrandCards, type BrandCardsItem } from '@repo/ui';

// Self-contained placeholder media so the workbench needs no external assets;
// in real use these come from the CMS (each card can attach a movie/tv_series).
const bg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="232" height="317"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5a5a"/><stop offset="1" stop-color="#1b1b1b"/></linearGradient></defs><rect width="232" height="317" fill="url(#g)"/></svg>'
  );
const logo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="48"><text x="50" y="30" font-family="sans-serif" font-size="14" letter-spacing="1" fill="#ffffff" text-anchor="middle">LOGO HERE</text></svg>'
  );

const card = (overrides: Partial<BrandCardsItem> = {}): BrandCardsItem => ({
  label: 'Service Category Goes Here',
  imageSrc: logo,
  imageAlt: 'Logo',
  backgroundSrc: bg,
  ...overrides,
});

const meta = {
  title: 'BrandCards',
  component: BrandCards,
  // The section is full-bleed, so give it the whole canvas.
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Premium Entertainment Headline Goes Here',
    cards: [card(), card(), card(), card()],
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

/** Four cards: a 2×2 grid on mobile, one row past `lg` (1024px). */
export const Default: Story = {};

/** Each card links somewhere (Tab through to see the focus rings). */
export const LinkedCards: Story = {
  args: {
    cards: [
      card({ href: '#one' }),
      card({ href: '#two' }),
      card({ href: '#three' }),
      card({ href: '#four' }),
    ],
  },
};

/** An odd number of cards — the last row stays centred. */
export const ThreeCards: Story = {
  args: { cards: [card(), card(), card()] },
};

/** Without `ctaLabel` the CTA is hidden. */
export const NoCta: Story = {
  args: { ctaLabel: undefined, ctaHref: undefined },
};

/** Long headline and captions wrap within their columns. */
export const LongContent: Story = {
  args: {
    title:
      'Premium Entertainment From Every Corner of the World, All in One Place',
    cards: [
      card({ label: 'Award-Winning British Mysteries, Dramas and Period Pieces' }),
      card(),
      card({ label: 'Horror, Thrillers and the Supernatural' }),
      card(),
    ],
  },
};
