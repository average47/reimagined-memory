import type { NextRequest } from 'next/server';

/**
 * Host for site resolution. A bare `localhost` (no brand subdomain) is the
 * unbranded default rather than any one brand, so it resolves to the `default`
 * sentinel that `getSiteConfig` maps to `defaultConfig`.
 */
export function getHostname(request: NextRequest): string {
  const hostHeader = request.headers.get('host');
  const reqHost = hostHeader?.split(':')[0] ?? 'localhost';
  return reqHost === 'localhost' ? 'default' : reqHost;
}
