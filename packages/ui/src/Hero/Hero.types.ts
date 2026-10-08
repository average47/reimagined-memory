import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Marketing hero — from the Figma "Hero" component
 * (Marketing Platform · node 61:4455), which ships Mobile and Desktop frames.
 *
 * The two breakpoint variants collapse into one responsive component: the
 * Mobile frame is the base layout, the Desktop frame is layered on with
 * Tailwind's `lg:` prefix (there is no tablet frame). The Figma show* variant
 * toggles are expressed as optional props — omit a prop to hide that element.
 */
export interface HeroProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Full-bleed background image URL (prop-supplied content, kept dynamic). */
  backgroundSrc: string;
  /** Brand logo image URL. */
  logoSrc: string;
  /** Accessible name for the logo. */
  logoAlt?: string;
  /** Headline copy. */
  title: ReactNode;
  /** Supporting subheader copy. */
  description?: ReactNode;
  /** Pricing line, e.g. "Plans start at $6.99/month". */
  priceText?: ReactNode;
  /** Fine-print legal copy shown beneath the pricing. */
  legal?: ReactNode;
  /** CTA label. Omit to hide the CTA. */
  ctaLabel?: ReactNode;
  /** CTA target; when set the CTA renders as a link. */
  ctaHref?: string;
}
