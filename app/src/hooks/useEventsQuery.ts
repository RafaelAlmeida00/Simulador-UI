import { useQuery, useInfiniteQuery, UseQueryOptions } from '@tanstack/react-query';
import http from '@/src/utils/http';
import { asArrayFromPayload } from '@/src/utils/safe';
import type { PaginationInfo } from '@/src/components/data-display/DataTable';
import { useSessionId } from './useSessionId';

/**
 * Event data type from the API
 */
export interface EventRecord {
  id: number;
  car_id: string;
  event_type: string;
  shop: string;
  line: string;
  station: string;
  timestamp: number;
  data?: Record<string, unknown>;
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
 * Result type for paginated events query
 */
export interface PaginatedEventsResult {
  data: EventRecord[];
  pagination: PaginationInfo;
}

/**
 * Filter parameters for events API
 */
export interface EventFilters {
  car_id?: string;
  shop?: string;
  line?: string;
  station?: string;
  event_type?: string;
  start_time?: number;
  end_time?: number;
}

/**
 * Query keys factory for events (session-scoped)
 */
export const eventKeys = {
  all: (sessionId: string | null) => ['events', sessionId] as const,
  lists: (sessionId: string | null) => [...eventKeys.all(sessionId), 'list'] as const,
  list: (sessionId: string | null, filters: EventFilters) =>
    [...eventKeys.lists(sessionId), filters] as const,
  paginated: (sessionId: string | null, filters: EventFilters, page: number) =>
    [...eventKeys.list(sessionId, filters), 'page', page] as const,
  infinite: (sessionId: string | null, filters: EventFilters) =>
    [...eventKeys.list(sessionId, filters), 'infinite'] as const,
  detail: (sessionId: string | null, id: number) =>
    [...eventKeys.all(sessionId), 'detail', id] as const,
};

/**
 * Hook for fetching events with pagination (session-scoped)
 * Optimized for performance with proper cache management
 */
export function useEvents(
  filters: EventFilters = {},
  page: number = 1,
  limit: number = 50,
  options?: Omit<UseQueryOptions<EventRecord[], Error>, 'queryKey' | 'queryFn'>
) {
  const sessionId = useSessionId();

  return useQuery({
    queryKey: eventKeys.paginated(sessionId, filters, page),
    queryFn: async () => {
      if (!sessionId) return [];

      const params: Record<string, string | number> = {
        session_id: sessionId,
        page,
        limit,
      };

      // Add filters to params
      if (filters.car_id) params.car_id = filters.car_id;
      if (filters.shop) params.shop = filters.shop;
      if (filters.line) params.line = filters.line;
      if (filters.station) params.station = filters.station;
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.start_time) params.start_time = filters.start_time;
      if (filters.end_time) params.end_time = filters.end_time;

      const response = await http.get<PaginatedResponse<EventRecord> | EventRecord[]>(
        '/events',
        { params }
      );

      // Handle both paginated and array responses
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return response.data.data || [];
    },
    enabled: !!sessionId && (options?.enabled !== false),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

/**
 * Hook for fetching all events (session-scoped, legacy support)
 * Uses the paginated endpoint but fetches all at once
 */
export function useAllEvents(
  filters: EventFilters = {},
  options?: Omit<UseQueryOptions<EventRecord[], Error>, 'queryKey' | 'queryFn'>
) {
  const sessionId = useSessionId();

  return useQuery({
    queryKey: eventKeys.list(sessionId, filters),
    queryFn: async () => {
      if (!sessionId) return [];

      const params: Record<string, string | number> = {
        session_id: sessionId,
        limit: 1000, // Large limit for all records
      };

      if (filters.car_id) params.car_id = filters.car_id;
      if (filters.shop) params.shop = filters.shop;
      if (filters.line) params.line = filters.line;
      if (filters.station) params.station = filters.station;
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.start_time) params.start_time = filters.start_time;
      if (filters.end_time) params.end_time = filters.end_time;

      const response = await http.get('/events', { params });
      return asArrayFromPayload<EventRecord>(response.data);
    },
    enabled: !!sessionId && (options?.enabled !== false),
    staleTime: 30 * 1000,
    ...options,
  });
}

/**
 * Hook for infinite scrolling events list (session-scoped)
 * Optimal for virtual lists with load-more functionality
 */
export function useInfiniteEvents(filters: EventFilters = {}, limit: number = 50) {
  const sessionId = useSessionId();

  return useInfiniteQuery({
    queryKey: eventKeys.infinite(sessionId, filters),
    queryFn: async ({ pageParam = 1 }) => {
      if (!sessionId) {
        return {
          data: [] as EventRecord[],
          nextPage: undefined,
          hasMore: false,
        };
      }

      const params: Record<string, string | number> = {
        session_id: sessionId,
        page: pageParam,
        limit,
      };

      if (filters.car_id) params.car_id = filters.car_id;
      if (filters.shop) params.shop = filters.shop;
      if (filters.line) params.line = filters.line;
      if (filters.station) params.station = filters.station;
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.start_time) params.start_time = filters.start_time;
      if (filters.end_time) params.end_time = filters.end_time;

      const response = await http.get<PaginatedResponse<EventRecord>>('/events', { params });

      // Handle array response (non-paginated API)
      if (Array.isArray(response.data)) {
        return {
          data: response.data as EventRecord[],
          nextPage: undefined,
          hasMore: false,
        };
      }

      return {
        data: response.data.data,
        nextPage: response.data.pagination.hasNext
          ? response.data.pagination.page + 1
          : undefined,
        hasMore: response.data.pagination.hasNext,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    enabled: !!sessionId,
  });
}

/**
 * Hook for fetching events with server-side pagination (session-scoped)
 * Returns both data and pagination info for use with DataTable
 */
export function usePaginatedEvents(
  filters: EventFilters = {},
  page: number = 1,
  limit: number = 20,
  options?: Omit<UseQueryOptions<PaginatedEventsResult, Error>, 'queryKey' | 'queryFn'>
) {
  const sessionId = useSessionId();

  return useQuery({
    queryKey: eventKeys.paginated(sessionId, filters, page),
    queryFn: async () => {
      if (!sessionId) {
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

      const params: Record<string, string | number> = {
        session_id: sessionId,
        page,
        limit,
      };

      if (filters.car_id) params.car_id = filters.car_id;
      if (filters.shop) params.shop = filters.shop;
      if (filters.line) params.line = filters.line;
      if (filters.station) params.station = filters.station;
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.start_time) params.start_time = filters.start_time;
      if (filters.end_time) params.end_time = filters.end_time;

      const response = await http.get<PaginatedResponse<EventRecord>>('/events', { params });

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
    enabled: !!sessionId && (options?.enabled !== false),
    staleTime: 30 * 1000,
    ...options,
  });
}
