import siteConfigDomainMap from './siteConfigDomainMap';
import type { ISiteConfig } from './typings';

export function getSiteConfig(reqHost: string): ISiteConfig {
  if (reqHost === 'default' || reqHost === 'undefined') {
    return siteConfigDomainMap['amcplus.com']!;
  }
  const [topLevelDomain, rootDomain] = reqHost.split('.').reverse();
  const rootDomainWithTLD = `${rootDomain}.${topLevelDomain}`;
  const siteConfig =
    rootDomainWithTLD in siteConfigDomainMap
      ? siteConfigDomainMap[rootDomainWithTLD]!
      : siteConfigDomainMap['amcplus.com']!;

  return siteConfig;
}
