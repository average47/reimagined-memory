import { Fragment, type ReactElement } from 'react';
import {
  Button,
  Card,
  CollectionSwimlane,
  Hero,
  type ButtonVariant,
  type CollectionSwimlaneItem,
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
 * Coerce the swimlane's `items` attribute to poster props, dropping entries
 * without artwork. The attached `contentType`/`contentId` seed these display
 * fields in the editor; render from them.
 */
function asSwimlaneItems(value: unknown): CollectionSwimlaneItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return [];
    const item = entry as Record<string, unknown>;
    const imageSrc = optionalString(item.imageSrc);
    if (!imageSrc) return [];
    return [
      {
        title: String(item.title ?? ''),
        imageSrc,
        href: optionalString(item.href),
      },
    ];
  });
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
    case 'mosaic/card':
      // The attached movie/tv_series seeds these display fields in the editor;
      // render from them.
      return (
        <Card
          label={String(props.label ?? '')}
          imageSrc={optionalString(props.imageSrc)}
          imageAlt={optionalString(props.imageAlt)}
          backgroundSrc={optionalString(props.backgroundSrc)}
          href={optionalString(props.href)}
        />
      );
    case 'mosaic/collection-swimlane':
      return (
        <CollectionSwimlane
          backgroundSrc={optionalString(props.backgroundSrc)}
          title={String(props.title ?? '')}
          description={optionalString(props.description)}
          ctaLabel={optionalString(props.ctaLabel)}
          ctaHref={optionalString(props.ctaHref)}
          swimlaneTitle={optionalString(props.swimlaneTitle)}
          items={asSwimlaneItems(props.items)}
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
