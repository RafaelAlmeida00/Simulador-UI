import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ============================================
// SECURITY: Content Security Policy Configuration
// ============================================

/**
 * Generate Content-Security-Policy header value
 */
function generateCSP(): string {
  const directives = [
    // Default fallback
    "default-src 'self'",
    // Scripts: self + inline (required for Next.js) + eval (required for dev)
    process.env.NODE_ENV === 'production'
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Styles: self + inline (required for Tailwind/CSS-in-JS)
    "style-src 'self' 'unsafe-inline'",
    // Images: self + data URIs + blob + any HTTPS (for user avatars)
    "img-src 'self' data: blob: https:",
    // Fonts: self
    "font-src 'self'",
    // Connections: self + WebSocket + any HTTPS API
    "connect-src 'self' wss: ws: https:",
    // Frames: none (prevent clickjacking)
    "frame-ancestors 'none'",
    // Form actions: self only
    "form-action 'self'",
    // Object/embed: none
    "object-src 'none'",
    // Base URI: self
    "base-uri 'self'",
  ];

  return directives.join('; ');
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set('Content-Security-Policy', generateCSP());

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (disable unused features)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

// ============================================
// Route Configuration
// ============================================

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

// ============================================
// Middleware Handler
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public API routes (with security headers)
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Get session token - NextAuth v5 uses 'authjs.session-token' as cookie name
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: '__Secure-authjs.session-token',
    salt: '__Secure-authjs.session-token',
  }) || await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: 'authjs.session-token',
    salt: 'authjs.session-token',
  });

  const isAuthenticated = !!token;

  // Check if accessing auth routes while authenticated
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      const redirectResponse = NextResponse.redirect(new URL('/', request.url));
      return addSecurityHeaders(redirectResponse);
    }
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Check if accessing protected routes without authentication
  if (protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    if (!isAuthenticated) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      const redirectResponse = NextResponse.redirect(signInUrl);
      return addSecurityHeaders(redirectResponse);
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
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
