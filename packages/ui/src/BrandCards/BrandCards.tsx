import type { JSX } from 'react';
import { cn } from '@repo/utils';
import { Button } from '../Button';
import { Card } from '../Card';
import type { BrandCardsProps } from './BrandCards.types';

/*
 * BrandCards — from the Figma "BrandCards" component (Marketing Platform, node
 * 2314:195). Figma ships discrete Mobile (393px) and Desktop (1440px) frames;
 * per the repo's mobile-first rule this is one responsive component — the
 * Mobile frame is the unprefixed base and the Desktop frame is layered on with
 * `lg:`. There is no tablet frame, so no `md:` overrides.
 *
 * The cards are the shared `Card` (Figma `Card`, Type=Brand), which already
 * sizes itself 173→232px at `lg`, and the CTA is the shared primary `Button`.
 * On mobile the card row is capped at 358px (two 173px cards + 12px gap) so it
 * wraps two-up; on desktop the cap lifts and the cards sit in a single row.
 *
 * Note: the 36px gaps (headline→cards on desktop, content→CTA on mobile) have
 * no spacing token (the scale jumps 32→40), and the headline widths (358/406px)
 * come straight from the frames, so those use arbitrary values. Figma's
 * headline/4 (24/24) pairs a text-7 size with the text-6 line-height, hence the
 * `leading-(--text-6--line-height)` override; it has to be reset at `lg` so
 * headline/3 gets text-9's own 32px line-height back.
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
      {/* Headline → cards. */}
      <div className="flex w-full flex-col items-center gap-6 lg:gap-[36px]">
        <h2 className="w-full max-w-[358px] text-center font-headline font-regular text-7 leading-(--text-6--line-height) tracking-[-0.24px] text-text-secondary lg:max-w-[406px] lg:text-9 lg:leading-(--text-9--line-height) lg:tracking-[-0.32px]">
          {title}
        </h2>

        {cards.length > 0 ? (
          <ul className="flex w-full max-w-[358px] flex-wrap items-center justify-center gap-3 lg:max-w-none lg:gap-4">
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
