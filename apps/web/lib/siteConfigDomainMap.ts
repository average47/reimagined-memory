import type { ISiteConfig } from './typings';

/**
 * The unbranded default. Backs the WordPress network's primary site (tenant
 * "main") and is what `getSiteConfig` returns for any host that isn't in the
 * domain map below. Its route group sets no `[data-brand]`, so it renders the
 * base design tokens from `app/colors.css` rather than a brand's overrides, and
 * it ships no logo.
 *
 * `redirect` is where middleware sends an already-signed-in visitor. There is
 * no unbranded watch app, so this points at the corporate site rather than any
 * one brand's.
 */
export const defaultConfig: ISiteConfig = {
  title: 'Mosaic',
  logoRatio: '913/161',
  logoMaxWidth: 200,
  networkPath: 'default',
  redirect: 'https://www.amcnetworks.com/',
  loginPath: 'login',
  signupPath: 'signup',
};

const acornConfig: ISiteConfig = {
  title: 'Acorn TV',
  logoRatio: '913/161',
  logoMaxWidth: 200,
  networkPath: 'acorn',
  redirect: 'https://watch.acorn.tv/',
  loginPath: 'login',
  signupPath: 'signup',
};

const amcplusConfig: ISiteConfig = {
  title: 'AMC+ | Premium Streaming Service | Watch TV Shows & Movies',
  logoRatio: '67/34',
  logoMaxWidth: 223,
  logoSrc: '/logos/amcplus.png',
  networkPath: 'amcplus',
  redirect: 'https://watch.amcplus.com/',
  loginPath: 'login',
  signupPath: 'signup',
};

const shudderConfig: ISiteConfig = {
  title: 'SHUDDER | Stream Horror, Thrillers, and Suspense Ad-Free and Uncut',
  logoRatio: '913/161',
  logoMaxWidth: 510,
  logoSrc: '/logos/shudder.png',
  networkPath: 'shudder',
  redirect: 'https://watch.shudder.com/',
  loginPath: 'login',
  signupPath: 'signup',
};

const sundancenowConfig: ISiteConfig = {
  title: 'Sundance Now',
  logoRatio: '913/161',
  logoMaxWidth: 200,
  networkPath: 'sundancenow',
  redirect: 'https://watch.sundancenow.com/',
  loginPath: 'login',
  signupPath: 'signup',
};

const wetvConfig: ISiteConfig = {
  title: 'WeTV',
  logoRatio: '913/161',
  logoMaxWidth: 200,
  networkPath: 'wetv',
  redirect: 'https://watch.wetv.com/',
  loginPath: 'login',
  signupPath: 'signup',
};

const siteConfigDomainMap: Record<string, ISiteConfig> = {
  'acorn.tv': acornConfig,
  'acorn.localhost': acornConfig,
  'amcplus.com': amcplusConfig,
  'amcplus.localhost': amcplusConfig,
  'shudder.com': shudderConfig,
  'shudder.localhost': shudderConfig,
  'sundancenow.com': sundancenowConfig,
  'sundancenow.localhost': sundancenowConfig,
  'wetv.com': wetvConfig,
  'wetv.localhost': wetvConfig,
};

export const siteConfigNetworkMap: Record<string, ISiteConfig> = {
  default: defaultConfig,
  acorn: acornConfig,
  amcplus: amcplusConfig,
  shudder: shudderConfig,
  sundancenow: sundancenowConfig,
  wetv: wetvConfig,
};

export default siteConfigDomainMap;
