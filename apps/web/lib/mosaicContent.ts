/**
 * Parse WordPress rendered-content HTML into renderable parts, splitting out the
 * headless "Mosaic" block placeholders emitted by
 * apps/cms/mu-plugins/blocks.php:
 *
 *   <div data-mosaic-block="mosaic/button" data-mosaic-props="{…json…}"></div>
 *
 * The switcher (components/MosaicContent.tsx) swaps each block part for the
 * matching @repo/ui component and renders the html parts as-is. This module is
 * pure (no React/JSX) so it can be unit-tested in isolation.
 */

export interface MosaicHtmlPart {
  type: 'html';
  html: string;
}

export interface MosaicBlockPart {
  type: 'block';
  /** Fully-qualified block name, e.g. `mosaic/button`. */
  name: string;
  /** Attributes decoded from `data-mosaic-props`. */
  props: Record<string, unknown>;
}

export type MosaicContentPart = MosaicHtmlPart | MosaicBlockPart;

/*
 * Matches a placeholder div. blocks.php always emits the attributes in this
 * order (block name then props) and the element is always empty, so a targeted
 * regex is reliable and avoids pulling an HTML parser into the server render.
 */
const BLOCK_RE =
  /<div\b[^>]*\bdata-mosaic-block="([^"]+)"[^>]*\bdata-mosaic-props="([^"]*)"[^>]*><\/div>/g;

/** Reverse WordPress `esc_attr()` entity encoding so the JSON can be parsed. */
function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // must be last so entities aren't double-decoded
}

/**
 * Split rendered content into ordered html / block parts. Unparseable block
 * payloads degrade to an empty props object rather than throwing.
 */
export function parseMosaicContent(html: string): MosaicContentPart[] {
  const parts: MosaicContentPart[] = [];
  let lastIndex = 0;
  BLOCK_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = BLOCK_RE.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'html', html: html.slice(lastIndex, match.index) });
    }

    let props: Record<string, unknown> = {};
    try {
      const parsed: unknown = JSON.parse(decodeEntities(match[2] ?? ''));
      if (parsed && typeof parsed === 'object') {
        props = parsed as Record<string, unknown>;
      }
    } catch {
      props = {};
    }

    parts.push({ type: 'block', name: match[1] ?? '', props });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    parts.push({ type: 'html', html: html.slice(lastIndex) });
  }

  return parts;
}
