import type { HTMLAttributes } from 'react';

/**
 * Which brand lockup the Logo renders. Mirrors the Figma `property1` variants
 * on the "Logos" design-system frame (Marketing Platform · node 50:2851):
 * `mosaic` is the house logo (play mark + MOSAIC wordmark, 306×54), `amcplus`
 * is the AMC+ lockup (104×54).
 */
export type LogoBrand = 'mosaic' | 'amcplus';

/**
 * Logo — the brand logo lockup from the Figma "Logos + Logo Container" frame.
 * Purely presentational: it renders a fixed brand mark at the design's 54px
 * height and scales by height (width follows the lockup's aspect ratio), so a
 * caller resizes it with a height utility (e.g. `className="h-8"`).
 */
export interface LogoProps extends HTMLAttributes<HTMLSpanElement> {
  /** Brand lockup to render. Defaults to `mosaic` (the house logo). */
  brand?: LogoBrand;
}
