'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
 * Redirects to /sessions if session is missing, expired, or interrupted.
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

  const [validating, setValidating] = React.useState(true);
  const [redirectReason, setRedirectReason] = React.useState<string | null>(null);

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

    // Session needs recovery (interrupted)
    if (needsRecovery) {
      setRedirectReason('Sessao interrompida - recuperacao necessaria');
      clearSession();
      router.replace('/sessions');
      return;
    }

    // Session is in an invalid state (expired, stopped)
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

    // Session is valid
    setValidating(false);
    setRedirectReason(null);
  }, [
    isHydrated,
    currentSessionId,
    isSessionValid,
    needsRecovery,
    sessionMetadata?.status,
    clearSession,
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
    sessionValid: !validating && isSessionValid,
    redirectReason,
  };
}
