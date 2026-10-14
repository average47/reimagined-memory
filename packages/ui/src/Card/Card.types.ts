import type { HTMLAttributes } from 'react';

/**
 * Card — from the Figma "Card" component (Marketing Platform · node 4017:145):
 * a logo/foreground image over full-bleed background art, with a caption
 * beneath. Figma ships `Property 1=Mobile` (173×236) and `Property 1=Desktop`
 * (232×317) variants; they collapse into one responsive component — the Mobile
 * variant is the base, the Desktop variant is layered on with `lg:`.
 *
 * In the CMS a card attaches a `movie`/`tv_series` entry (see the `mosaic/card`
 * block), but the component itself is purely presentational — it just renders
 * whatever props it is given.
 */
export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Caption shown beneath the logo (e.g. the title or a service category). */
  label: string;
  /** Logo / foreground image URL, shown centered at the top of the card. */
  imageSrc?: string;
  /** Accessible name for the logo image. */
  imageAlt?: string;
  /** Full-bleed card background image URL (e.g. the title's poster/art). */
  backgroundSrc?: string;
  /** Link target for the card; when set the whole card becomes a link. */
  href?: string;
}
