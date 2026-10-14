import type { JSX } from 'react';
import { cn } from '@repo/utils';
import type { LogoProps } from './Logo.types';

/*
 * Logo — from the Figma "Logo" container (Marketing Platform, node 50:2851).
 * Figma ships Mobile and Desktop variants of a fixed 307×54 slot; per the
 * repo's mobile-first rule this is one responsive component — the Mobile
 * variant (mark centred) is the unprefixed base and the Desktop variant (mark
 * left-aligned) is layered on with `lg:`. There is no tablet variant.
 *
 * The mark is scaled to fit the slot without distortion, so narrower logos
 * (e.g. AMC+, 104×54) keep their proportions and only the alignment shifts.
 * 307px / 54px have no spacing token (same slot as Hero's logo).
 */
export default function Logo({
  src,
  alt,
  className,
  ...props
}: LogoProps): JSX.Element {
  return (
    <div
      data-component="Logo"
      className={cn('h-[54px] w-[307px] max-w-full overflow-hidden', className)}
      {...props}
    >
      <img
        src={src}
        alt={alt}
        className="size-full object-contain object-center lg:object-left"
      />
    </div>
  );
}
