import type { JSX } from 'react';
import { cn } from '@repo/utils';
import type { LogoProps } from './Logo.types';
// SVG URL imports. The `?url` query resolves to a static-asset URL under both
// bundlers, but the shape differs: Next.js yields an object ({ src }), Vite
// (Storybook) yields the URL string directly. Normalize to a string below so
// the component renders under either. (Same pattern as Icon/sprite.svg.)
//@ts-expect-error -- no ambient type for the `?url` query import
import mosaicAsset from './mosaic.svg?url';
//@ts-expect-error -- no ambient type for the `?url` query import
import amcplusMarkAsset from './amcplus-mark.svg?url';
//@ts-expect-error -- no ambient type for the `?url` query import
import amcplusPlusAsset from './amcplus-plus.svg?url';

const toUrl = (asset: string | { src: string }): string =>
  typeof asset === 'string' ? asset : asset.src;

const mosaicUrl = toUrl(mosaicAsset);
const amcplusMarkUrl = toUrl(amcplusMarkAsset);
const amcplusPlusUrl = toUrl(amcplusPlusAsset);

export default function Logo({
  brand = 'mosaic',
  className,
  ...props
}: LogoProps): JSX.Element {
  if (brand === 'amcplus') {
    // The AMC+ lockup is two layers from Figma: the "amc" mark and the trailing
    // "+" glyph. The mark renders in flow and sets the box height/width (so the
    // whole lockup scales by height); the "+" is overlaid with the design's
    // percentage offsets (node 2016:273, a 104×54 frame: the + sits at
    // left 83.8/95.5 of the mark, top 16.8/54, and is ~20px tall).
    return (
      <span
        data-component="Logo"
        className={cn('relative inline-block h-[54px]', className)}
        {...props}
      >
        <img src={amcplusMarkUrl} alt="AMC+" className="block h-full w-auto" />
        <img
          src={amcplusPlusUrl}
          alt=""
          aria-hidden="true"
          className="absolute top-[31.1%] left-[87.3%] h-[37.8%] w-auto"
        />
      </span>
    );
  }

  return (
    <span
      data-component="Logo"
      className={cn('inline-block h-[54px]', className)}
      {...props}
    >
      <img
        src={mosaicUrl}
        alt="Mosaic"
        className="block h-full w-auto max-w-full object-contain"
      />
    </span>
  );
}
