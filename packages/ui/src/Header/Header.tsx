'use client';

import { useEffect, useRef, useState, type JSX } from 'react';
import { cn } from '@repo/utils';
import type { HeaderProps } from './Header.types';

/*
 * Header — site top bar with the brand logo (or site name) anchored in the
 * upper-left corner.
 *
 * It is fixed to the top-left of the viewport and starts transparent so page
 * content shows through, then fades to the opaque background as the page
 * scrolls, reaching full opacity at twice the bar's own height (and fading back
 * on the way up). The opacity is read straight off the scroll position rather
 * than animated with a CSS transition, so scrolling is what drives it.
 *
 * Mobile-first: the unprefixed layout is the mobile bar; only the horizontal
 * padding grows at md:/lg: to match the wider frames. Colours, type and spacing
 * resolve through the semantic tokens (font-headline, the type ramp, the 0–14
 * spacing scale) so each brand restyles via [data-brand]. The bar sits on the
 * dark background, so the text fallback uses text-text-secondary (white); the
 * logo is a prop-supplied, brand-specific "white" wordmark, so it stays dynamic.
 */
export default function Header({
  siteName,
  logoSrc,
  href,
  className,
  ...props
}: HeaderProps): JSX.Element {
  const barRef = useRef<HTMLElement>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = (): void => {
      frame = 0;
      const fadeDistance = (barRef.current?.offsetHeight ?? 0) * 2;
      setOpacity(
        fadeDistance > 0 ? Math.min(window.scrollY / fadeDistance, 1) : 0,
      );
    };

    const onScroll = (): void => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const wordmark = logoSrc ? (
    <img
      src={logoSrc}
      alt={siteName}
      className="h-7 w-auto max-w-[200px] object-contain object-left"
    />
  ) : (
    <span className="font-headline text-7 font-bold tracking-[-0.24px] text-text-secondary">
      {siteName}
    </span>
  );

  return (
    <header
      ref={barRef}
      data-component="Header"
      className={cn(
        'fixed inset-x-0 top-0 z-50 flex items-center px-4 py-4 md:px-8 lg:px-13',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-background-default"
        style={{ opacity }}
      />
      {href !== undefined ? (
        <a
          href={href}
          aria-label={siteName}
          className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-hover"
        >
          {wordmark}
        </a>
      ) : (
        wordmark
      )}
    </header>
  );
}
