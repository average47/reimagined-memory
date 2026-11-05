import type { HTMLAttributes, ReactNode } from 'react';
import type { CardProps } from '../Card';

/**
 * One card in the BrandCards row — the serializable subset of `CardProps`
 * (each item renders a shared `Card`).
 */
export type BrandCardsItem = Pick<
  CardProps,
  'label' | 'imageSrc' | 'imageAlt' | 'backgroundSrc' | 'href'
>;

/**
 * BrandCards — from the Figma "BrandCards" component (Marketing Platform ·
 * node 2314:195): a centred headline over a row of brand/service `Card`s,
 * followed by a CTA. Figma ships `Breakpoint=Mobile` (2×2 grid) and
 * `Breakpoint=Desktop` (single row) variants; they collapse into one
 * responsive component — Mobile is the base, Desktop is layered on with `lg:`.
 */
export interface BrandCardsProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Headline copy, e.g. "Premium Entertainment Headline Goes Here". */
  title: ReactNode;
  /** The cards to show; they wrap two-up on mobile and sit in one row on desktop. */
  cards: BrandCardsItem[];
  /** CTA label. Omit to hide the CTA. */
  ctaLabel?: ReactNode;
  /** CTA target; when set the CTA renders as a link. */
  ctaHref?: string;
}
