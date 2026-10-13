/** Stable identifiers for each WordPress Multisite tenant. */
export type TenantKey = 'main' | 'shudder' | 'acorn' | 'sundancenow' | 'wetv';

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
