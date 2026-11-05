import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollectionSwimlane, type CollectionSwimlaneItem } from '@repo/ui';

// Self-contained placeholder media so the workbench needs no external assets;
// in real use these come from the CMS (the attached movie/tv_series entries).
const bg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><rect width="16" height="9" fill="#2a2a2a"/></svg>'
  );
const poster = (label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="210"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4a4a"/><stop offset="1" stop-color="#1b1b1b"/></linearGradient></defs><rect width="140" height="210" fill="url(#g)"/><text x="70" y="110" font-family="sans-serif" font-size="13" fill="#9a9a9a" text-anchor="middle">${label}</text></svg>`
  );

const titles = (count: number, linked = false): CollectionSwimlaneItem[] =>
  Array.from({ length: count }, (_, index) => {
    const title = `Title ${index + 1}`;
    return {
      title,
      imageSrc: poster(title),
      href: linked ? `#title-${index + 1}` : undefined,
    };
  });

const meta = {
  title: 'CollectionSwimlane',
  component: CollectionSwimlane,
  // The swimlane is full-bleed, so give it the whole canvas.
  parameters: { layout: 'fullscreen' },
  args: {
    backgroundSrc: bg,
    title: 'New On AMC+',
    description:
      'Explore the newest titles on AMC+ and get a look at what’s coming next.',
    ctaLabel: 'Start Free Trial',
    ctaHref: '#start',
    swimlaneTitle: 'New Arrivals',
    items: titles(8, true),
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    ctaLabel: { control: 'text' },
    swimlaneTitle: { control: 'text' },
    backgroundSrc: { control: 'text' },
  },
} satisfies Meta<typeof CollectionSwimlane>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Intro, CTA and eight linked posters. Resize past `lg` (1024px) for the desktop layout. */
export const Default: Story = {};

/** More titles than fit — the poster row scrolls horizontally. */
export const Overflowing: Story = {
  args: { items: titles(16, true) },
};

/** Posters without links — the row itself takes focus so it can be scrolled by keyboard. */
export const Unlinked: Story = {
  args: { items: titles(8) },
};

/** Headline and posters only: no subheader, CTA or swimlane heading. */
export const Minimal: Story = {
  args: {
    description: undefined,
    ctaLabel: undefined,
    ctaHref: undefined,
    swimlaneTitle: undefined,
  },
};

/** No background art — falls back to the brand surface colour. */
export const NoBackground: Story = {
  args: { backgroundSrc: undefined },
};
