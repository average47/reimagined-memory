import { useId, type JSX } from 'react';
import { cn } from '@repo/utils';
import { Button } from '../Button';
import type {
  CollectionSwimlaneItem,
  CollectionSwimlaneProps,
} from './CollectionSwimlane.types';

/*
 * CollectionSwimlane — from the Figma "CollectionSwimlane" component
 * (Marketing Platform, node 2236:118). Figma only ships a Desktop (1440px)
 * frame, so the mobile layout below is the unprefixed base (a narrower take on
 * the same stack) and the Desktop frame is layered on with `lg:`. There is no
 * tablet frame, so no `md:` overrides.
 *
 * The poster row is the Figma "Card" `Type=Vertical Swimlane` variant — a bare
 * 2:3 poster (105×158 mobile, 140×210 desktop) — which has no equivalent in the
 * shared `Card` (that's the `Type=Brand` logo + caption card), so the tile is
 * rendered here. The row scrolls horizontally when the titles overflow; at
 * 1440px eight posters fit exactly, as in the design.
 *
 * Figma's body/medium (16/19) and cta/large (18/25) pair sizes with
 * line-heights from other ramp steps, hence the `leading-(--text-N--line-height)`
 * overrides. The intro's 128px inset (spacing-13) and the row's 90px inset
 * differ in the design; 90px and the 330px intro width have no token.
 */
export default function CollectionSwimlane({
  title,
  description,
  ctaLabel,
  ctaHref,
  swimlaneTitle,
  items,
  backgroundSrc,
  className,
  ...props
}: CollectionSwimlaneProps): JSX.Element {
  const headingId = useId();
  const swimlaneId = useId();
  // Linked posters are already focusable; otherwise make the scroller itself
  // focusable so keyboard users can scroll it.
  const hasLinks = items.some((item) => item.href);

  return (
    <section
      data-component="CollectionSwimlane"
      aria-labelledby={headingId}
      className={cn(
        'relative flex flex-col gap-8 overflow-hidden bg-background-surface py-9',
        'lg:gap-10 lg:py-11',
        className,
      )}
      {...props}
    >
      {/* Full-bleed background art. */}
      {backgroundSrc ? (
        <img
          src={backgroundSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}

      {/* Intro: copy → CTA (24px). */}
      <div className="relative flex flex-col items-start gap-6 px-4 lg:pl-13">
        <div className="flex w-full max-w-[330px] flex-col gap-2">
          <h2
            id={headingId}
            className="font-headline font-regular text-8 tracking-[-0.01em] text-text-secondary lg:text-10"
          >
            {title}
          </h2>
          {description ? (
            <p className="font-body font-regular text-4 leading-(--text-3--line-height) text-text-tertiary">
              {description}
            </p>
          ) : null}
        </div>

        {ctaLabel ? (
          ctaHref ? (
            <Button label={ctaLabel} href={ctaHref} />
          ) : (
            <Button label={ctaLabel} />
          )
        ) : null}
      </div>

      {/* Swimlane: heading → poster row (16px). */}
      <div className="relative flex flex-col gap-4">
        {swimlaneTitle ? (
          <h3
            id={swimlaneId}
            className="px-4 font-cta font-bold text-5 leading-(--text-7--line-height) text-text-tertiary lg:px-[90px]"
          >
            {swimlaneTitle}
          </h3>
        ) : null}

        <ul
          aria-labelledby={swimlaneTitle ? swimlaneId : headingId}
          tabIndex={hasLinks ? undefined : 0}
          className={cn(
            'flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-hover',
            'lg:scroll-px-[90px] lg:gap-5 lg:px-[90px]',
          )}
        >
          {items.map((item, index) => (
            <li key={`${index}-${item.title}`} className="shrink-0 snap-start">
              <Poster {...item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** A single 2:3 poster tile; a link when the item has an `href`. */
function Poster({ title, imageSrc, href }: CollectionSwimlaneItem): JSX.Element {
  const classes =
    'block aspect-[2/3] w-[105px] overflow-hidden rounded-lg border border-border-default lg:w-[140px]';
  const image = (
    <img
      src={imageSrc}
      alt={title}
      loading="lazy"
      className="size-full object-cover"
    />
  );

  return href ? (
    <a
      href={href}
      className={cn(
        classes,
        'transition-colors hover:border-border-hover',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-hover',
      )}
    >
      {image}
    </a>
  ) : (
    <div className={classes}>{image}</div>
  );
}
