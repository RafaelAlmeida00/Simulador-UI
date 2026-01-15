import { getSession } from 'next-auth/react';

let cachedCsrfToken: string | null = null;
let csrfTokenPromise: Promise<string | null> | null = null;

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

export async function getAuthToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken || null;
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
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}
