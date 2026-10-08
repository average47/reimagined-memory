import type { ReactNode } from 'react';
import type { Story } from '@ladle/react';
import { Button } from '@repo/ui';

export default {
  title: 'Button',
};

/** Buttons sit on dark surfaces in the designs, so stories render on one. */
const Surface = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-7 bg-background-surface p-7">
    {children}
  </div>
);

/** Primary CTA. Resize past `lg` to see the larger desktop size. */
export const Default: Story = () => (
  <Surface>
    <Button label="Start Free Trial" />
  </Surface>
);

/** All three variants, most to least prominent. Hover each for its hover state. */
export const Variants: Story = () => (
  <Surface>
    <Button variant="primary" label="Start Free Trial" />
    <Button variant="secondary" icon="play" label="Watch Free Episode" />
    <Button variant="tertiary" label="Sign In" />
  </Surface>
);

/** Secondary with its leading play glyph from the sprite. */
export const Secondary: Story = () => (
  <Surface>
    <Button variant="secondary" icon="play" label="Watch Free Episode" />
  </Surface>
);

/** Compact tertiary action, e.g. in a header. */
export const Tertiary: Story = () => (
  <Surface>
    <Button variant="tertiary" label="Sign In" />
  </Surface>
);

/** Passing `href` renders an `<a>` with the same styling. */
export const AsLink: Story = () => (
  <Surface>
    <Button href="#start" label="Start Free Trial" />
    <Button href="#watch" variant="secondary" icon="play" label="Watch Free Episode" />
  </Surface>
);
