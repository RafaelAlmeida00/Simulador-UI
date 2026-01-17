/**
 * CORS Configuration Module
 *
 * Provides explicit CORS configuration for API routes.
 * Use withCors() wrapper for API routes that need cross-origin access.
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// CORS Configuration by Environment
// ============================================

/**
 * Allowed origins per environment
 * Add your production domains here
 */
const ALLOWED_ORIGINS: Record<string, string[]> = {
  development: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  ],
  test: [
    'http://localhost:3000',
  ],
  production: [
    // Add your production domain(s) here
    // 'https://yourdomain.com',
    // 'https://www.yourdomain.com',
  ],
};

// Allowed HTTP methods for CORS requests
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

// Allowed headers in CORS requests
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-CSRF-Token',
  'X-Requested-With',
];

// Cache preflight response for 24 hours
const PREFLIGHT_MAX_AGE = 86400;

// ============================================
// CORS Helper Functions
// ============================================

/**
 * Get allowed origins for current environment
 */
export function getAllowedOrigins(): string[] {
  const env = process.env.NODE_ENV || 'development';
  const origins = ALLOWED_ORIGINS[env] || ALLOWED_ORIGINS.development;

  // Add custom origin from env if specified
  const customOrigin = process.env.CORS_ALLOWED_ORIGIN;
  if (customOrigin && !origins.includes(customOrigin)) {
    return [...origins, customOrigin];
  }

  return origins;
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Generate CORS headers for a request
 */
export function corsHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const origin = request.headers.get('origin');

  // Set Access-Control-Allow-Origin only if origin is allowed
  if (origin && isOriginAllowed(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  // Allow credentials (cookies, authorization headers)
  headers.set('Access-Control-Allow-Credentials', 'true');

  // Allowed methods
  headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));

  // Allowed headers
  headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));

  // Preflight cache
  headers.set('Access-Control-Max-Age', PREFLIGHT_MAX_AGE.toString());

  return headers;
}

/**
 * Handle OPTIONS preflight request
 */
export function handleOptionsRequest(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');

  // Check if origin is allowed
  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

// ============================================
// CORS Wrapper for API Routes
// ============================================

type ApiHandler = (request: NextRequest) => Promise<NextResponse>;

/**
 * Wrapper to add CORS support to API route handlers
 *
 * Usage:
 * ```typescript
 * // app/api/data/route.ts
 * import { withCors, handleOptionsRequest } from '../cors';
 *
 * async function handler(request: NextRequest): Promise<NextResponse> {
 *   return NextResponse.json({ data: 'example' });
 * }
 *
 * export const GET = withCors(handler);
 * export const OPTIONS = handleOptionsRequest;
 * ```
 */
export function withCors(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    const origin = request.headers.get('origin');

    // Check origin before processing (for non-GET requests)
    if (request.method !== 'GET' && origin && !isOriginAllowed(origin)) {
      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      return new NextResponse(
        JSON.stringify({ error: 'CORS policy violation' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Process the request
    const response = await handler(request);

    // Add CORS headers to response
    const headers = corsHeaders(request);
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Create a CORS-enabled API route handler object
 *
 * Usage:
 * ```typescript
 * // app/api/data/route.ts
 * import { createCorsHandler } from '../cors';
 *
 * const { withCors, OPTIONS } = createCorsHandler();
 *
 * async function handler(request: NextRequest) {
 *   return NextResponse.json({ data: 'example' });
 * }
 *
 * export const GET = withCors(handler);
 * export { OPTIONS };
 * ```
 */
export function createCorsHandler() {
  return {
    withCors,
    OPTIONS: handleOptionsRequest,
    isOriginAllowed,
    getAllowedOrigins,
  };
}
