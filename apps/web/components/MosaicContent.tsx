import { Fragment, type ReactElement } from 'react';
import {
  BrandCards,
  Button,
  Card,
  Hero,
  type BrandCardItem,
  type ButtonVariant,
} from '@repo/ui';
import { parseMosaicContent, type MosaicBlockPart } from '@/lib/mosaicContent';

/** Coerce an optional block attribute to a string, or undefined when absent/empty. */
function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

const BUTTON_VARIANTS: readonly ButtonVariant[] = [
  'primary',
  'secondary',
  'tertiary',
];

function asVariant(value: unknown): ButtonVariant | undefined {
  return BUTTON_VARIANTS.includes(value as ButtonVariant)
    ? (value as ButtonVariant)
    : undefined;
}

/**
 * The switcher: map one `mosaic/*` block to the matching @repo/ui component,
 * passing its decoded attributes as props. Each case mirrors the component's
 * props 1:1; non-serializable props (event handlers) have no block attribute.
 * Add a case here when a new component's block ships (see apps/cms blocks.php).
 */
function renderBlock({ name, props }: MosaicBlockPart): ReactElement | null {
  switch (name) {
    case 'mosaic/button': {
      const label = String(props.label ?? '');
      const variant = asVariant(props.variant);
      const icon = optionalString(props.icon);
      const href = optionalString(props.href);
      // `href` discriminates the Button union (link vs button), so branch on it.
      return href !== undefined ? (
        <Button label={label} variant={variant} icon={icon} href={href} />
      ) : (
        <Button label={label} variant={variant} icon={icon} />
      );
    }
    case 'mosaic/hero':
      return (
        <Hero
          backgroundSrc={String(props.backgroundSrc ?? '')}
          logoSrc={String(props.logoSrc ?? '')}
          logoAlt={optionalString(props.logoAlt)}
          title={String(props.title ?? '')}
          description={optionalString(props.description)}
          priceText={optionalString(props.priceText)}
          legal={optionalString(props.legal)}
          ctaLabel={optionalString(props.ctaLabel)}
          ctaHref={optionalString(props.ctaHref)}
        />
      );
    case 'mosaic/brand-cards': {
      // Each card attaches a movie/tv_series in the editor, which seeds these
      // display fields; render from them (same approach as the other blocks).
      const rawCards = Array.isArray(props.cards) ? props.cards : [];
      const cards: BrandCardItem[] = rawCards.map((raw) => {
        const card = (raw ?? {}) as Record<string, unknown>;
        return {
          label: String(card.label ?? ''),
          imageSrc: optionalString(card.imageSrc),
          imageAlt: optionalString(card.imageAlt),
          backgroundSrc: optionalString(card.backgroundSrc),
          href: optionalString(card.href),
        };
      });
      return (
        <BrandCards
          headline={String(props.headline ?? '')}
          cards={cards}
          ctaLabel={optionalString(props.ctaLabel)}
          ctaHref={optionalString(props.ctaHref)}
        />
      );
    }
    case 'mosaic/card':
      // Like brand-cards: the attached movie/tv_series seeds these display
      // fields in the editor; render from them.
      return (
        <Card
          label={String(props.label ?? '')}
          imageSrc={optionalString(props.imageSrc)}
          imageAlt={optionalString(props.imageAlt)}
          backgroundSrc={optionalString(props.backgroundSrc)}
          href={optionalString(props.href)}
        />
      );
    default:
      // Unknown block (e.g. a component without a frontend mapping yet).
      return null;
  }
}

/**
 * Render WordPress rendered-content HTML, swapping Mosaic block placeholders for
 * their React components and emitting the surrounding markup unchanged.
 */
export function MosaicContent({ html }: { html: string }) {
  const parts = parseMosaicContent(html);

  return (
    <>
      {parts.map((part, index) =>
        part.type === 'block' ? (
          <Fragment key={index}>{renderBlock(part)}</Fragment>
        ) : part.html.trim() ? (
          <div key={index} dangerouslySetInnerHTML={{ __html: part.html }} />
        ) : null
      )}
    </>
  );
}
