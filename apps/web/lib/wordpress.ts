import type {
  GraphQLResponse,
  LibraryContentItem,
  LibraryInfo,
  LibraryMediaItem,
  MenuItemNode,
  MenuLocation,
  PageContentNode,
  PreviewContent,
  Resolved,
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

/** The tenants served by the WordPress Multisite network. */
export const TENANTS: readonly Tenant[] = [
  { key: 'main', label: 'Default (no brand)', path: '' },
  { key: 'amcplus', label: 'AMC+', path: 'amcplus' },
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
 * tenant. Every brand has its own subdirectory tenant; the unbranded `default`
 * site is the network's primary site ("main"), which is also the fallback for
 * any networkPath without a tenant of its own.
 */
const NETWORK_PATH_TO_TENANT: Record<string, TenantKey> = {
  default: 'main',
  amcplus: 'amcplus',
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

/** REST API base (wp/v2) for a given tenant. */
export function restEndpoint(key: TenantKey): string {
  const { path } = getTenant(key);
  const prefix = path ? `${BASE_URL}/${path}` : BASE_URL;
  return `${prefix}/wp-json/wp/v2`;
}

/** Map a WordPress post type to its REST base (rest_base). */
const POST_TYPE_REST: Record<string, string> = {
  page: 'pages',
  post: 'posts',
  movie: 'movies',
  tv_series: 'tv-series',
  tv_season: 'tv-seasons',
};

/**
 * Fetch a single draft/published node by database ID over the authenticated
 * REST API (`context=edit`), for Next.js Draft Mode previews. Requires
 * `WORDPRESS_PREVIEW_USER` + `WORDPRESS_PREVIEW_APP_PASSWORD` (a WordPress
 * Application Password). Returns null when the node can't be found.
 *
 * @throws if preview auth is unconfigured or the request fails.
 */
export async function getPreviewById(
  tenant: TenantKey,
  type: string,
  id: number,
): Promise<PreviewContent | null> {
  const user = process.env.WORDPRESS_PREVIEW_USER;
  const pass = process.env.WORDPRESS_PREVIEW_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      'Preview auth not configured: set WORDPRESS_PREVIEW_USER and WORDPRESS_PREVIEW_APP_PASSWORD.',
    );
  }

  const restBase = POST_TYPE_REST[type] ?? `${type}s`;
  const url = `${restEndpoint(tenant)}/${restBase}/${id}?context=edit`;
  const auth = Buffer.from(`${user}:${pass}`).toString('base64');

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(
      `WordPress preview request to ${url} failed: ${res.status} ${res.statusText}`,
    );
  }

  const json = (await res.json()) as {
    id: number;
    type: string;
    status: string;
    title?: { rendered?: string };
    content?: { rendered?: string };
  };

  return {
    databaseId: json.id,
    type: json.type,
    status: json.status,
    title: json.title?.rendered ?? '',
    content: json.content?.rendered ?? '',
  };
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

const MENU_QUERY = /* GraphQL */ `
  query Menu($location: MenuLocationEnum!) {
    menuItems(where: { location: $location }, first: 100) {
      nodes {
        id
        label
        url
        parentId
        target
        useIcon
      }
    }
  }
`;

interface MenuQueryResult {
  menuItems: { nodes: MenuItemNode[] };
}

/**
 * Fetch the items of the menu assigned to a location (HEADER / FOOTER) for a
 * tenant. Items are returned flat; `parentId` describes the nesting.
 */
export async function getMenu(
  tenant: TenantKey,
  location: MenuLocation,
  init?: WpFetchInit
): Promise<MenuItemNode[]> {
  const data = await wpFetch<MenuQueryResult>(
    tenant,
    MENU_QUERY,
    { location },
    init
  );
  return data.menuItems.nodes;
}

/* -------------------------------------------------------------------------- */
/* Shared library                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The tenant that holds the shared library: content authored once and reused
 * across microsites. It is the unbranded primary site, matching
 * `mosaic_library_blog_id()` in `apps/cms/mu-plugins/shared-library.php`.
 */
export const LIBRARY_TENANT: TenantKey = 'main';

/** Is this tenant the shared library itself? */
export function isLibraryTenant(key: TenantKey): boolean {
  return key === LIBRARY_TENANT;
}

/** Base URL of the library's `mosaic/v1` routes, served by every tenant. */
function libraryEndpoint(key: TenantKey = LIBRARY_TENANT): string {
  const { path } = getTenant(key);
  const prefix = path ? `${BASE_URL}/${path}` : BASE_URL;
  return `${prefix}/wp-json/mosaic/v1`;
}

/**
 * Fetch JSON from a `mosaic/v1` route.
 *
 * @throws if the request fails.
 */
async function libraryFetch<T>(
  route: string,
  init: WpFetchInit = {}
): Promise<T> {
  const url = `${libraryEndpoint()}/${route}`;

  const res = await fetch(url, {
    headers: { ...init.headers },
    next: { revalidate: 60 },
    ...init,
  });

  if (!res.ok) {
    throw new Error(
      `Shared library request to ${url} failed: ${res.status} ${res.statusText}`
    );
  }

  return (await res.json()) as T;
}

/**
 * Resolve a content node by slug with a shared-library fallback.
 *
 * A brand tenant's own content always wins; only when the brand has nothing at
 * that slug does the library answer. That makes a library page visible on every
 * microsite while still letting any brand shadow it by publishing its own page
 * at the same slug.
 *
 * Returns null when neither the brand nor the library has the slug. Querying
 * the library tenant itself does not double-fetch.
 */
export async function resolvePageBySlug(
  tenant: TenantKey,
  slug: string,
  init?: WpFetchInit
): Promise<Resolved<PageContentNode> | null> {
  const own = await getPageBySlug(tenant, slug, init);
  if (own) {
    return { value: own, source: tenant, shared: isLibraryTenant(tenant) };
  }

  if (isLibraryTenant(tenant)) return null;

  const shared = await getPageBySlug(LIBRARY_TENANT, slug, init);
  return shared
    ? { value: shared, source: LIBRARY_TENANT, shared: true }
    : null;
}

/**
 * Resolve a menu location with a shared-library fallback.
 *
 * Mirrors `resolvePageBySlug`: a brand's own menu wins, and the library's menu
 * fills in when the brand hasn't assigned one — which is what lets a single
 * footer be maintained once for every microsite. An empty menu counts as "not
 * assigned", since that is how an unassigned location reads over WPGraphQL.
 */
export async function resolveMenu(
  tenant: TenantKey,
  location: MenuLocation,
  init?: WpFetchInit
): Promise<Resolved<MenuItemNode[]>> {
  const own = await getMenu(tenant, location, init);
  if (own.length > 0 || isLibraryTenant(tenant)) {
    return { value: own, source: tenant, shared: isLibraryTenant(tenant) };
  }

  const shared = await getMenu(LIBRARY_TENANT, location, init);
  return { value: shared, source: LIBRARY_TENANT, shared: true };
}

/** Which site backs the shared library. */
export async function getLibraryInfo(
  init?: WpFetchInit
): Promise<LibraryInfo> {
  return libraryFetch<LibraryInfo>('library', init);
}

/**
 * Search the shared media library. Image attachments by default; pass a
 * different `mime` prefix (e.g. `video`) to widen it.
 */
export async function getLibraryMedia(
  options: {
    search?: string;
    perPage?: number;
    page?: number;
    mime?: string;
  } = {},
  init?: WpFetchInit
): Promise<{ items: LibraryMediaItem[]; total: number; pages: number }> {
  const params = new URLSearchParams({
    per_page: String(options.perPage ?? 20),
    page: String(options.page ?? 1),
    mime: options.mime ?? 'image',
  });
  if (options.search) params.set('search', options.search);

  return libraryFetch(`library/media?${params}`, init);
}

/** Search the shared library's pages/posts. */
export async function getLibraryContent(
  options: { search?: string; types?: string[]; perPage?: number } = {},
  init?: WpFetchInit
): Promise<{ items: LibraryContentItem[]; total: number }> {
  const params = new URLSearchParams({
    type: (options.types ?? ['page', 'post']).join(','),
    per_page: String(options.perPage ?? 20),
  });
  if (options.search) params.set('search', options.search);

  return libraryFetch(`library/content?${params}`, init);
}

/**
 * Resolve the two footer layers for a tenant.
 *
 * Unlike `resolveMenu`, these do not contend: a subsite's footer is *additive*
 * over the network-wide one. The `FOOTER` location means "this site's own
 * footer menu", which on the library is the global footer and on a brand is
 * that brand's local footer — so both layers come from one menu location
 * without a second registration in the theme.
 *
 * `local` is empty on the library itself, whose own menu is already the global
 * layer; returning it twice would render it above and below the copyright.
 *
 * A failure in either layer is contained: the other still renders.
 */
export async function resolveFooterMenus(
  tenant: TenantKey,
  init?: WpFetchInit
): Promise<{ local: MenuItemNode[]; global: MenuItemNode[] }> {
  const [local, global] = await Promise.all([
    isLibraryTenant(tenant)
      ? Promise.resolve<MenuItemNode[]>([])
      : getMenu(tenant, 'FOOTER', init).catch(() => []),
    getMenu(LIBRARY_TENANT, 'FOOTER', init).catch(() => []),
  ]);

  return { local, global };
}
