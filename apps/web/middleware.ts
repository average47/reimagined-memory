import { type NextRequest, NextResponse } from 'next/server';
import { getHostname } from './lib/getHostname';
import { getSiteConfig } from './lib/getSiteConfig';

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next|ifc|marketing).*)',
};

export function middleware(request: NextRequest) {
  const signinCookie = request.cookies.get('userLoggedIn');
  const reqHost = getHostname(request);
  const siteConfig = getSiteConfig(reqHost);

  if (signinCookie?.value === 'true') {
    return NextResponse.redirect(`${siteConfig.redirect}`);
  }

  const response = NextResponse.rewrite(
    new URL(
      `/sites/${siteConfig.networkPath}${request.nextUrl.pathname}${request.nextUrl.search}${request.nextUrl.pathname === '/' ? 'join' : ''}`,
      request.url
    )
  );
  response.headers.set('x-network-path', siteConfig.networkPath);
  response.headers.set('x-pathname', request.nextUrl.pathname);
  return response;
}
