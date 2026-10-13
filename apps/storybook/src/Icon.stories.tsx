import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '@repo/ui';

/** A sample of glyph names from the shared sprite (packages/ui/src/Icon/sprite.svg). */
const SPRITE_NAMES = [
  'playArrow',
  'pauseCircle',
  'home',
  'search',
  'settings',
  'volumeUp',
  'closedCaption',
  'fullscreen',
  'download',
  'share',
  'thumbUp',
  'moreVertical',
  'check',
  'error',
  'info',
];

const meta = {
  title: 'Icon',
  component: Icon,
  args: { name: 'playArrow', size: 'lg' },
  argTypes: {
    name: { control: 'select', options: SPRITE_NAMES },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    className: {
      control: 'text',
      description: 'Color via a text-* token, e.g. "text-action-primary".',
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tweak `name`, `size` and the color (`className`) in Controls. */
export const Default: Story = {};

/** Icons inherit `currentColor`, so color comes from a `text-*` token class. */
export const Colored: Story = {
  args: { name: 'thumbUp', className: 'text-action-primary' },
};

/** Overview of a sample of the sprite (not interactive). */
export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      {SPRITE_NAMES.map((name) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2 rounded-md border border-border-default/20 p-3"
        >
          <Icon name={name} size="lg" className="text-text-primary" />
          <span className="text-1 text-text-primary/50">{name}</span>
        </div>
      ))}
    </div>
  ),
};
