import { cookies, draftMode, headers } from 'next/headers';
import { MosaicContent } from '@/components/MosaicContent';
import {
  getPreviewById,
  resolvePageBySlug,
  tenantForNetworkPath,
} from '@/lib/wordpress';
import type {
  PageContentNode,
  PreviewContent,
  Resolved,
} from '@/lib/wordpress.types';

interface Props {
  params: Promise<{ slug: string }>;
}

const preStyle = {
  background: '#0d1117',
  borderRadius: '0.5rem',
  color: '#c9d1d9',
  overflow: 'auto',
  padding: '1rem',
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
  fontSize: '0.625rem',
};
const errStyle = {
  background: '#2b0000',
  borderRadius: '0.5rem',
  color: '#ff8a8a',
  overflow: 'auto',
  padding: '1rem',
  fontSize: '0.625rem',
};

/** Thin bar shown while Draft Mode is on, with a link to exit. */
function PreviewBanner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '8px',
        background: '#fdb517',
        color: '#000',
        font: '600 13px/1.2 ui-sans-serif, system-ui, sans-serif',
      }}
    >
      Preview mode — showing unpublished changes.
      <a href="/api/preview/exit" style={{ color: '#000' }}>
        Exit preview
      </a>
    </div>
  );
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const networkPath = (await headers()).get('x-network-path');
  const tenant = tenantForNetworkPath(networkPath);
  const { isEnabled: isPreview } = await draftMode();

  // ── Draft Mode: render the unpublished draft, fetched over authed REST. ──
  if (isPreview) {
    const raw = (await cookies()).get('mosaic-preview')?.value ?? '';
    const sep = raw.indexOf(':');
    const type = sep > 0 ? raw.slice(0, sep) : '';
    const id = sep > 0 ? Number(raw.slice(sep + 1)) : NaN;

    let preview: PreviewContent | null = null;
    let error: string | null = null;
    if (type && Number.isFinite(id)) {
      try {
        preview = await getPreviewById(tenant, type, id);
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    } else {
      error = 'No preview target found in the preview cookie.';
    }

    return (
      <>
        <PreviewBanner />
        {preview?.content ? <MosaicContent html={preview.content} /> : null}
        <main
          style={{ fontFamily: 'ui-monospace, monospace', padding: '2rem' }}
        >
          <h1>
            preview: {type || '?'} #{Number.isFinite(id) ? id : '?'} |{' '}
            {networkPath}
          </h1>
          {error ? (
            <pre style={errStyle}>Error loading preview: {error}</pre>
          ) : (
            <pre style={preStyle}>{JSON.stringify(preview, null, 2)}</pre>
          )}
        </main>
      </>
    );
  }

  // ── Published: fetch by slug over GraphQL, falling back to the shared
  // library when this brand has nothing at the slug. ──
  let resolved: Resolved<PageContentNode> | null = null;
  let error: string | null = null;
  try {
    resolved = await resolvePageBySlug(tenant, slug);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const data: PageContentNode | null = resolved?.value ?? null;

  const content =
    typeof data?.content === 'string' && data.content.trim()
      ? data.content
      : null;

  // Diagnostics (fetch error / empty result) are a dev-only aid — never surface
  // them to end users in a production build.
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <>
      <main>
        {/* Rendered content: Mosaic block placeholders become real @repo/ui
          components; everything else passes through as markup. */}
        {content ? <MosaicContent html={content} /> : null}
      </main>
      {isDev && error ? (
        <pre className="m-5" style={errStyle}>
          Error fetching page data: {error}
        </pre>
      ) : isDev && !content ? (
        <p>
          No content found for slug <code>{slug}</code> in tenant{' '}
          <code>{tenant}</code> or the shared library.
        </p>
      ) : null}
    </>
  );
}
