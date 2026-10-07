import Link from 'next/link';
import { formatDate } from '@repo/utils';
import { getPosts, resolveTenantKey, TENANTS } from '@/lib/wordpress';
import type { WordPressPost } from '@/lib/wordpress.types';

// Rendered per-request so the CMS is queried live (and a stopped CMS during
// `next build` doesn't fail the build).
export const dynamic = 'force-dynamic';

const CARD_CLASS =
  'rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900';
const CARD_TITLE_CLASS =
  'text-lg font-semibold text-gray-900 dark:text-gray-50';
const CARD_DESC_CLASS = 'mt-1 text-sm text-gray-500 dark:text-gray-400';

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { tenant: tenantParam } = await searchParams;
  const tenant = resolveTenantKey(tenantParam);

  let posts: WordPressPost[] = [];
  let error: string | null = null;
  try {
    posts = await getPosts(tenant);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to reach WordPress.';
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
        <nav className="flex flex-wrap gap-2">
          {TENANTS.map((t) => (
            <Link
              key={t.key}
              href={`/posts?tenant=${t.key}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                t.key === tenant
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      {error ? (
        <div className={CARD_CLASS}>
          <h3 className={CARD_TITLE_CLASS}>Couldn&apos;t load posts</h3>
          <p className={CARD_DESC_CLASS}>{error}</p>
          <p className={CARD_DESC_CLASS}>
            Is the CMS running? Start it with <code>pnpm --filter cms up</code>.
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className={CARD_CLASS}>
          <h3 className={CARD_TITLE_CLASS}>No posts yet</h3>
          <p className={CARD_DESC_CLASS}>This tenant has no published posts.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <div className={CARD_CLASS}>
                <h3 className={CARD_TITLE_CLASS}>{post.title}</h3>
                <p className={CARD_DESC_CLASS}>{formatDate(post.date)}</p>
                <div
                  className="mt-2 text-sm text-gray-600 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: post.excerpt }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
