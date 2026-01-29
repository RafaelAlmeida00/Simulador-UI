'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import http from '@/src/utils/http';
import {
  useSessionStore,
  selectCurrentSessionId,
  selectSessionMetadata,
  selectIsHydrated,
  selectIsSessionValid,
  selectNeedsRecovery,
} from '@/src/stores/sessionStore';
import type { SessionStatus } from '@/src/types/session';

interface UseSessionGuardResult {
  /**
   * True while checking session validity
   */
  validating: boolean;

  /**
   * True if session is valid and dashboard can render
   */
  sessionValid: boolean;

  /**
   * Redirect reason if session is invalid
   */
  redirectReason: string | null;
}

/**
 * Hook to validate session state before rendering the dashboard.
 * Performs both local and server-side validation.
 * Redirects to /sessions if session is missing, deleted, expired, or interrupted.
 *
 * Call this at the top of dashboard layout BEFORE useSessionSocket.
 */
export function useSessionGuard(): UseSessionGuardResult {
  const router = useRouter();

  const currentSessionId = useSessionStore(selectCurrentSessionId);
  const sessionMetadata = useSessionStore(selectSessionMetadata);
  const isHydrated = useSessionStore(selectIsHydrated);
  const isSessionValid = useSessionStore(selectIsSessionValid);
  const needsRecovery = useSessionStore(selectNeedsRecovery);
  const clearSession = useSessionStore((s) => s.clearSession);
  const updateSessionStatus = useSessionStore((s) => s.updateSessionStatus);

  const [validating, setValidating] = React.useState(true);
  const [redirectReason, setRedirectReason] = React.useState<string | null>(null);
  const [serverValidated, setServerValidated] = React.useState(false);

  // Local validation effect
  React.useEffect(() => {
    // Wait for store to hydrate from localStorage
    if (!isHydrated) {
      return;
    }

    // No session selected
    if (!currentSessionId) {
      setRedirectReason('Nenhuma sessao selecionada');
      router.replace('/sessions');
      return;
    }

    // Session needs recovery (interrupted) - based on local state
    if (needsRecovery) {
      setRedirectReason('Sessao interrompida - recuperacao necessaria');
      clearSession();
      router.replace('/sessions');
      return;
    }

    // Session is in an invalid state (expired, stopped) - based on local state
    if (!isSessionValid) {
      const status = sessionMetadata?.status;
      const reasons: Record<SessionStatus, string> = {
        idle: '',
        running: '',
        paused: '',
        stopped: 'Sessao encerrada',
        expired: 'Sessao expirada',
        interrupted: 'Sessao interrompida',
      };
      setRedirectReason(reasons[status as SessionStatus] || 'Sessao invalida');
      clearSession();
      router.replace('/sessions');
      return;
    }

    // Local validation passed, but wait for server validation
  }, [
    isHydrated,
    currentSessionId,
    isSessionValid,
    needsRecovery,
    sessionMetadata?.status,
    clearSession,
    router,
  ]);

  // Server-side validation effect
  React.useEffect(() => {
    // Skip if not hydrated or no session or already server validated
    if (!isHydrated || !currentSessionId || !isSessionValid || serverValidated) {
      return;
    }

    let cancelled = false;

    async function validateSessionOnServer() {
      try {
        const res = await http.get<{
          success: boolean;
          data: {
            id: string;
            status: SessionStatus;
          };
        }>(`/sessions/${currentSessionId}`);

        if (cancelled) return;

        const serverSession = res.data.data;
        const serverStatus = serverSession.status;

        // Check for invalid statuses from server
        if (serverStatus === 'interrupted') {
          setRedirectReason('Sessao interrompida - servidor reiniciado');
          clearSession();
          router.replace('/sessions');
          return;
        }

        if (serverStatus === 'stopped') {
          setRedirectReason('Sessao encerrada');
          clearSession();
          router.replace('/sessions');
          return;
        }

        if (serverStatus === 'expired') {
          setRedirectReason('Sessao expirada');
          clearSession();
          router.replace('/sessions');
          return;
        }

        // Update local status if different from server
        if (sessionMetadata?.status !== serverStatus) {
          updateSessionStatus(serverStatus);
        }

        // Server validation passed
        setServerValidated(true);
        setValidating(false);
        setRedirectReason(null);
      } catch (error: unknown) {
        if (cancelled) return;

        // Session not found (deleted from database)
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          setRedirectReason('Sessao nao encontrada - pode ter sido excluida');
          clearSession();
          router.replace('/sessions');
          return;
        }

        // Session forbidden (not owner)
        if (axiosError.response?.status === 403) {
          setRedirectReason('Acesso negado a esta sessao');
          clearSession();
          router.replace('/sessions');
          return;
        }

        // Other errors - log but allow access (optimistic)
        console.error('[SessionGuard] Server validation error:', error);
        setServerValidated(true);
        setValidating(false);
      }
    }

    validateSessionOnServer();

    return () => {
      cancelled = true;
    };
  }, [
    isHydrated,
    currentSessionId,
    isSessionValid,
    serverValidated,
    sessionMetadata?.status,
    clearSession,
    updateSessionStatus,
    router,
  ]);

  // Listen for status changes (from socket events)
  React.useEffect(() => {
    if (!isHydrated || !sessionMetadata) return;

    const status = sessionMetadata.status;

    // Handle critical status changes that require redirect
    if (status === 'expired' || status === 'stopped') {
      const reasons: Record<string, string> = {
        expired: 'Sessao expirada',
        stopped: 'Sessao encerrada',
      };
      setRedirectReason(reasons[status] || 'Sessao encerrada');
      clearSession();
      router.replace('/sessions');
    } else if (status === 'interrupted') {
      setRedirectReason('Sessao interrompida - servidor reiniciado');
      clearSession();
      router.replace('/sessions');
    }
  }, [isHydrated, sessionMetadata, sessionMetadata?.status, clearSession, router]);

  return {
    validating,
    sessionValid: !validating && isSessionValid && serverValidated,
    redirectReason,
  };
}
