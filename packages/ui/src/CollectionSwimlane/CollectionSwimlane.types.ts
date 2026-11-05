import type { HTMLAttributes, ReactNode } from 'react';

/**
 * One title in the swimlane — a 2:3 poster tile (Figma "Card",
 * `Type=Vertical Swimlane`). In the CMS each item attaches a `movie`/`tv_series`
 * entry (see the `mosaic/collection-swimlane` block), but the component only
 * renders what it's given.
 */
export interface CollectionSwimlaneItem {
  /** Title name; used as the poster's accessible name. */
  title: string;
  /** Poster image URL (prop-supplied, kept dynamic). */
  imageSrc: string;
  /** Link target; when set the poster becomes a link. */
  href?: string;
}

/**
 * Collection swimlane — from the Figma "CollectionSwimlane" component
 * (Marketing Platform · node 2236:118): an intro (headline, subheader, CTA) over
 * full-bleed background art, followed by a titled, horizontally scrolling row
 * of poster tiles. Figma only ships a Desktop frame; the mobile layout is the
 * base and the desktop frame is layered on with `lg:`.
 */
export interface CollectionSwimlaneProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Headline copy, e.g. "New On AMC+". */
  title: ReactNode;
  /** Supporting subheader copy beneath the headline. */
  description?: ReactNode;
  /** CTA label. Omit to hide the CTA. */
  ctaLabel?: ReactNode;
  /** CTA target; when set the CTA renders as a link. */
  ctaHref?: string;
  /** Heading above the poster row, e.g. "New Arrivals". */
  swimlaneTitle?: ReactNode;
  /** Titles shown in the poster row, in order. */
  items: CollectionSwimlaneItem[];
  /** Full-bleed background image URL. Falls back to the surface colour. */
  backgroundSrc?: string;
}
