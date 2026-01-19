import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import axios from 'axios';
import http from '@/src/utils/http';
import type {
  Session,
  SessionsResponse,
  CreateSessionPayload,
  SessionControlPayload,
  SessionLimits,
} from '@/src/types/session';
import { decode } from 'next-auth/jwt';

// ─────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────

export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: () => [...sessionKeys.lists()] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
};

// ─────────────────────────────────────────────────────────────
// API Response Types (snake_case from backend)
// ─────────────────────────────────────────────────────────────

interface ApiSession {
  id: string;
  user_id: string;
  name: string | null;
  config_id: string | null;
  config_snapshot: string | null;
  duration_days: number;
  speed_factor: number;
  status: Session['status'];
  started_at: string | number | null;
  expires_at: string | number | null;
  stopped_at: string | number | null;
  simulated_timestamp: number | null;
  current_tick: number;
  last_snapshot_at: string | number | null;
  interrupted_at: string | number | null;
  created_at: string | number;
}

interface ApiSessionsResponse {
  success: boolean;
  data: ApiSession[];
  count: number;
  limits?: SessionLimits;
}

interface ApiSingleSessionResponse {
  success: boolean;
  data: ApiSession;
}

// ─────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────

/**
 * Convert timestamp (number or string) to ISO string
 */
function toISOString(value: string | number | null): string | null {
  if (value === null) return null;
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }
  return value;
}

/**
 * Map API session (snake_case) to frontend Session (camelCase)
 */
function mapApiSession(api: ApiSession): Session {
  return {
    id: api.id,
    name: api.name,
    status: api.status,
    durationDays: api.duration_days,
    speedFactor: api.speed_factor,
    createdAt: toISOString(api.created_at) ?? new Date().toISOString(),
    startedAt: toISOString(api.started_at),
    expiresAt: toISOString(api.expires_at),
    interruptedAt: toISOString(api.interrupted_at),
  };
}

// ─────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all sessions for the current user
 * GET /api/sessions
 */
export function useSessions(
  options?: Omit<UseQueryOptions<SessionsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: async () => {
      const res = await http.get<ApiSessionsResponse>('/sessions');
      const apiResponse = res.data;

      // Map API response to frontend format
      const sessions = (apiResponse.data ?? []).map(mapApiSession);

      // Use limits from API or provide defaults
      const limits: SessionLimits = apiResponse.limits ?? {
        maxPerUser: 2,
        maxGlobal: 20,
        currentUser: sessions.length,
        currentGlobal: sessions.length,
      };

      return { sessions, limits };
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refresh every 30s when page is active
    refetchIntervalInBackground: false,
    ...options,
  });
}

/**
 * Fetch a single session by ID
 * GET /api/sessions/:id
 */
export function useSession(
  sessionId: string | null,
  options?: Omit<UseQueryOptions<Session, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId ?? ''),
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      const res = await http.get<ApiSingleSessionResponse>(`/sessions/${sessionId}`);
      return mapApiSession(res.data.data);
    },
    enabled: !!sessionId,
    staleTime: 5 * 1000, // 5 seconds
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────

/**
 * Create a new session
 * POST /api/sessions
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSessionPayload) => {
      // Transform camelCase to snake_case for backend
      const apiPayload = {
        name: payload.name,
        config_id: payload.configId,
        duration_days: payload.durationDays,
        speed_factor: payload.speedFactor,
        expires_at: payload.expiresAt,
      };
      const res = await http.post<ApiSingleSessionResponse>('/sessions', apiPayload);
      return mapApiSession(res.data.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
    onError: (error) => {
      console.error('[useCreateSession] Error:', error);
    },
  });
}

/**
 * Delete a session
 * DELETE /api/sessions/:id
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await http.delete(`/sessions/${sessionId}`);
      return sessionId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.removeQueries({ queryKey: sessionKeys.detail(deletedId) });
    },
    onError: (error) => {
      console.error('[useDeleteSession] Error:', error);
    },
  });
}

/**
 * Control session (start, pause, resume, stop)
 * POST /api/sessions/:id/start
 * POST /api/sessions/:id/pause
 * POST /api/sessions/:id/resume
 * POST /api/sessions/:id/stop
 */
export function useSessionControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      action,
    }: {
      sessionId: string;
      action: SessionControlPayload['action'];
    }) => {
      // Use separate endpoints per action (backend requirement)
      // Pass empty object to avoid issues with Content-Type: application/json and no body
      const res = await http.post<ApiSingleSessionResponse>(`/sessions/${sessionId}/${action}`, {});
      return mapApiSession(res.data.data);
    },
    onSuccess: (updatedSession) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.setQueryData(sessionKeys.detail(updatedSession.id), updatedSession);
    },
    onError: (error) => {
      console.error('[useSessionControl] Error:', error);
      // Log detailed error information from backend
      if (axios.isAxiosError(error) && error.response) {
        console.error('[useSessionControl] Response status:', error.response.status);
        console.error('[useSessionControl] Response data:', error.response.data);
      }
    },
  });
}

/**
 * Recover an interrupted session
 * POST /api/sessions/:id/recover
 */

// Recebe userId como parâmetro (obtenha via useSession no client)
export function useRecoverSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
      const res = await http.post<ApiSingleSessionResponse>(`/sessions/${sessionId}/recover`, {
        user: { id: userId }
      });
      return mapApiSession(res.data.data);
    },
    onSuccess: (updatedSession) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.setQueryData(sessionKeys.detail(updatedSession.id), updatedSession);
    },
    onError: (error) => {
      console.error('[useRecoverSession] Error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[useRecoverSession] Response data:', error.response.data);
      }
    },
  });
}

/**
 * Discard an interrupted session (mark as stopped)
 * POST /api/sessions/:id/discard
 */
export function useDiscardSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await http.post<ApiSingleSessionResponse>(`/sessions/${sessionId}/discard`, {});
      return mapApiSession(res.data.data);
    },
    onSuccess: (updatedSession) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.setQueryData(sessionKeys.detail(updatedSession.id), updatedSession);
    },
    onError: (error) => {
      console.error('[useDiscardSession] Error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[useDiscardSession] Response data:', error.response.data);
      }
    },
  });
}
