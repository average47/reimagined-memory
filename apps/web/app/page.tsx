import { headers } from 'next/headers';
import { MosaicContent } from '@/components/MosaicContent';
import { getPageBySlug, tenantForNetworkPath } from '@/lib/wordpress';
import type { PageContentNode } from '@/lib/wordpress.types';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const networkPath = (await headers()).get('x-network-path');
  const tenant = tenantForNetworkPath(networkPath);

  let data: PageContentNode | null = null;
  let error: string | null = null;
  try {
    data = await getPageBySlug(tenant, slug);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const content =
    typeof data?.content === 'string' && data.content.trim()
      ? data.content
      : null;

  return (
    <>
      {/* Rendered content: Mosaic block placeholders become real @repo/ui
          components; everything else passes through as markup. */}
      {content ? <MosaicContent html={content} /> : null}

      <main style={{ fontFamily: 'ui-monospace, monospace', padding: '2rem' }}>
        <h1>
          {slug} | {networkPath}
        </h1>
        <p style={{ color: '#666' }}>
          tenant: <strong>{tenant}</strong>
        </p>

        {error ? (
          <pre
            style={{
              background: '#2b0000',
              borderRadius: '0.5rem',
              color: '#ff8a8a',
              overflow: 'auto',
              padding: '1rem',
            }}
          >
            Error fetching page data: {error}
          </pre>
        ) : data ? (
          <pre
            style={{
              background: '#0d1117',
              borderRadius: '0.5rem',
              color: '#c9d1d9',
              overflow: 'auto',
              padding: '1rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : (
          <p>
            No content found for slug <code>{slug}</code> in tenant{' '}
            <code>{tenant}</code>.
          </p>
        )}
      </main>
    </>
  );
}
