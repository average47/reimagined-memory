import type { HTMLAttributes, ReactNode } from "react";

/**
 * Marketing hero section (AMC+ "Exceptional Stories" design).
 *
 * Content and assets are passed in so the section stays brand-agnostic: the
 * AMC+ copy, logo, and background live in the consuming app, not the component.
 */
export interface HeroProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Full-bleed background image URL (rendered behind a legibility gradient). */
  backgroundSrc: string;
  /** Brand logo image URL. */
  logoSrc: string;
  /** Accessible alt text for the logo. */
  logoAlt?: string;
  /** Primary headline. */
  title: ReactNode;
  /** Supporting description below the headline. */
  description: ReactNode;
  /** Optional price / supporting line above the CTA. */
  priceText?: ReactNode;
  /** Call-to-action label. */
  ctaLabel: string;
  /** CTA destination. When omitted, the CTA renders as a button. */
  ctaHref?: string;
}
