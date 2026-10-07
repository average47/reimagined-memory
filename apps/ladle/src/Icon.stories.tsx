import type { Story } from '@ladle/react';
import { Icon } from '@repo/ui';

export default {
  title: 'Icon',
};

/** The four supported sizes (12 / 16 / 24 / 36px). */
export const Sizes: Story = () => (
  <div className="flex items-center gap-6">
    <Icon name="playArrow" size="sm" />
    <Icon name="playArrow" size="md" />
    <Icon name="playArrow" size="lg" />
    <Icon name="playArrow" size="xl" />
  </div>
);

/** Icons inherit `currentColor`, so color comes from a `text-*` token class. */
export const Colors: Story = () => (
  <div className="flex items-center gap-6">
    <Icon name="thumbUp" size="lg" className="text-action-primary" />
    <Icon name="check" size="lg" className="text-status-success" />
    <Icon name="error" size="lg" className="text-status-error" />
    <Icon name="info" size="lg" className="text-status-warning" />
    <Icon name="settings" size="lg" className="text-text-primary" />
  </div>
);

/** A sample of glyphs from the shared sprite (packages/ui/src/Icon/sprite.svg). */
export const Gallery: Story = () => {
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
};
