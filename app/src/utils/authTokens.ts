import { getSession } from 'next-auth/react';

let cachedCsrfToken: string | null = null;
let csrfTokenPromise: Promise<string | null> | null = null;

// Decode JWT payload without verification (just to check expiration)
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

// Check if token is expired or will expire soon (within 5 minutes)
function isTokenExpiredOrExpiring(token: string, bufferMs = 5 * 60 * 1000): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const expiresAt = payload.exp * 1000; // JWT exp is in seconds
  return Date.now() + bufferMs >= expiresAt;
}

export async function getCsrfToken(): Promise<string | null> {
  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = fetch('/api/auth/csrf')
    .then((res) => {
      cachedCsrfToken = res.headers.get('X-CSRF-Token');
      csrfTokenPromise = null;
      return cachedCsrfToken;
    })
    .catch(() => {
      csrfTokenPromise = null;
      return null;
    });

  return csrfTokenPromise;
}

let refreshPromise: Promise<string | null> | null = null;

export async function getAuthToken(forceRefresh = false): Promise<string | null> {
  // If already refreshing, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  const session = await getSession();
  const token = session?.accessToken;

  if (!token) return null;

  // Check if token is expired or expiring soon
  if (forceRefresh || isTokenExpiredOrExpiring(token)) {
    console.log('[authTokens] Token expired or expiring, forcing session refresh');

    // Force session update by calling the session endpoint with update trigger
    refreshPromise = fetch('/api/auth/session', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => getSession())
      .then((newSession) => {
        refreshPromise = null;
        return newSession?.accessToken || null;
      })
      .catch(() => {
        refreshPromise = null;
        return null;
      });

    return refreshPromise;
  }

  return token;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  const [token, csrfToken] = await Promise.all([
    getAuthToken(),
    getCsrfToken(),
  ]);

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
}

export function clearTokenCache(): void {
  cachedCsrfToken = null;
  csrfTokenPromise = null;
  refreshPromise = null;
}

// Force refresh the auth token (useful when token expired error is received)
export async function refreshAuthToken(): Promise<string | null> {
  clearTokenCache();
  return getAuthToken(true);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}
