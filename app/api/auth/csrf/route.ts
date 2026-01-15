import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();

  // NextAuth stores CSRF token in a cookie (token|hash format)
  const csrfCookie =
    cookieStore.get('next-auth.csrf-token')?.value ||
    cookieStore.get('__Host-next-auth.csrf-token')?.value;

  const csrfToken = csrfCookie?.split('|')[0] || null;

  const response = new NextResponse(null, { status: 200 });

  if (csrfToken) {
    response.headers.set('X-CSRF-Token', csrfToken);
  }

  return response;
}
