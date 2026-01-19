import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import http from '@/src/utils/http';
import { asArrayFromPayload } from '@/src/utils/safe';
import { useSessionId } from './useSessionId';

/**
 * OEE data type from the API
 */
export interface OEERecord {
  id?: number;
  date: string;
  shop: string;
  line: string;
  production_time?: number;
  productionTime?: number;
  cars_production?: number;
  carsProduction?: number;
  takt_time?: number;
  taktTime?: number;
  diff_time?: number;
  diffTime?: number;
  oee: number;
  jph?: number;
  created_at?: number;
}

/**
 * Filter parameters for OEE API
 */
export interface OEEFilters {
  date?: string;
  shop?: string;
  line?: string;
  start_time?: number;
  end_time?: number;
}

/**
 * Query keys factory for OEE (session-scoped)
 */
export const oeeKeys = {
  all: (sessionId: string | null) => ['oee', sessionId] as const,
  lists: (sessionId: string | null) => [...oeeKeys.all(sessionId), 'list'] as const,
  list: (sessionId: string | null, filters: OEEFilters) =>
    [...oeeKeys.lists(sessionId), filters] as const,
  byDate: (sessionId: string | null, date: string) =>
    [...oeeKeys.all(sessionId), 'byDate', date] as const,
  historical: (sessionId: string | null, days: number, baseDate?: string) =>
    [...oeeKeys.all(sessionId), 'historical', days, baseDate] as const,
  detail: (sessionId: string | null, id: number) =>
    [...oeeKeys.all(sessionId), 'detail', id] as const,
};

/**
 * Normalize OEE record to consistent field names
 */
export function normalizeOEERecord(record: OEERecord): OEERecord & {
  normalizedProductionTime: number;
  normalizedCarsProduction: number;
  normalizedTaktTime: number;
  normalizedDiffTime: number;
} {
  return {
    ...record,
    normalizedProductionTime: record.productionTime ?? record.production_time ?? 0,
    normalizedCarsProduction: record.carsProduction ?? record.cars_production ?? 0,
    normalizedTaktTime: record.taktTime ?? record.takt_time ?? 0,
    normalizedDiffTime: record.diffTime ?? record.diff_time ?? 0,
  };
}

/**
 * Hook for fetching OEE data with filters (session-scoped)
 */
export function useOEE(
  filters: OEEFilters = {},
  options?: Omit<UseQueryOptions<OEERecord[], Error>, 'queryKey' | 'queryFn'>
) {
  const sessionId = useSessionId();

  return useQuery({
    queryKey: oeeKeys.list(sessionId, filters),
    queryFn: async () => {
      if (!sessionId) return [];

      const params: Record<string, string | number> = {
        session_id: sessionId,
        limit: 1000,
      };

      if (filters.date) params.date = filters.date;
      if (filters.shop) params.shop = filters.shop;
      if (filters.line) params.line = filters.line;
      if (filters.start_time) params.start_time = filters.start_time;
      if (filters.end_time) params.end_time = filters.end_time;

      const response = await http.get('/oee', { params });
      return asArrayFromPayload<OEERecord>(response.data);
    },
    enabled: !!sessionId && (options?.enabled !== false),
    staleTime: 60 * 1000, // OEE data is stable, 1 minute stale time
    ...options,
  });
}

/**
 * Hook for fetching OEE data for a specific date (session-scoped)
 */
export function useOEEByDate(
  date: string | null,
  options?: Omit<UseQueryOptions<OEERecord[], Error>, 'queryKey' | 'queryFn'>
) {
  const sessionId = useSessionId();

  return useQuery({
    queryKey: oeeKeys.byDate(sessionId, date ?? ''),
    queryFn: async () => {
      if (!sessionId || !date) return [];

      const response = await http.get('/oee', {
        params: {
          session_id: sessionId,
          date,
        },
      });
      return asArrayFromPayload<OEERecord>(response.data);
    },
    enabled: !!sessionId && Boolean(date) && (options?.enabled !== false),
    staleTime: 60 * 1000,
    ...options,
  });
}

/**
 * Hook for fetching historical OEE data (session-scoped, last N days)
 */
export function useOEEHistorical(
  days: number = 7,
  baseDate?: number, // Base date as epoch ms
  options?: Omit<UseQueryOptions<OEERecord[], Error>, 'queryKey' | 'queryFn'>
) {
  const sessionId = useSessionId();

  const baseDateStr = baseDate
    ? new Date(baseDate).toISOString().slice(0, 10)
    : undefined;

  return useQuery({
    queryKey: oeeKeys.historical(sessionId, days, baseDateStr),
    queryFn: async () => {
      if (!sessionId) return [];

      const now = baseDate ?? Date.now();
      const dates: string[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }

      // Fetch data for date range
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];

      const response = await http.get('/oee', {
        params: {
          session_id: sessionId,
          start_time: startDate,
          end_time: endDate,
          limit: 1000,
        },
      });

      return asArrayFromPayload<OEERecord>(response.data);
    },
    enabled: !!sessionId && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // Historical data is very stable, 5 min stale time
    ...options,
  });
}

/**
 * Calculate OEE metrics from records
 */
export function calculateOEEMetrics(records: OEERecord[]) {
  if (records.length === 0) {
    return {
      avgOee: 0,
      avgJph: 0,
      totalCarsProduced: 0,
      avgDiffTime: 0,
    };
  }

  const normalized = records.map(normalizeOEERecord);

  const avgOee = normalized.reduce((sum, r) => sum + r.oee, 0) / normalized.length;
  const avgJph =
    normalized.reduce((sum, r) => sum + (r.jph ?? 0), 0) / normalized.length;
  const totalCarsProduced = normalized.reduce(
    (sum, r) => sum + r.normalizedCarsProduction,
    0
  );
  const avgDiffTime =
    normalized.reduce((sum, r) => sum + r.normalizedDiffTime, 0) / normalized.length;

  return {
    avgOee,
    avgJph,
    totalCarsProduced,
    avgDiffTime,
  };
}

/**
 * Filter OEE records by shop and line
 */
export function filterOEEByLocation(
  records: OEERecord[],
  shop?: string,
  line?: string
): OEERecord[] {
  return records.filter((r) => {
    if (shop && r.shop !== shop) return false;
    if (line && r.line !== line && r.line !== `${shop}-${line}`) return false;
    return true;
  });
}
