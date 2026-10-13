import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@repo/ui';

/** Buttons sit on dark surfaces in the designs, so render them on one. */
const onSurface: Decorator = (Story) => (
  <div className="flex flex-wrap items-center gap-7 bg-background-surface p-7">
    <Story />
  </div>
);

const meta = {
  title: 'Button',
  component: Button,
  decorators: [onSurface],
  args: { label: 'Start Free Trial', variant: 'primary' },
  argTypes: {
    label: { control: 'text' },
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary'],
    },
    icon: { control: 'text', description: 'Sprite icon name, e.g. "play".' },
    href: { control: 'text', description: 'Renders an <a> when set.' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Primary CTA. Resize past `lg` to see the larger desktop size. */
export const Primary: Story = {};

/** Bordered dark fill with a leading glyph. */
export const Secondary: Story = {
  args: { variant: 'secondary', icon: 'play', label: 'Watch Free Episode' },
};

/** Compact low-emphasis action, e.g. in a header. */
export const Tertiary: Story = {
  args: { variant: 'tertiary', label: 'Sign In' },
};

/** Passing `href` renders an `<a>` with the same styling. */
export const AsLink: Story = {
  args: { href: '#start' },
};
