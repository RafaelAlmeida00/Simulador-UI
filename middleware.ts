import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/oee',
  '/mttr-mtbf',
  '/stoppages',
  '/events',
  '/buffers',
  '/settings',
  '/health-simulator',
];

// Routes that should redirect to home if already authenticated
const authRoutes = ['/auth/signin', '/auth/register'];

// Public routes (always accessible)
const publicRoutes = ['/api/auth', '/api/health'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public API routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // Check if accessing auth routes while authenticated
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Check if accessing protected routes without authentication
  if (protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    if (!isAuthenticated) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
