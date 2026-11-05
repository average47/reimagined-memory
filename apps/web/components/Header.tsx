import { headers } from 'next/headers';
import { siteConfigNetworkMap } from '@/lib/siteConfigDomainMap';
import { SITE_DESCRIPTION } from '@/lib/metadata';
import { getSiteMetadata, tenantForNetworkPath } from '@/lib/wordpress';
import { HeaderBar } from './HeaderBar';

// Brands that ship a white wordmark at public/logos/<brand>/white.svg. Others
// (acorn, the unbranded default) have no asset, so the bar renders empty.
const BRANDS_WITH_LOGO = new Set(['amcplus', 'shudder', 'sundancenow', 'wetv']);

/**
 * Site header (app chrome). Renders the current brand's wordmark, resolved from
 * the `x-network-path` the middleware sets (same source <Footer> reads). The
 * bar is 5rem tall (h-11) with the logo at 4rem (h-10), left-aligned and
 * vertically centred.
 */
export async function Header() {
  const networkPath = (await headers()).get('x-network-path') ?? '';
  const logoSrc = BRANDS_WITH_LOGO.has(networkPath)
    ? `/logos/${networkPath}/white.svg`
    : undefined;
  // The config title is an SEO string ("AMC+ | …"); the part before the first
  // "|" is the short brand name, used as the logo's accessible name.
  const siteName =
    siteConfigNetworkMap[networkPath]?.title.split('|')[0]?.trim() ?? '';

  // The right-aligned text mirrors the page's meta description: the tenant's
  // WordPress Tagline (blogdescription), falling back to the static default.
  const site = await getSiteMetadata(tenantForNetworkPath(networkPath));
  const description = site.description ?? SITE_DESCRIPTION;

  return (
    <HeaderBar
      logoSrc={logoSrc}
      siteName={siteName}
      description={description}
    />
  );
}
