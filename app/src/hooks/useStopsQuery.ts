import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import http from '@/src/utils/http';
import { asArrayFromPayload } from '@/src/utils/safe';
import type { PaginationInfo } from '@/src/components/data-display/DataTable';

/**
 * Stop/Stoppage data type from the API
 */
export interface StopRecord {
  id: number;
  stop_id?: string;
  shop: string;
  line: string;
  station: string;
  reason: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'PLANNED' | null;
  type?: 'MICRO' | 'RANDOM_GENERATE' | 'PROPAGATION' | 'PLANNED';
  category?: string;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  start_time: number;
  end_time?: number;
  duration_ms?: number;
}

/**
 * Filter parameters for stops API
 */
export interface StopFilters {
  stop_id?: string;
  shop?: string;
  line?: string;
  station?: string;
  severity?: string;
  status?: string;
  type?: string;
  start_time?: number;
  end_time?: number;
}

/**
 * Paginated API response structure
 */
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
  count: number;
}

/**
 * Result type for paginated stops query
 */
export interface PaginatedStopsResult {
  data: StopRecord[];
  pagination: PaginationInfo;
}

/**
 * Query keys factory for stops
 */
export const stopKeys = {
  all: ['stops'] as const,
  lists: () => [...stopKeys.all, 'list'] as const,
  list: (filters: StopFilters) => [...stopKeys.lists(), filters] as const,
  paginated: (filters: StopFilters, page: number, limit: number) =>
    [...stopKeys.lists(), filters, 'page', page, 'limit', limit] as const,
  byDate: (date: string, filters?: Omit<StopFilters, 'start_time' | 'end_time'>) =>
    [...stopKeys.all, 'byDate', date, filters] as const,
  paginatedByDate: (date: string, page: number, limit: number, filters?: Omit<StopFilters, 'start_time' | 'end_time'>) =>
    [...stopKeys.all, 'byDate', date, 'page', page, 'limit', limit, filters] as const,
  detail: (id: number) => [...stopKeys.all, 'detail', id] as const,
};

/**
 * Hook for fetching stops with filters
 */
export function useStops(
  filters: StopFilters = {},
  options?: Omit<UseQueryOptions<StopRecord[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: stopKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        limit: 1000,
      };

      if (filters.stop_id) params.stop_id = filters.stop_id;
      if (filters.shop) params.shop = filters.shop;
      if (filters.line) params.line = filters.line;
      if (filters.station) params.station = filters.station;
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.start_time) params.start_time = filters.start_time;
      if (filters.end_time) params.end_time = filters.end_time;

      const response = await http.get('/stops', { params });
      return asArrayFromPayload<StopRecord>(response.data);
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Hook for fetching stops for a specific date
 * Optimized for OEE and daily reports
 */
export function useStopsByDate(
  date: string | null,
  additionalFilters: Omit<StopFilters, 'start_time' | 'end_time'> = {},
  options?: Omit<UseQueryOptions<StopRecord[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: stopKeys.byDate(date ?? '', additionalFilters),
    queryFn: async () => {
      if (!date) return [];

      const startOfDay = new Date(date + 'T00:00:00').getTime();
      const endOfDay = new Date(date + 'T23:59:59').getTime();

      const params: Record<string, string | number> = {
        start_time: startOfDay,
        end_time: endOfDay,
        limit: 1000,
      };

      if (additionalFilters.shop) params.shop = additionalFilters.shop;
      if (additionalFilters.line) params.line = additionalFilters.line;
      if (additionalFilters.station) params.station = additionalFilters.station;
      if (additionalFilters.severity) params.severity = additionalFilters.severity;
      if (additionalFilters.status) params.status = additionalFilters.status;
      if (additionalFilters.type) params.type = additionalFilters.type;

      const response = await http.get('/stops', { params });
      return asArrayFromPayload<StopRecord>(response.data);
    },
    enabled: Boolean(date),
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Hook for fetching active stops (status = IN_PROGRESS)
 */
export function useActiveStops(
  options?: Omit<UseQueryOptions<StopRecord[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...stopKeys.all, 'active'],
    queryFn: async () => {
      const params = {
        status: 'IN_PROGRESS',
        limit: 100,
      };

      const response = await http.get('/stops', { params });
      return asArrayFromPayload<StopRecord>(response.data);
    },
    staleTime: 10 * 1000, // Shorter stale time for active stops
    refetchInterval: 30 * 1000, // Auto-refresh every 30s
    ...options,
  });
}

/**
 * Hook for fetching stops with server-side pagination
 */
export function usePaginatedStops(
  filters: StopFilters = {},
  page: number = 1,
  limit: number = 20,
  options?: Omit<UseQueryOptions<PaginatedStopsResult, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: stopKeys.paginated(filters, page, limit),
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        limit,
      };

      if (filters.stop_id) params.stop_id = filters.stop_id;
      if (filters.shop) params.shop = filters.shop;
      if (filters.line) params.line = filters.line;
      if (filters.station) params.station = filters.station;
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.start_time) params.start_time = filters.start_time;
      if (filters.end_time) params.end_time = filters.end_time;

      const response = await http.get<PaginatedResponse<StopRecord>>('/stops', { params });

      // Handle both paginated and array responses
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: {
            page: 1,
            limit: response.data.length,
            total: response.data.length,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }

      return {
        data: response.data.data || [],
        pagination: response.data.pagination,
      };
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Hook for fetching stops for a specific date with server-side pagination
 */
export function usePaginatedStopsByDate(
  date: string | null,
  page: number = 1,
  limit: number = 20,
  additionalFilters: Omit<StopFilters, 'start_time' | 'end_time'> = {},
  options?: Omit<UseQueryOptions<PaginatedStopsResult, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: stopKeys.paginatedByDate(date ?? '', page, limit, additionalFilters),
    queryFn: async () => {
      if (!date) {
        return {
          data: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }

      const startOfDay = new Date(date + 'T00:00:00').getTime();
      const endOfDay = new Date(date + 'T23:59:59').getTime();

      const params: Record<string, string | number> = {
        page,
        limit,
        start_time: startOfDay,
        end_time: endOfDay,
      };

      if (additionalFilters.shop) params.shop = additionalFilters.shop;
      if (additionalFilters.line) params.line = additionalFilters.line;
      if (additionalFilters.station) params.station = additionalFilters.station;
      if (additionalFilters.severity) params.severity = additionalFilters.severity;
      if (additionalFilters.status) params.status = additionalFilters.status;
      if (additionalFilters.type) params.type = additionalFilters.type;

      const response = await http.get<PaginatedResponse<StopRecord>>('/stops', { params });

      // Handle both paginated and array responses
      if (Array.isArray(response.data)) {
        return {
          data: response.data,
          pagination: {
            page: 1,
            limit: response.data.length,
            total: response.data.length,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }

      return {
        data: response.data.data || [],
        pagination: response.data.pagination,
      };
    },
    enabled: Boolean(date),
    staleTime: 30 * 1000,
    ...options,
  });
}
