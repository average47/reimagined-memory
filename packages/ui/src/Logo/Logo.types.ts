import type { HTMLAttributes } from 'react';

/**
 * Brand logo slot — from the Figma "Logos + Logo Container" frame
 * (Marketing Platform · node 50:2851).
 *
 * Figma's "Logo" container ships Desktop and Mobile variants that differ only
 * in alignment (left vs centred), so they collapse into one responsive
 * component. The "Logos" variants (Mosaic, AMC+) are brand artwork, so the mark
 * itself is prop-supplied rather than baked in — each brand passes its own
 * asset (e.g. `/logos/<brand>/white.svg` in apps/web).
 */
export interface LogoProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Logo image URL. */
  src: string;
  /** Accessible name, usually the brand name (e.g. "AMC+"). */
  alt: string;
}
