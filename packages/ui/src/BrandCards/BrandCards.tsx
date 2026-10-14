import type { JSX } from 'react';
import { cn } from '@repo/utils';
import { Button } from '../Button';
import { Card } from '../Card';
import type { BrandCardsProps } from './BrandCards.types';

/*
 * BrandCards — from the Figma "Brand Cards" component (Marketing Platform,
 * node 2030:985). Figma ships Mobile (393px) and Desktop (1440px) frames; per
 * the repo's mobile-first rule this is one responsive component — the Mobile
 * frame is the unprefixed base, the Desktop frame is layered on with `lg:`.
 * There is no tablet frame, so no `md:` overrides.
 *
 * Colours, type and spacing resolve through the semantic tokens
 * (background/action/text, the type ramp, the 0–14 spacing scale) so each brand
 * restyles via [data-brand]. The CTA reuses the shared Button and each card is
 * the shared Card (Figma node 4017:145). Card imagery and copy are
 * prop-supplied (from an attached movie/tv_series in the CMS), so they stay
 * dynamic.
 *
 * Note: the design uses a 36px step for a couple of gaps (the mobile section
 * gap, the desktop headline↔cards gap). The app spacing scale jumps 32→40 with
 * no 36 token, so those use an arbitrary `[36px]` — same as the shared Button
 * already does for its x-padding.
 */
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
            // Two per row on mobile; the Card's own desktop width applies at `lg`.
            <Card key={index} {...card} className="w-[calc(50%-6px)]" />
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
