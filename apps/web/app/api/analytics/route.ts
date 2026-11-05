import { type NextRequest, NextResponse } from 'next/server';

/**
 * Analytics beacon sink. Clients send telemetry here with
 * `navigator.sendBeacon('/api/analytics', payload)`, which always issues a POST
 * whose body arrives as whatever the caller set — JSON, `text/plain` (the
 * sendBeacon default for a string), `FormData`, or a raw `Blob`. We accept all
 * of them, normalize to an object, and record it.
 *
 * sendBeacon ignores the response, so we just return 204 once the body is read.
 */
export async function POST(request: NextRequest) {
  const payload = await parseBeacon(request);

  // Capture point: swap this for your analytics store/queue. Logging keeps the
  // request from being dropped silently while there's no backing sink yet.
  console.log('[analytics]', JSON.stringify(payload));

  return new NextResponse(null, { status: 204 });
}

/** Best-effort decode of a sendBeacon body across its possible content types. */
async function parseBeacon(request: NextRequest): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      return await request.json();
    }

    if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      return Object.fromEntries(await request.formData());
    }

    // text/plain (sendBeacon's default for a string) or anything else: read the
    // text and try to treat it as JSON, falling back to the raw string.
    const text = await request.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}
