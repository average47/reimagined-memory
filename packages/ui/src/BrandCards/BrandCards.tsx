import { useId, type JSX } from 'react';
import { cn } from '@repo/utils';
import { Button } from '../Button';
import { Card } from '../Card';
import type { BrandCardsProps } from './BrandCards.types';

/*
 * BrandCards — from the Figma "Brand Cards" component (Marketing Platform,
 * node 2030:985). Figma ships discrete Mobile (393px) and Desktop (1440px)
 * frames; per the repo's mobile-first rule this is one responsive component —
 * the Mobile frame is the unprefixed base and the Desktop frame is layered on
 * with `lg:`. There is no tablet frame, so no `md:` overrides.
 *
 * The cards reuse the shared Card (which sizes itself per breakpoint) and the
 * CTA reuses the primary Button. The card list wraps, so mobile's 358px cap
 * gives the design's 2×2 grid and desktop lays the cards out in one row.
 *
 * Note: a few values have no token — the mobile 36px section gap and desktop
 * 36px headline→cards gap (the spacing scale jumps 32→40), and the headline/
 * card-row widths (358 / 520px) — so those use arbitrary values, same as Card.
 */
export default function BrandCards({
  title,
  cards,
  ctaLabel,
  ctaHref,
  className,
  ...props
}: BrandCardsProps): JSX.Element {
  const titleId = useId();

  return (
    <section
      data-component="BrandCards"
      aria-labelledby={titleId}
      className={cn(
        'flex flex-col items-center gap-[36px] bg-background-default px-4 py-8',
        'lg:gap-9 lg:py-9',
        className,
      )}
      {...props}
    >
      <div className="flex w-full flex-col items-center gap-6 lg:gap-[36px]">
        <h2
          id={titleId}
          className="w-full max-w-[358px] text-center font-headline font-regular text-7 leading-(--text-6--line-height) tracking-[-0.24px] text-text-secondary lg:max-w-[520px] lg:text-9 lg:leading-(--text-9--line-height) lg:tracking-[-0.32px]"
        >
          {title}
        </h2>

        <ul className="flex w-full max-w-[358px] flex-wrap justify-center gap-3 lg:max-w-none lg:gap-4">
          {cards.map((card, index) => (
            <li key={index} className="flex">
              <Card {...card} />
            </li>
          ))}
        </ul>
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
