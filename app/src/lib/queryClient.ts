import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration optimized for performance.
 *
 * Features:
 * - 30s stale time to reduce unnecessary refetches
 * - 5min garbage collection time for cache cleanup
 * - Exponential backoff retry with max 3 attempts
 * - Disabled refetch on window focus to prevent unnecessary network calls
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 seconds
        staleTime: 30 * 1000,
        // Cache is garbage collected after 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests up to 3 times
        retry: 3,
        // Exponential backoff: 1s, 2s, 4s (capped at 30s)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus (we have WebSocket for real-time)
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect (we handle this via socket)
        refetchOnReconnect: false,
        // Network-only mode when window is visible
        refetchOnMount: true,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

// Singleton for client-side usage
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return createQueryClient();
  }

  // Browser: reuse query client
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
