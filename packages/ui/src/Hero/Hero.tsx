import type { JSX } from 'react';
import { cn } from '@repo/utils';
import { Button } from '../Button';
import type { HeroProps } from './Hero.types';

/*
 * Hero — from the Figma "Hero" component (Marketing Platform, node 61:4455).
 * Figma ships discrete Mobile (393px) and Desktop (1440px) frames; per the
 * repo's mobile-first rule this is one responsive component — the Mobile frame
 * is the unprefixed base and the Desktop frame is layered on with `lg:`. There
 * is no tablet frame, so no `md:` overrides.
 *
 * Every colour, size and spacing value resolves through the semantic tokens in
 * app/globals.css (action/*, text/*, the type ramp and the 0–14 spacing scale)
 * so each brand restyles via [data-brand]. The CTA reuses the shared Button;
 * the background and logo are prop-supplied, so they stay dynamic.
 *
 * Differences from the raw Figma export: mobile centres content and uses a tall
 * top pad to drop the hero below the status/nav area, while desktop left-aligns
 * and vertically centres within a 572px min-height.
 *
 * The two frames group their layers differently (mobile nests legal with the
 * copy, desktop nests the logo with it), so the wrappers below are arranged to
 * reproduce both sets of gaps with one DOM: logo→copy 16/24px, copy→legal
 * 20/24px, content→CTA 32px. Figma's body/medium (16/19) and body/xsmall
 * (12/14) pair sizes with line-heights from other ramp steps, hence the
 * `leading-(--text-N--line-height)` overrides.
 */
export default function Hero({
  backgroundSrc,
  logoSrc,
  logoAlt = '',
  title,
  description,
  priceText,
  legal,
  ctaLabel,
  ctaHref,
  className,
  ...props
}: HeroProps): JSX.Element {
  return (
    <section
      data-component="Hero"
      className={cn(
        'relative flex flex-col items-center overflow-hidden px-4 pt-14 pb-6',
        'lg:min-h-[572px] lg:items-start lg:justify-center lg:px-13 lg:py-9',
        className,
      )}
      {...props}
    >
      {/* Full-bleed background poster. */}
      <img
        src={backgroundSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full object-cover"
      />

      {/* Content column → CTA (32px at every breakpoint). */}
      <div className="relative flex w-full max-w-[393px] flex-col items-center gap-7 lg:max-w-[511px] lg:items-start">
        {/* Logo → copy. */}
        <div className="flex w-full flex-col items-center gap-4 lg:items-start lg:gap-6">
          <img
            src={logoSrc}
            alt={logoAlt}
            className="h-[54px] w-[307px] max-w-full object-contain object-center lg:object-left"
          />

          {/* Copy → legal. */}
          <div className="flex w-full flex-col items-center gap-5 lg:items-start lg:gap-6">
            <div className="flex w-full flex-col gap-5 text-center lg:text-left">
              <div className="flex flex-col gap-3 lg:gap-4">
                <h1 className="font-headline text-9 tracking-[-0.32px] text-text-secondary lg:text-11 lg:tracking-[-0.48px]">
                  {title}
                </h1>
                {description ? (
                  <p className="font-body text-4 leading-(--text-3--line-height) text-text-tertiary lg:text-6 lg:leading-(--text-6--line-height)">
                    {description}
                  </p>
                ) : null}
              </div>

              {priceText ? (
                <p className="font-body text-4 leading-(--text-3--line-height) text-text-secondary lg:text-6 lg:leading-(--text-6--line-height)">
                  {priceText}
                </p>
              ) : null}
            </div>

            {legal ? (
              <p className="w-full max-w-[315px] text-center font-body text-2 leading-(--text-1--line-height) text-text-secondary lg:max-w-none lg:text-left lg:text-text-tertiary">
                {legal}
              </p>
            ) : null}
          </div>
        </div>

        {ctaLabel ? (
          ctaHref ? (
            <Button label={ctaLabel} href={ctaHref} />
          ) : (
            <Button label={ctaLabel} />
          )
        ) : null}
      </div>
    </section>
  );
}
