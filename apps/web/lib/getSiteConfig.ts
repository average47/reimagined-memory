import siteConfigDomainMap, { defaultConfig } from './siteConfigDomainMap';
import type { ISiteConfig } from './typings';

/**
 * Resolve a request's host to its site config. Anything not in the domain map —
 * including the explicit "default" sentinel and a bare `localhost` — resolves to
 * the unbranded default, which renders the base tokens with no `[data-brand]`.
 */
export function getSiteConfig(reqHost: string): ISiteConfig {
  if (reqHost === 'default' || reqHost === 'undefined') {
    return defaultConfig;
  }
  const [topLevelDomain, rootDomain] = reqHost.split('.').reverse();
  const rootDomainWithTLD = `${rootDomain}.${topLevelDomain}`;

  return rootDomainWithTLD in siteConfigDomainMap
    ? siteConfigDomainMap[rootDomainWithTLD]!
    : defaultConfig;
}
