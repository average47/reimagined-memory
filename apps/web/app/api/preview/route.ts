import { cookies, draftMode } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

// Shared with WordPress (apps/cms/mu-plugins/headless-preview.php). Override in
// non-dev environments via WORDPRESS_PREVIEW_SECRET.
const SECRET =
  process.env.WORDPRESS_PREVIEW_SECRET ?? 'mosaic-dev-preview-secret';

/**
 * Draft Mode entry point. WordPress's "Preview" button links here with a shared
 * secret and the target node's id/type; we validate, enable Draft Mode, remember
 * the target in a cookie, and bounce to its page on this same (brand) origin.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const secret = params.get('secret');
  const id = params.get('id');
  const type = params.get('type') ?? 'page';
  const slug = params.get('slug') ?? '';

  if (secret !== SECRET || !id) {
    return new NextResponse('Invalid preview request', { status: 401 });
  }

  (await draftMode()).enable();
  (await cookies()).set('mosaic-preview', `${type}:${id}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  // Relative redirect so it resolves against the brand host the browser used
  // (the proxy rewrites Host for Next, so an absolute URL would be wrong).
  return new NextResponse(null, {
    status: 307,
    headers: { Location: slug ? `/${slug}` : '/' },
  });
}
