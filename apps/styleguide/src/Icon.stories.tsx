import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '@repo/ui';

const meta = {
  title: 'Icon',
  component: Icon,
  args: {
    name: 'playArrow',
    size: 'lg',
  },
  argTypes: {
    name: {
      description:
        'Glyph id in the shared sprite (packages/ui/src/Icon/sprite.svg)',
      control: 'text',
    },
    size: {
      description: 'Rendered size — 12 / 16 / 24 / 36px',
      control: 'inline-radio',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    className: {
      description:
        'Color comes from a text-* token class (icons use currentColor)',
      control: 'text',
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A single glyph, driven by the controls panel. */
export const Default: Story = {
  args: {
    className: 'text-text-primary',
  },
};

/** The four supported sizes (12 / 16 / 24 / 36px). */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Icon name="playArrow" size="sm" />
      <Icon name="playArrow" size="md" />
      <Icon name="playArrow" size="lg" />
      <Icon name="playArrow" size="xl" />
    </div>
  ),
};

/** Icons inherit `currentColor`, so color comes from a `text-*` token class. */
export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Icon name="thumbUp" size="lg" className="text-action-primary" />
      <Icon name="check" size="lg" className="text-status-success" />
      <Icon name="error" size="lg" className="text-status-error" />
      <Icon name="info" size="lg" className="text-status-warning" />
      <Icon name="settings" size="lg" className="text-text-primary" />
    </div>
  ),
};

/** A sample of glyphs from the shared sprite (packages/ui/src/Icon/sprite.svg). */
export const Gallery: Story = {
  render: () => {
    const names = [
      'home',
      'search',
      'settings',
      'playArrow',
      'pauseCircle',
      'volumeUp',
      'closedCaption',
      'fullscreen',
      'download',
      'share',
      'thumbUp',
      'moreVertical',
    ];
    return (
      <div className="grid grid-cols-6 gap-4">
        {names.map((name) => (
          <div
            key={name}
            className="flex flex-col items-center gap-2 rounded-md border border-border-default/20 p-3"
          >
            <Icon name={name} size="lg" className="text-text-primary" />
            <span className="text-1 text-text-primary/50">{name}</span>
          </div>
        ))}
      </div>
    );
  },
};
