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

/** Shape of a WPGraphQL response envelope. */
export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/** Extra fetch options callers may pass (e.g. Next.js caching hints). */
export type WpFetchInit = Pick<RequestInit, 'cache' | 'headers'> & {
  next?: { revalidate?: number | false; tags?: string[] };
};
