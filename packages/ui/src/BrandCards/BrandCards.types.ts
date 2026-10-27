import type { HTMLAttributes, ReactNode } from 'react';
import type { CardProps } from '../Card';

/** One card in the row — the serializable subset of `Card`'s props. */
export type BrandCardsItem = Pick<
  CardProps,
  'label' | 'imageSrc' | 'imageAlt' | 'backgroundSrc' | 'href'
>;

/**
 * Brand Cards — from the Figma "BrandCards" component
 * (Marketing Platform · handoff node 2314:195, component set 2227:1049): a centred headline, a row of `Card`s
 * and a primary CTA. Figma ships `Breakpoint=Mobile` (393px, 2×2 grid) and
 * `Breakpoint=Desktop` (1440px, single row) frames; they collapse into one
 * responsive component — Mobile is the base, Desktop is layered on with `lg:`.
 */
export interface BrandCardsProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Section headline. */
  title: ReactNode;
  /** Cards to show, in order. Each renders a shared `Card`. */
  cards: BrandCardsItem[];
  /** CTA label, e.g. "Start Free Trial". Omit to hide the CTA. */
  ctaLabel?: ReactNode;
  /** CTA target; when set the CTA renders as a link. */
  ctaHref?: string;
}
