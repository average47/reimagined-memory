import type { HTMLAttributes, ReactNode } from 'react';
import type { CardProps } from '../Card';

/**
 * A single category card in the grid — the presentational subset of `CardProps`
 * (the section drives a list of `Card`s, so event/DOM props don't apply here).
 */
export type BrandCardItem = Pick<
  CardProps,
  'label' | 'imageSrc' | 'imageAlt' | 'backgroundSrc' | 'href'
>;

/**
 * BrandCards — from the Figma "BrandCards" section (Marketing Platform ·
 * node 2227:534 Desktop / 2227:1050 Mobile): a headline over a grid of brand /
 * service-category cards, with a primary CTA beneath.
 *
 * Figma ships discrete Mobile (393px) and Desktop (1440px) frames; they collapse
 * into one responsive component — the Mobile frame is the base and the Desktop
 * frame is layered on with Tailwind's `lg:` prefix (there is no tablet frame).
 * The cards and CTA reuse the shared `Card` and `Button`; all imagery and copy
 * is prop-supplied, so it stays dynamic.
 */
export interface BrandCardsProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Section headline, e.g. "Your Destination for Premium Entertainment". */
  title: ReactNode;
  /** The cards to render in the grid (four in the design, but any count works). */
  cards: BrandCardItem[];
  /** CTA label. Omit to hide the CTA. */
  ctaLabel?: ReactNode;
  /** CTA target; when set the CTA renders as a link. */
  ctaHref?: string;
}
