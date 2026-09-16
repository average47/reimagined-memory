import { cn } from "@repo/utils";
import type { HeroProps } from "./Hero.types";

const CTA_CLASSES =
  "inline-flex h-[54px] items-center justify-center rounded-xl bg-amc-primary px-16 py-4 text-lg font-bold leading-[25px] text-black transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amc-primary";

export function Hero({
  backgroundSrc,
  logoSrc,
  logoAlt = "",
  title,
  description,
  priceText,
  ctaLabel,
  ctaHref,
  className,
  ...props
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[420px] flex-col justify-center overflow-hidden px-6 py-12 sm:px-12 lg:px-32",
        className,
      )}
      {...props}
    >
      {/* Full-bleed background poster collage */}
      <img
        src={backgroundSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Left-weighted dark overlay for text legibility.
          NOTE: the Figma "AMC+/Gradient" token did not resolve to a value, so
          this gradient is approximated to keep the copy readable. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent"
      />

      <div className="relative flex max-w-[511px] flex-col gap-8 font-endurance">
        <div className="flex flex-col gap-6">
          <img
            src={logoSrc}
            alt={logoAlt}
            className="h-[54px] w-[307px] max-w-full object-contain object-left"
          />

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl leading-none tracking-[-0.48px] text-white">
                {title}
              </h1>
              <p className="text-xl leading-6 text-amc-fg-muted">
                {description}
              </p>
            </div>
            {priceText ? (
              <p className="text-xl leading-6 text-white">{priceText}</p>
            ) : null}
          </div>
        </div>

        {ctaHref ? (
          <a href={ctaHref} className={cn(CTA_CLASSES, "self-start")}>
            {ctaLabel}
          </a>
        ) : (
          <button type="button" className={cn(CTA_CLASSES, "self-start")}>
            {ctaLabel}
          </button>
        )}
      </div>
    </section>
  );
}
