import type { JSX } from 'react';
import { cn } from '@repo/utils';
import type { CardProps } from './Card.types';

/*
 * Card — from the Figma "Card" component (Marketing Platform, node 4017:145).
 * Figma ships Mobile (173×236) and Desktop (232×317) variants; per the repo's
 * mobile-first rule this is one responsive component — the Mobile variant is
 * the unprefixed base, the Desktop variant is layered on with `lg:`. There is
 * no tablet variant, so no `md:` overrides.
 *
 * The card sizes itself to the design (via native `aspect-ratio`) but callers
 * can override the width with `className` — e.g. BrandCards lays two per row on
 * mobile. Imagery and caption are prop-supplied, so they stay dynamic.
 *
 * Note: a few values have no token — the desktop 36px x-padding (the spacing
 * scale jumps 32→40), the mobile logo box (80×36) and the desktop logo width
 * (100) — so those use arbitrary values, same as BrandCards/Button.
 */
export default function Card({
  label,
  imageSrc,
  imageAlt = '',
  backgroundSrc,
  href,
  className,
  ...props
}: CardProps): JSX.Element {
  const classes = cn(
    'relative flex aspect-[173/236] w-[173px] flex-col items-center justify-between',
    'overflow-hidden rounded-xl border border-border-default px-6 pt-3 pb-5',
    'lg:aspect-[232/317] lg:w-[232px] lg:px-[36px] lg:pb-6',
    href &&
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hover',
    className,
  );

  const content = (
    <>
      {/* Full-bleed background art + bottom/top darkening so the logo and
          caption stay legible, mirroring the design's double gradient. */}
      {backgroundSrc ? (
        <img
          src={backgroundSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-background-default/90 from-23% to-transparent to-48%"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-background-default/89 from-5% to-transparent to-33%"
      />

      {imageSrc ? (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="relative h-[36px] w-[80px] object-contain lg:h-9 lg:w-[100px]"
        />
      ) : (
        // Keeps the caption pinned to the bottom when there's no logo.
        <span aria-hidden="true" className="relative" />
      )}

      <p className="relative w-full text-center font-body font-regular text-3 leading-(--text-2--line-height) break-words text-text-secondary lg:text-4 lg:leading-(--text-3--line-height)">
        {label}
      </p>
    </>
  );

  return href ? (
    <a data-component="Card" href={href} {...props} className={classes}>
      {content}
    </a>
  ) : (
    <div data-component="Card" {...props} className={classes}>
      {content}
    </div>
  );
}
