import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrandCards } from '@repo/ui';

// Self-contained placeholder media so the workbench needs no external assets;
// in real use each card's imagery comes from the attached movie/tv_series.
const bg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="232" height="317"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5a5a"/><stop offset="1" stop-color="#1b1b1b"/></linearGradient></defs><rect width="232" height="317" fill="url(#g)"/></svg>'
  );
const logo = (label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="48"><text x="50" y="30" font-family="sans-serif" font-size="14" letter-spacing="1" fill="#ffffff" text-anchor="middle">${label}</text></svg>`
  );

const card = (name: string) => ({
  label: 'Service Category Goes Here',
  imageSrc: logo(name),
  imageAlt: name,
  backgroundSrc: bg,
});

const meta = {
  title: 'BrandCards',
  component: BrandCards,
  // Full-width section, so give it the whole canvas.
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Your Destination for Premium Entertainment Headline',
    cards: [
      card('LOGO HERE'),
      card('LOGO HERE'),
      card('LOGO HERE'),
      card('LOGO HERE'),
    ],
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

/** The four-card section. Resize past `lg` (1024px) for the desktop row; below
 * it the cards wrap 2×2. */
export const Default: Story = {};

/** Cards link out — Tab through to see each card's focus ring. */
export const LinkedCards: Story = {
  args: {
    cards: [
      { ...card('LOGO HERE'), href: '#one' },
      { ...card('LOGO HERE'), href: '#two' },
      { ...card('LOGO HERE'), href: '#three' },
      { ...card('LOGO HERE'), href: '#four' },
    ],
  },
};

/** Headline and cards only — omit the CTA props to hide the button. */
export const NoCta: Story = {
  args: { ctaLabel: undefined, ctaHref: undefined },
};
