/** Stable identifiers for each WordPress Multisite tenant. */
export type TenantKey = "main" | "shudder" | "acorn" | "sundancenow";

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

/** Shape of a WPGraphQL response envelope. */
export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/** Extra fetch options callers may pass (e.g. Next.js caching hints). */
export type WpFetchInit = Pick<RequestInit, "cache" | "headers"> & {
  next?: { revalidate?: number | false; tags?: string[] };
};
