import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@repo/ui";
import { formatDate } from "@repo/utils";
import { getPosts, resolveTenantKey, TENANTS } from "@/lib/wordpress";
import type { WordPressPost } from "@/lib/wordpress.types";

// Rendered per-request so the CMS is queried live (and a stopped CMS during
// `next build` doesn't fail the build).
export const dynamic = "force-dynamic";

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
    error = e instanceof Error ? e.message : "Failed to reach WordPress.";
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
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      {error ? (
        <Card>
          <CardTitle>Couldn&apos;t load posts</CardTitle>
          <CardDescription>{error}</CardDescription>
          <CardDescription>
            Is the CMS running? Start it with{" "}
            <code>pnpm --filter cms up</code>.
          </CardDescription>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardTitle>No posts yet</CardTitle>
          <CardDescription>
            This tenant has no published posts.
          </CardDescription>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Card>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>{formatDate(post.date)}</CardDescription>
                <div
                  className="mt-2 text-sm text-gray-600 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: post.excerpt }}
                />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
