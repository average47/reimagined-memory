import type {
  GraphQLResponse,
  Tenant,
  TenantKey,
  WordPressPost,
  WpFetchInit,
} from "./wordpress.types";

/**
 * Base URL of the headless WordPress Multisite network (see apps/cms).
 * Override with WORDPRESS_BASE_URL, e.g. the deployed CMS origin.
 */
const BASE_URL = (
  process.env.WORDPRESS_BASE_URL ?? "http://localhost"
).replace(/\/$/, "");

/** The four tenants served by the WordPress Multisite network. */
export const TENANTS: readonly Tenant[] = [
  { key: "main", label: "AMC+", path: "" },
  { key: "shudder", label: "Shudder", path: "shudder" },
  { key: "acorn", label: "Acorn", path: "acorn" },
  { key: "sundancenow", label: "Sundance Now", path: "sundancenow" },
] as const;

export function getTenant(key: TenantKey): Tenant {
  const tenant = TENANTS.find((t) => t.key === key);
  if (!tenant) throw new Error(`Unknown WordPress tenant: ${key}`);
  return tenant;
}

/** Narrow an arbitrary string to a valid TenantKey, falling back to "main". */
export function resolveTenantKey(value: string | undefined): TenantKey {
  return TENANTS.some((t) => t.key === value)
    ? (value as TenantKey)
    : "main";
}

/** GraphQL endpoint URL for a given tenant. */
export function graphqlEndpoint(key: TenantKey): string {
  const { path } = getTenant(key);
  return path ? `${BASE_URL}/${path}/graphql` : `${BASE_URL}/graphql`;
}

/**
 * Execute a GraphQL query against a specific tenant's WPGraphQL endpoint.
 *
 * @throws if the request fails or the response contains GraphQL errors.
 */
export async function wpFetch<T>(
  tenant: TenantKey,
  query: string,
  variables?: Record<string, unknown>,
  init: WpFetchInit = {},
): Promise<T> {
  const endpoint = graphqlEndpoint(tenant);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...init.headers },
    body: JSON.stringify({ query, variables }),
    // Default to a 60s ISR window; callers can override via `init.next`/`init.cache`.
    next: { revalidate: 60 },
    ...init,
  });

  if (!res.ok) {
    throw new Error(
      `WordPress request to ${endpoint} failed: ${res.status} ${res.statusText}`,
    );
  }

  const json = (await res.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(
      `WordPress GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`,
    );
  }

  if (!json.data) {
    throw new Error(`WordPress GraphQL response for ${endpoint} had no data`);
  }

  return json.data;
}

const POSTS_QUERY = /* GraphQL */ `
  query LatestPosts($first: Int!) {
    posts(first: $first, where: { status: PUBLISH }) {
      nodes {
        id
        slug
        title
        excerpt
        date
      }
    }
  }
`;

interface PostsQueryResult {
  posts: { nodes: WordPressPost[] };
}

/** Fetch the latest published posts for a tenant. */
export async function getPosts(
  tenant: TenantKey,
  first = 10,
  init?: WpFetchInit,
): Promise<WordPressPost[]> {
  const data = await wpFetch<PostsQueryResult>(
    tenant,
    POSTS_QUERY,
    { first },
    init,
  );
  return data.posts.nodes;
}
