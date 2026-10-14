import type { Meta, StoryObj } from '@storybook/react-vite';
import { Logo } from '@repo/ui';
// In real use `src` is prop-supplied (per-brand site config or the CMS); the
// workbench borrows the web app's brand assets rather than adding any here.
//@ts-expect-error –- no ambient type for the `?url` query import ---
import mosaicLogo from '../../web/public/marketing/amc-plus-logo.svg?url';
//@ts-expect-error –- no ambient type for the `?url` query import ---
import amcplusLogo from '../../web/public/logos/amcplus/color.svg?url';
//@ts-expect-error –- no ambient type for the `?url` query import ---
import shudderLogo from '../../web/public/logos/shudder/white.svg?url';
//@ts-expect-error –- no ambient type for the `?url` query import ---
import sundancenowLogo from '../../web/public/logos/sundancenow/white.svg?url';
//@ts-expect-error –- no ambient type for the `?url` query import ---
import wetvLogo from '../../web/public/logos/wetv/white.svg?url';

const meta = {
  title: 'Logo',
  component: Logo,
  args: {
    src: mosaicLogo as string,
    alt: 'Mosaic',
  },
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Mosaic wordmark — fills the 307×54 slot edge to edge. */
export const Default: Story = {};

/**
 * A narrower mark (AMC+) keeps its proportions: centred on mobile,
 * left-aligned from `lg` (1024px). Resize the viewport to see it shift.
 */
export const NarrowMark: Story = {
  args: {
    src: amcplusLogo as string,
    alt: 'AMC+',
  },
};

/** Every brand's logo in the same slot. */
export const Brands: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(
        [
          [mosaicLogo, 'Mosaic'],
          [amcplusLogo, 'AMC+'],
          [shudderLogo, 'Shudder'],
          [sundancenowLogo, 'Sundance Now'],
          [wetvLogo, 'WE tv'],
        ] as [string, string][]
      ).map(([src, alt]) => (
        <Logo key={alt} src={src} alt={alt} />
      ))}
    </div>
  ),
};
