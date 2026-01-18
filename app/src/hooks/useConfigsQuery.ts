import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import http from '@/src/utils/http';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/**
 * Plant configuration record from the API
 */
export interface ConfigPlant {
  id: string;
  name: string;
  config: string | Record<string, unknown>;
  isDefault: boolean;
  created_at: number;
}

// ─────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────

export const configKeys = {
  all: ['configs'] as const,
  lists: () => [...configKeys.all, 'list'] as const,
  detail: (id: string) => [...configKeys.all, 'detail', id] as const,
};

// ─────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all available plant configurations
 * GET /config
 */
export function useConfigs(
  options?: Omit<UseQueryOptions<ConfigPlant[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: configKeys.lists(),
    queryFn: async () => {
      const response = await http.get<ConfigPlant[] | { data: ConfigPlant[] }>('/config');
      const data = response.data;

      // Handle both array response and wrapped response
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
        return data.data;
      }

      console.warn('[useConfigs] API returned unexpected format:', data);
      return [];
    },
    staleTime: 60 * 1000, // 1 minute - configs don't change often
    ...options,
  });
}
