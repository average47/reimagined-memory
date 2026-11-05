import type { Meta, StoryObj } from '@storybook/react-vite';
import { Logo } from '@repo/ui';

const meta = {
  title: 'Logo',
  component: Logo,
  args: {
    brand: 'mosaic',
  },
  argTypes: {
    brand: {
      description: 'Which brand lockup to render',
      control: 'inline-radio',
      options: ['mosaic', 'amcplus'],
    },
    className: {
      description: 'Resize by height (e.g. `h-8`); width follows the lockup',
      control: 'text',
    },
  },
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A single lockup, driven by the controls panel. */
export const Default: Story = {};

/** The house Mosaic logo (play mark + MOSAIC wordmark). */
export const Mosaic: Story = {
  args: { brand: 'mosaic' },
};

/** The AMC+ brand lockup. */
export const AmcPlus: Story = {
  args: { brand: 'amcplus' },
};

/** Both lockups side by side, at the design's native 54px height. */
export const Brands: Story = {
  render: () => (
    <div className="flex items-center gap-12">
      <Logo brand="mosaic" />
      <Logo brand="amcplus" />
    </div>
  ),
};

/** Scales by height — each lockup keeps its aspect ratio as the height changes. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-12">
        <Logo brand="mosaic" className="h-6" />
        <Logo brand="amcplus" className="h-6" />
      </div>
      <div className="flex items-center gap-12">
        <Logo brand="mosaic" className="h-10" />
        <Logo brand="amcplus" className="h-10" />
      </div>
    </div>
  ),
};
