import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrandCards } from '@repo/ui';

// Self-contained placeholder media so the workbench needs no external assets;
// in real use these come from the attached movie/tv_series (via the CMS block).
const bg = (label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="232" height="317"><rect width="232" height="317" fill="#1b1b1b"/><text x="116" y="160" font-family="sans-serif" font-size="16" fill="#4b4b4b" text-anchor="middle">${label}</text></svg>`
  );
const logo = (label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="48"><text x="50" y="30" font-family="sans-serif" font-size="18" letter-spacing="2" fill="#ffffff" text-anchor="middle">${label}</text></svg>`
  );

const card = (name: string, category: string) => ({
  label: category,
  imageSrc: logo(name),
  imageAlt: name,
  backgroundSrc: bg(name),
  href: '#title',
});

const meta = {
  title: 'BrandCards',
  component: BrandCards,
  // Full-bleed section, so give it the whole canvas on a dark background.
  parameters: { layout: 'fullscreen' },
  globals: { backgrounds: { value: 'default' } },
  args: {
    headline: 'Your Destination for Premium Entertainment Headline',
    ctaLabel: 'Start Free Trial',
    ctaHref: '#start',
    cards: [
      card('AMC+', 'Prestige Drama'),
      card('Shudder', 'Horror & Thrillers'),
      card('Acorn TV', 'British Mysteries'),
      card('Sundance Now', 'Indie Cinema'),
    ],
  },
  argTypes: {
    headline: { control: 'text' },
    ctaLabel: { control: 'text' },
    ctaHref: { control: 'text' },
  },
} satisfies Meta<typeof BrandCards>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Four cards + CTA. Resize past `lg` (1024px) to see the desktop row. */
export const Default: Story = {};

/** No CTA — the headline + cards only (the CTA is an optional prop). */
export const WithoutCta: Story = {
  args: { ctaLabel: undefined, ctaHref: undefined },
};

/** Cards without background art fall back to the dark card surface. */
export const NoBackgrounds: Story = {
  args: {
    cards: [
      { label: 'Prestige Drama', imageSrc: logo('AMC+'), imageAlt: 'AMC+' },
      { label: 'Horror & Thrillers', imageSrc: logo('Shudder'), imageAlt: 'Shudder' },
      { label: 'British Mysteries', imageSrc: logo('Acorn TV'), imageAlt: 'Acorn TV' },
      { label: 'Indie Cinema', imageSrc: logo('Sundance Now'), imageAlt: 'Sundance Now' },
    ],
  },
};
