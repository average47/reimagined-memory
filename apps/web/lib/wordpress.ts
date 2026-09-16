import type {
  GraphQLResponse,
  PageContentNode,
  Tenant,
  TenantKey,
  WordPressPost,
  WpFetchInit,
} from './wordpress.types';

/**
 * Base URL of the headless WordPress Multisite network (see apps/cms).
 * Override with WORDPRESS_BASE_URL, e.g. the deployed CMS origin.
 */
const BASE_URL = (process.env.WORDPRESS_BASE_URL ?? 'http://localhost').replace(
  /\/$/,
  ''
);

/** The four tenants served by the WordPress Multisite network. */
export const TENANTS: readonly Tenant[] = [
  { key: 'main', label: 'AMC+', path: '' },
  { key: 'shudder', label: 'Shudder', path: 'shudder' },
  { key: 'acorn', label: 'Acorn', path: 'acorn' },
  { key: 'sundancenow', label: 'Sundance Now', path: 'sundancenow' },
  { key: 'wetv', label: 'We TV', path: 'wetv' },
] as const;

export function getTenant(key: TenantKey): Tenant {
  const tenant = TENANTS.find((t) => t.key === key);
  if (!tenant) throw new Error(`Unknown WordPress tenant: ${key}`);
  return tenant;
}

/** Narrow an arbitrary string to a valid TenantKey, falling back to "main". */
export function resolveTenantKey(value: string | undefined): TenantKey {
  return TENANTS.some((t) => t.key === value) ? (value as TenantKey) : 'main';
}

/**
 * Map a site's `networkPath` (from middleware / siteConfigDomainMap) to a WP
 * tenant. AMC+ is the network's primary site ("main"); brands without a CMS
 * tenant (e.g. wetv) fall back to "main".
 */
const NETWORK_PATH_TO_TENANT: Record<string, TenantKey> = {
  amcplus: 'main',
  shudder: 'shudder',
  acorn: 'acorn',
  sundancenow: 'sundancenow',
  wetv: 'wetv',
};

export function tenantForNetworkPath(
  networkPath: string | null | undefined
): TenantKey {
  return (networkPath && NETWORK_PATH_TO_TENANT[networkPath]) || 'main';
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
  init: WpFetchInit = {}
): Promise<T> {
  const endpoint = graphqlEndpoint(tenant);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...init.headers },
    body: JSON.stringify({ query, variables }),
    // Default to a 60s ISR window; callers can override via `init.next`/`init.cache`.
    next: { revalidate: 60 },
    ...init,
  });

  if (!res.ok) {
    throw new Error(
      `WordPress request to ${endpoint} failed: ${res.status} ${res.statusText}`
    );
  }

  const json = (await res.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(
      `WordPress GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`
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
  init?: WpFetchInit
): Promise<WordPressPost[]> {
  const data = await wpFetch<PostsQueryResult>(
    tenant,
    POSTS_QUERY,
    { first },
    init
  );
  return data.posts.nodes;
}

const PAGE_BY_SLUG_QUERY = /* GraphQL */ `
  query PageBySlug($slug: String!) {
    contentNodes(first: 1, where: { name: $slug }) {
      nodes {
        __typename
        databaseId
        slug
        uri
        ... on NodeWithTitle {
          title
        }
        ... on NodeWithContentEditor {
          content
        }
        ... on Movie {
          movieUrl
          duration
          contentRating
          datePublished
          releaseRegions
          actors
          genres {
            nodes {
              name
            }
          }
          image {
            contentUrl
            dateModified
            regionsAllowed
          }
          watchTargets {
            urlTemplate
            actionPlatform
          }
          accessSpecifications {
            category
            availabilityStarts
            availabilityEnds
            subscriptionName
            commonTier
            eligibleRegions
          }
        }
        ... on TvSeries {
          seriesUrl
          seasonNumber
          contentRating
          datePublished
          releaseRegions
          actors
          partOfSeries {
            id
            name
          }
          genres {
            nodes {
              name
            }
          }
          image {
            contentUrl
            dateModified
            regionsAllowed
          }
          watchTargets {
            urlTemplate
            actionPlatform
          }
          accessSpecifications {
            category
            availabilityStarts
            availabilityEnds
            subscriptionName
            commonTier
            eligibleRegions
          }
        }
        ... on TvSeason {
          seasonUrl
          seasonNumber
          contentRating
          datePublished
          releaseRegions
          actors
          partOfSeries {
            id
            name
          }
          genres {
            nodes {
              name
            }
          }
          image {
            contentUrl
            dateModified
            regionsAllowed
          }
          watchTargets {
            urlTemplate
            actionPlatform
          }
          accessSpecifications {
            category
            availabilityStarts
            availabilityEnds
            subscriptionName
            commonTier
            eligibleRegions
          }
        }
      }
    }
  }
`;

interface PageBySlugResult {
  contentNodes: { nodes: PageContentNode[] };
}

/**
 * Fetch a single content node (movie / tv_series / tv_season / post / page) by
 * its slug for a tenant. Returns null when nothing matches the slug.
 */
export async function getPageBySlug(
  tenant: TenantKey,
  slug: string,
  init?: WpFetchInit
): Promise<PageContentNode | null> {
  const data = await wpFetch<PageBySlugResult>(
    tenant,
    PAGE_BY_SLUG_QUERY,
    { slug },
    init
  );
  return data.contentNodes.nodes[0] ?? null;
}
