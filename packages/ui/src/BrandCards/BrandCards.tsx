import type { JSX } from 'react';
import { cn } from '@repo/utils';
import { Button } from '../Button';
import { Card } from '../Card';
import type { BrandCardsProps } from './BrandCards.types';

/*
 * BrandCards — from the Figma "BrandCards" section (Marketing Platform,
 * node 2227:534 Desktop / 2227:1050 Mobile). Figma ships discrete Mobile (393px)
 * and Desktop (1440px) frames; per the repo's mobile-first rule this is one
 * responsive component — the Mobile frame is the unprefixed base and the Desktop
 * frame is layered on with `lg:`. There is no tablet frame, so no `md:`.
 *
 * Every colour, size and spacing value resolves through the semantic tokens in
 * app/globals.css so each brand restyles via [data-brand]. The cards reuse the
 * shared `Card` (which owns its own responsive sizing, art and gradients) and
 * the CTA reuses `Button`; imagery and copy are prop-supplied, so they stay
 * dynamic. Frame widths are dropped in favour of `w-full` + centred content, and
 * the mobile grid wraps 2×2 within the design's 358px content width.
 *
 * Note: the section's 36px mobile gap has no spacing token (the scale jumps
 * 32→40), so it uses an arbitrary value, same as Button/Card.
 */
export default function BrandCards({
  title,
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
        'flex flex-col items-center gap-[36px] bg-background-default px-4 py-8',
        'lg:gap-9 lg:py-9',
        className,
      )}
      {...props}
    >
      <div className="flex w-full flex-col items-center gap-6 lg:gap-[36px]">
        <h2 className="max-w-[358px] text-center font-headline font-regular text-7 leading-(--text-6--line-height) tracking-[-0.24px] text-text-secondary lg:max-w-[520px] lg:text-9 lg:tracking-[-0.32px]">
          {title}
        </h2>

        <div className="flex w-full max-w-[358px] flex-wrap content-center items-center justify-center gap-3 lg:max-w-none lg:flex-nowrap lg:gap-4">
          {cards.map((card, i) => (
            <Card key={card.href ?? `${card.label}-${i}`} {...card} />
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
