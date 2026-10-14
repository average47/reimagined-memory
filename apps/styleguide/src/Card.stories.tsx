import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '@repo/ui';

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

const meta = {
  title: 'Card',
  component: Card,
  parameters: { layout: 'centered' },
  globals: { backgrounds: { value: 'default' } },
  args: {
    label: 'Service Category Goes Here',
    imageSrc: logo('LOGO HERE'),
    imageAlt: 'Logo',
    backgroundSrc: bg('Background art'),
  },
  argTypes: {
    label: { control: 'text' },
    imageSrc: { control: 'text' },
    imageAlt: { control: 'text' },
    backgroundSrc: { control: 'text' },
    href: { control: 'text' },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Logo, background art and caption. Resize past `lg` (1024px) for the desktop size. */
export const Default: Story = {};

/** With an `href` the whole card is a link (Tab to it to see the focus ring). */
export const AsLink: Story = {
  args: { href: '#title' },
};

/** No background art — the gradients sit over the bare card. */
export const NoBackground: Story = {
  args: { backgroundSrc: undefined },
};

/** No logo — the caption stays pinned to the bottom. */
export const NoLogo: Story = {
  args: { imageSrc: undefined, imageAlt: undefined },
};

/** A long caption wraps within the card's padding. */
export const LongLabel: Story = {
  args: {
    label: 'Award-Winning British Mysteries, Dramas and Period Pieces',
  },
};
