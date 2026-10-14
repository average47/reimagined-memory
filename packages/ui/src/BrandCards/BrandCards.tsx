import type { JSX } from 'react';
import { cn } from '@repo/utils';
import { Button } from '../Button';
import type { BrandCardItem, BrandCardsProps } from './BrandCards.types';

/*
 * BrandCards — from the Figma "Brand Cards" component (Marketing Platform,
 * node 2030:985). Figma ships Mobile (393px) and Desktop (1440px) frames; per
 * the repo's mobile-first rule this is one responsive component — the Mobile
 * frame is the unprefixed base, the Desktop frame is layered on with `lg:`.
 * There is no tablet frame, so no `md:` overrides.
 *
 * Colours, type and spacing resolve through the semantic tokens
 * (background/action/text, the type ramp, the 0–14 spacing scale) so each brand
 * restyles via [data-brand]. The CTA reuses the shared Button. Card imagery and
 * copy are prop-supplied (from an attached movie/tv_series in the CMS), so they
 * stay dynamic.
 *
 * Note: the design uses a 36px step for a few paddings/gaps (desktop card
 * x-padding, the mobile section gap, the desktop headline↔cards gap). The app
 * spacing scale jumps 32→40 with no 36 token, so those use an arbitrary
 * `[36px]` — same as the shared Button already does for its x-padding.
 */
function Card({
  label,
  imageSrc,
  imageAlt = '',
  backgroundSrc,
  href,
}: BrandCardItem): JSX.Element {
  const inner = (
    <>
      {/* Full-bleed background art + top/bottom darkening so the logo and
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
        className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-background-default/90 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background-default/90 to-transparent"
      />

      {imageSrc ? (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="relative h-[36px] w-[80px] object-contain lg:h-9 lg:w-[100px]"
        />
      ) : (
        <span aria-hidden="true" className="relative" />
      )}

      <p className="relative text-center font-body text-3 text-text-secondary lg:text-4">
        {label}
      </p>
    </>
  );

  const cardClasses = cn(
    'relative flex aspect-[173/236] w-[calc(50%-6px)] flex-col items-center justify-between',
    'overflow-hidden rounded-xl border border-border-default pt-3 pb-5 px-6',
    'lg:w-[232px] lg:pb-6 lg:px-[36px]',
  );

  return href ? (
    <a
      href={href}
      className={cn(
        cardClasses,
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-hover',
      )}
    >
      {inner}
    </a>
  ) : (
    <div className={cardClasses}>{inner}</div>
  );
}

export default function BrandCards({
  headline,
  cards,
  ctaLabel,
  ctaHref,
  className,
  ...props
}: BrandCardsProps): JSX.Element {
  return (
    <section
      data-component="BrandCards"
      className={cn(
        'flex w-full flex-col items-center bg-background-default px-4 py-8 gap-[36px]',
        'lg:py-9 lg:gap-9',
        className,
      )}
      {...props}
    >
      <div className="flex w-full flex-col items-center gap-6 lg:gap-[36px]">
        <h2 className="max-w-[358px] text-center font-headline text-7 tracking-[-0.24px] text-text-secondary lg:max-w-[520px] lg:text-9 lg:tracking-[-0.32px]">
          {headline}
        </h2>

        <div className="flex max-w-[358px] flex-wrap justify-center gap-3 lg:max-w-none lg:flex-nowrap lg:gap-4">
          {cards.map((card, index) => (
            <Card key={index} {...card} />
          ))}
        </div>
      </div>

      {ctaLabel ? (
        ctaHref ? (
          <Button label={ctaLabel} href={ctaHref} />
        ) : (
          <Button label={ctaLabel} />
        )
      ) : null}
    </section>
  );
}
