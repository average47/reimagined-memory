import { cookies, draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

/** Leave Draft Mode and clear the preview target cookie. */
export async function GET() {
  (await draftMode()).disable();
  (await cookies()).delete('mosaic-preview');
  return new NextResponse(null, { status: 307, headers: { Location: '/' } });
}
