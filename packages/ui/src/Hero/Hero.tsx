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

      <div className="relative flex w-full flex-col items-center gap-8 lg:max-w-[511px] lg:items-start">
        <img
          src={logoSrc}
          alt={logoAlt}
          className="h-[54px] w-[307px] max-w-full object-contain object-center lg:object-left"
        />

        <div className="flex w-full flex-col gap-5 text-center lg:text-left">
          <div className="flex flex-col gap-3 lg:gap-4">
            <h1 className="font-headline text-9 tracking-[-0.32px] text-text-secondary lg:text-11 lg:tracking-[-0.48px]">
              {title}
            </h1>
            {description ? (
              <p className="font-body text-4 text-text-tertiary lg:text-6">
                {description}
              </p>
            ) : null}
          </div>

          {priceText ? (
            <p className="font-body text-4 text-text-secondary lg:text-6">
              {priceText}
            </p>
          ) : null}
        </div>

        {legal ? (
          <p className="w-full max-w-[315px] text-center font-body text-2 leading-tight text-text-tertiary lg:max-w-none lg:text-left">
            {legal}
          </p>
        ) : null}

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
