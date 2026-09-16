import type { ISiteConfig } from './typings';

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
  title: 'AMC+',
  logoRatio: '67/34',
  logoMaxWidth: 223,
  logoSrc: '/logos/amcplus.png',
  networkPath: 'amcplus',
  redirect: 'https://watch.amcplus.com/',
  loginPath: 'login',
  signupPath: 'signup',
};

const shudderConfig: ISiteConfig = {
  title: 'Shudder',
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
  acorn: acornConfig,
  amcplus: amcplusConfig,
  shudder: shudderConfig,
  sundancenow: sundancenowConfig,
  wetv: wetvConfig,
};

export default siteConfigDomainMap;
