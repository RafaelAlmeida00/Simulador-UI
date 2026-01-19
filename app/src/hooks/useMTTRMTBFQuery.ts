import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import http from '@/src/utils/http';
import { asArrayFromPayload } from '@/src/utils/safe';
import { useSessionId } from './useSessionId';
import type { IStopLine } from '@/src/types/socket';

/**
 * MTTR/MTBF data type from the API
 */
export interface MTTRMTBFRecord {
  id?: number;
  shop: string;
  line: string;
  station: string;
  mttr: number;
  mtbf: number;
  total_failures?: number;
  total_repair_time?: number;
  total_uptime?: number;
}

/**
 * Filter parameters for MTTR/MTBF API
 */
export interface MTTRMTBFFilters {
  date?: string;
  shop?: string;
  line?: string;
  station?: string;
}

/**
 * Query keys factory for MTTR/MTBF (session-scoped)
 */
export const mttrMtbfKeys = {
  all: (sessionId: string | null) => ['mttr-mtbf', sessionId] as const,
  list: (sessionId: string | null, filters: MTTRMTBFFilters) =>
    [...mttrMtbfKeys.all(sessionId), 'list', filters] as const,
};

/**
 * Query keys factory for completed stops (session-scoped)
 * Used by MTTR/MTBF page to calculate time since last stop
 */
export const completedStopsKeys = {
  all: (sessionId: string | null) => ['stops', sessionId, 'completed'] as const,
  list: (sessionId: string | null, filters: { shop?: string; line?: string; station?: string }) =>
    [...completedStopsKeys.all(sessionId), filters] as const,
};

/**
 * Hook for fetching MTTR/MTBF data (session-scoped)
 */
export function useMTTRMTBF(
  filters: MTTRMTBFFilters = {},
  options?: Omit<UseQueryOptions<MTTRMTBFRecord[], Error>, 'queryKey' | 'queryFn'>
) {
  const sessionId = useSessionId();

  return useQuery({
    queryKey: mttrMtbfKeys.list(sessionId, filters),
    queryFn: async () => {
      if (!sessionId) return [];

      const params: Record<string, string> = { session_id: sessionId };
      if (filters.date) params.date = filters.date;
      if (filters.shop) params.shop = filters.shop;
      if (filters.line) params.line = filters.line;
      if (filters.station) params.station = filters.station;

      const res = await http.get('/mttr-mtbf', { params });
      return asArrayFromPayload<MTTRMTBFRecord>(res.data);
    },
    enabled: !!sessionId && !!filters.date && (options?.enabled !== false),
    staleTime: 60 * 1000,
    ...options,
  });
}

/**
 * Hook for fetching completed stops (session-scoped)
 * Used by MTTR/MTBF page to calculate time since last stop per station
 */
export function useCompletedStops(
  filters: { shop?: string; line?: string; station?: string } = {},
  options?: Omit<UseQueryOptions<IStopLine[], Error>, 'queryKey' | 'queryFn'>
) {
  const sessionId = useSessionId();

  return useQuery({
    queryKey: completedStopsKeys.list(sessionId, filters),
    queryFn: async () => {
      if (!sessionId) return [];

      const params: Record<string, string> = {
        session_id: sessionId,
        status: 'COMPLETED',
      };
      if (filters.shop) params.shop = filters.shop;
      if (filters.line) params.line = filters.line;
      if (filters.station) params.station = filters.station;

      const res = await http.get('/stops', { params });
      return asArrayFromPayload<IStopLine>(res.data);
    },
    enabled: !!sessionId && (options?.enabled !== false),
    staleTime: 30 * 1000,
    ...options,
  });
}
