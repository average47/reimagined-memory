import type { HTMLAttributes, ReactNode } from 'react';

/**
 * One card in the {@link BrandCardsProps.cards} row: a logo/foreground image
 * over a full-bleed background, with a caption beneath.
 *
 * In the CMS these are populated from an attached `movie`/`tv_series` entry
 * (see the `mosaic/brand-cards` block), but the component itself is purely
 * presentational — it just renders whatever props it is given.
 */
export interface BrandCardItem {
  /** Caption shown beneath the logo (e.g. the title or a service category). */
  label: string;
  /** Logo / foreground image URL, shown centered in the card. */
  imageSrc?: string;
  /** Accessible name for the logo image. */
  imageAlt?: string;
  /** Full-bleed card background image URL (e.g. the title's poster/art). */
  backgroundSrc?: string;
  /** Link target for the card; when set the whole card becomes a link. */
  href?: string;
}

/**
 * Brand Cards — from the Figma "Brand Cards" component
 * (Marketing Platform · node 2030:985), which ships Mobile (393) and Desktop
 * (1440) frames. The two frames collapse into one responsive component: the
 * Mobile frame is the base, the Desktop frame is layered on with `lg:`.
 */
export interface BrandCardsProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Section headline. */
  headline: ReactNode;
  /** The cards to display in the row. */
  cards: BrandCardItem[];
  /** CTA label. Omit to hide the CTA. */
  ctaLabel?: ReactNode;
  /** CTA target; when set the CTA renders as a link. */
  ctaHref?: string;
}
