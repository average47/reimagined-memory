import type { Meta, StoryObj } from '@storybook/react-vite';
import { Header } from '@repo/ui';

// Self-contained placeholder logo so the workbench needs no external assets;
// in real use `logoSrc` is prop-supplied (e.g. `/logos/<brand>/white.svg`).
const logo =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="32"><text x="0" y="25" font-family="sans-serif" font-size="24" letter-spacing="4" fill="#ffffff">MOSAIC</text></svg>'
  );

const meta = {
  title: 'Header',
  component: Header,
  // The header is a full-width bar, so give it the whole canvas.
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    siteName: 'MOSAIC',
  },
  argTypes: {
    siteName: { control: 'text' },
    logoSrc: { control: 'text' },
    href: { control: 'text' },
  },
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Brand logo in the upper-left corner. Resize to see the padding grow at md/lg. */
export const Default: Story = {
  args: {
    logoSrc: logo,
  },
};

/**
 * Scroll the canvas: the fixed bar starts transparent over the content and
 * fades in, reaching full opacity at twice its height.
 */
export const ScrollFade: Story = {
  args: {
    logoSrc: logo,
  },
  render: (args) => (
    <div className="h-[200vh] bg-background-surface p-10">
      <Header {...args} />
      <p className="font-body text-6 text-text-secondary">
        Scroll down to fade the header in.
      </p>
    </div>
  ),
};

/** No logo supplied — falls back to the site name as a text wordmark. */
export const TextFallback: Story = {};

/** Logo linked home — focus it (Tab) to see the focus ring. */
export const AsLink: Story = {
  args: {
    logoSrc: logo,
    href: '#home',
  },
};
