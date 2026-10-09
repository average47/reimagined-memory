import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, type ButtonAsButtonProps } from '@repo/ui';

/*
 * `ButtonProps` is a discriminated union (`href` present or absent), which
 * collapses to `never` when Storybook intersects the arg types. Typing the
 * meta against the `<button>` branch keeps args and controls usable; the `<a>`
 * form is covered by the `AsLink` story, which renders directly.
 */

const meta = {
  title: 'Button',
  component: Button,
  // Buttons sit on dark surfaces in the designs, so render them on one.
  // Backgrounds are a global in Storybook 9+, not a parameter.
  globals: {
    backgrounds: { value: 'surface' },
  },
  decorators: [
    (Story) => (
      <div className="flex flex-wrap items-center gap-7 p-7">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Start Free Trial',
  },
  argTypes: {
    variant: {
      description: 'Visual treatment, from most to least prominent',
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary'],
    },
    icon: {
      description: 'Leading glyph — an Icon sprite name',
      control: 'select',
      options: ['play', 'playArrow', 'thumbUp', 'download'],
    },
    label: { control: 'text' },
  },
} satisfies Meta<ButtonAsButtonProps>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Primary CTA. Resize past `lg` to see the larger desktop size. */
export const Default: Story = {};

/** All three variants, most to least prominent. Hover each for its hover state. */
export const Variants: Story = {
  render: () => (
    <>
      <Button variant="primary" label="Start Free Trial" />
      <Button variant="secondary" icon="play" label="Watch Free Episode" />
      <Button variant="tertiary" label="Sign In" />
    </>
  ),
};

/** Secondary with its leading play glyph from the sprite. */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    icon: 'play',
    label: 'Watch Free Episode',
  },
};

/** Compact tertiary action, e.g. in a header. */
export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
    label: 'Sign In',
  },
};

/** Passing `href` renders an `<a>` with the same styling. */
export const AsLink: Story = {
  render: () => (
    <>
      <Button href="#start" label="Start Free Trial" />
      <Button
        href="#watch"
        variant="secondary"
        icon="play"
        label="Watch Free Episode"
      />
    </>
  ),
};
