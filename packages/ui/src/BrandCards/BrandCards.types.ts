import type { HTMLAttributes, ReactNode } from 'react';
import type { CardProps } from '../Card';

/**
 * One card in the row — the serializable subset of `CardProps`. Each item is
 * rendered with the shared `Card`, so it carries the same logo/background/
 * caption/link fields.
 */
export type BrandCardsItem = Pick<
  CardProps,
  'label' | 'imageSrc' | 'imageAlt' | 'backgroundSrc' | 'href'
>;

/**
 * Brand Cards — from the Figma "BrandCards" component (Marketing Platform ·
 * node 2030:985): a centred headline over a row of `Card`s, with a primary CTA
 * beneath. Figma ships `Breakpoint=Mobile` (393px, 2×2 grid) and
 * `Breakpoint=Desktop` (1440px, single row) frames; they collapse into one
 * responsive component — the Mobile frame is the base, the Desktop frame is
 * layered on with `lg:`.
 *
 * In the CMS each card can attach a `movie`/`tv_series` entry (see the
 * `mosaic/brand-cards` block), but the component itself is purely
 * presentational — it just renders whatever props it is given.
 */
export interface BrandCardsProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Headline copy shown above the cards. */
  title: ReactNode;
  /** Cards to render, in order. The design shows four. */
  cards: BrandCardsItem[];
  /** CTA label. Omit to hide the CTA. */
  ctaLabel?: ReactNode;
  /** CTA target; when set the CTA renders as a link. */
  ctaHref?: string;
}
