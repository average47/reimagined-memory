import type { JSX } from 'react';
import { cn } from '@repo/utils';
import type { HeaderProps } from './Header.types';

/*
 * Header — site top bar with the brand logo (or site name) anchored in the
 * upper-left corner.
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
      data-component="Header"
      className={cn(
        'flex items-center bg-background-default px-4 py-4 md:px-8 lg:px-13',
        className,
      )}
      {...props}
    >
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
