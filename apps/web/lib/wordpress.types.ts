/**
 * Stable identifiers for each WordPress Multisite tenant. `main` is the
 * network's primary site, which belongs to no brand; every brand — AMC+
 * included — has its own subdirectory tenant.
 */
export type TenantKey =
  | 'main'
  | 'amcplus'
  | 'shudder'
  | 'acorn'
  | 'sundancenow'
  | 'wetv';

export interface Tenant {
  /** Stable key used in code and as the `?tenant=` query value. */
  key: TenantKey;
  /** Human-readable label. */
  label: string;
  /** Subdirectory path segment ("" for the primary/network site). */
  path: string;
}

export interface WordPressPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
}

/**
 * A content node fetched by slug for a page render. Common fields are typed;
 * type-specific fields (movie/series/season custom fields) vary by
 * `__typename`, so the node is left open for pretty-printing.
 */
export interface PageContentNode {
  __typename: string;
  databaseId: number;
  slug: string;
  uri: string;
  title?: string;
  content?: string | null;
  [key: string]: unknown;
}

/**
 * A draft/preview node fetched over the authenticated REST API (`context=edit`),
 * used by Next.js Draft Mode to render unpublished content.
 */
export interface PreviewContent {
  databaseId: number;
  type: string;
  status: string;
  title: string;
  /** Rendered content HTML (includes Mosaic block placeholders). */
  content: string;
}

/** A nav-menu item (header/footer) fetched by location over WPGraphQL. */
export interface MenuItemNode {
  id: string;
  label: string | null;
  url: string | null;
  /** Parent item id, or null for a top-level item. */
  parentId: string | null;
  /** `_blank` when "Open in new tab" is ticked. */
  target: string | null;
  /** Mirrors the "Use icon" menu-item checkbox. */
  useIcon: boolean | null;
}

/** Registered nav-menu locations exposed by the Mosaic theme. */
export type MenuLocation = 'HEADER' | 'FOOTER';

/** Shape of a WPGraphQL response envelope. */
export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/** Extra fetch options callers may pass (e.g. Next.js caching hints). */
export type WpFetchInit = Pick<RequestInit, 'cache' | 'headers'> & {
  next?: { revalidate?: number | false; tags?: string[] };
};

/* -------------------------------------------------------------------------- */
/* Shared library                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Where a piece of content was actually resolved from.
 *
 * Brand tenants fall back to the shared library, so a render needs to know
 * whether it is showing the brand's own content or the library's copy — see
 * `resolvePageBySlug` / `resolveMenu` in `wordpress.ts`.
 */
export interface Resolved<T> {
  value: T;
  /** The tenant that actually served it. */
  source: TenantKey;
  /** True when it came from the shared library rather than the brand's site. */
  shared: boolean;
}

/** An attachment in the shared media library (`mosaic/v1/library/media`). */
export interface LibraryMediaItem {
  id: number;
  url: string;
  title: string;
  alt: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  /** Generated sizes, keyed by WordPress size name (`thumbnail`, `medium`, …). */
  sizes: Record<string, { url: string; width: number; height: number }>;
}

/** A page/post reference in the shared library (`mosaic/v1/library/content`). */
export interface LibraryContentItem {
  id: number;
  type: string;
  slug: string;
  title: string;
  date: string;
}

/** Which site backs the shared library (`mosaic/v1/library`). */
export interface LibraryInfo {
  blogId: number;
  url: string;
  path: string;
  name: string;
  /** True when the queried tenant *is* the library. */
  isLibrary: boolean;
}
