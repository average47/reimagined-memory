import type { JSX } from 'react';
import { cn } from '@repo/utils';
import { Button } from '../Button';
import { Card } from '../Card';
import type { BrandCardsProps } from './BrandCards.types';

/*
 * BrandCards — from the Figma "BrandCards" component (Marketing Platform,
 * node 2227:1049). Figma ships discrete Mobile (393px) and Desktop (1440px)
 * frames; per the repo's mobile-first rule this is one responsive component —
 * the Mobile frame is the unprefixed base and the Desktop frame is layered on
 * with `lg:`. There is no tablet frame, so no `md:` overrides.
 *
 * The cards reuse the shared Card (which already carries the Mobile 173×236 /
 * Desktop 232×317 sizes) and the CTA reuses the primary Button, so their
 * imagery and copy stay prop-supplied.
 *
 * On mobile the row is capped at 358px (two 173px cards + the 12px gap), which
 * is what wraps four cards into the design's 2×2 grid; from `lg` the cap lifts
 * and they sit in a single row.
 *
 * Note: a few values have no token — the 36px mobile section gap / desktop
 * headline gap (the spacing scale jumps 32→40), the 358px / 520px headline and
 * row widths, and the headline tracking — so those use arbitrary values, same
 * as Card, Button and Hero.
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
        <h2 className="w-full max-w-[358px] text-center font-headline font-regular text-7 leading-(--text-6--line-height) tracking-[-0.24px] break-words text-text-secondary lg:max-w-[520px] lg:text-9 lg:leading-(--text-9--line-height) lg:tracking-[-0.32px]">
          {title}
        </h2>

        {cards.length > 0 ? (
          <ul className="flex w-full max-w-[358px] flex-wrap justify-center gap-3 lg:max-w-none lg:gap-4">
            {cards.map((card, index) => (
              <li key={index} className="flex">
                <Card {...card} />
              </li>
            ))}
          </ul>
        ) : null}
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
