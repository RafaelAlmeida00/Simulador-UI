import {
  useSessionStore,
  selectCurrentSessionId,
  selectIsHydrated,
} from '@/src/stores/sessionStore';

/**
 * Hook to get current session ID for API calls.
 * Returns null if session is not hydrated or no session selected.
 *
 * Usage in query hooks:
 * - Pass to queryKey for cache isolation per session
 * - Pass to API params for session-scoped data
 * - Use in `enabled` option to disable query when no session
 *
 * @example
 * ```typescript
 * const sessionId = useSessionId();
 *
 * return useQuery({
 *   queryKey: ['data', sessionId, filters],
 *   queryFn: async () => {
 *     if (!sessionId) return [];
 *     const res = await http.get('/endpoint', { params: { session_id: sessionId } });
 *     return res.data;
 *   },
 *   enabled: !!sessionId,
 * });
 * ```
 */
export function useSessionId(): string | null {
  const currentSessionId = useSessionStore(selectCurrentSessionId);
  const isHydrated = useSessionStore(selectIsHydrated);

  // Return null until store is hydrated to prevent premature queries
  if (!isHydrated) return null;
  return currentSessionId;
}
