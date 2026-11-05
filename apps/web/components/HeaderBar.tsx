'use client';

import { useEffect, useState } from 'react';

// Scroll distance (px) over which the header fades from invisible to fully
// opaque. 160px ≈ twice the 80px (h-11) header height.
const FULL_OPACITY_AT = 160;

/**
 * The fixed, fade-in header bar. Starts transparent at the top of the page and
 * ramps linearly to full opacity by `FULL_OPACITY_AT` px of scroll. Rendered by
 * the server `Header`, which resolves the brand logo.
 */
export function HeaderBar({
  logoSrc,
  siteName,
  description,
}: {
  logoSrc?: string;
  siteName: string;
  description: string;
}) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const update = () =>
      setOpacity(Math.min(window.scrollY / FULL_OPACITY_AT, 1));
    update(); // sync to the current position (e.g. a reload mid-page)
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header
      style={{ opacity }}
      className="fixed inset-x-0 top-0 z-50 flex h-11 items-center bg-background-surface px-7 shadow-2xl border-b border-gray-800"
    >
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoSrc} alt={siteName} className="h-7 w-auto" />
      ) : null}
      {/* Meta description, pushed to the right and vertically centred. */}
      <span className="ml-auto min-w-0 truncate pl-7 text-3 text-text-tertiary">
        {description}
      </span>
    </header>
  );
}
