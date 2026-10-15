import type { HTMLAttributes } from 'react';

/**
 * Site header — a top bar that renders the brand logo (or the site name as a
 * text fallback) in the upper-left corner.
 *
 * The bar is fixed to the top of the viewport and fades from transparent to the
 * opaque background over the first two bar-heights of scroll.
 *
 * Mobile-first and responsive: the base layout is the mobile bar, with larger
 * horizontal padding layered on at `md:`/`lg:`. The wordmark optionally links
 * home when `href` is set.
 */
export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  /**
   * Brand/site name. Used as the logo's accessible name, and shown as a text
   * wordmark when `logoSrc` is not set.
   */
  siteName: string;
  /**
   * URL of the brand logo image (e.g. `/logos/amcplus/white.svg`). When set,
   * the logo is rendered in place of the site-name text.
   */
  logoSrc?: string;
  /** Optional link target for the wordmark (e.g. "/"). When set it renders as a link. */
  href?: string;
}
