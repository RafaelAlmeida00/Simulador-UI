'use client';

import * as React from 'react';
import { getSocket } from '@/src/utils/socket';
import { useSessionStore, selectCurrentSessionId, selectIsHydrated } from '@/src/stores/sessionStore';
import type { SessionStatusUpdate } from '@/src/types/session';

/**
 * Hook to manage socket connection for the current session.
 * Handles session:join/leave lifecycle and listens to session:status events.
 *
 * Call this in the dashboard layout AFTER useSessionGuard has validated the session.
 */
export function useSessionSocket() {
  const currentSessionId = useSessionStore(selectCurrentSessionId);
  const isHydrated = useSessionStore(selectIsHydrated);
  const setSocketConnected = useSessionStore((s) => s.setSocketConnected);
  const updateSessionStatus = useSessionStore((s) => s.updateSessionStatus);

  // Track previous session ID to handle switches
  const prevSessionIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Wait for store to hydrate from localStorage
    if (!isHydrated) {
      return;
    }

    // No session to join
    if (!currentSessionId) {
      setSocketConnected(false);
      return;
    }

    const socket = getSocket();

    // Handle session switch: leave previous, join new
    if (prevSessionIdRef.current && prevSessionIdRef.current !== currentSessionId) {
      socket.emit('session:leave', prevSessionIdRef.current);
    }

    // Join the current session room
    socket.emit('session:join', currentSessionId);
    setSocketConnected(true);
    prevSessionIdRef.current = currentSessionId;

    // Listen for session status updates from the server
    const handleSessionStatus = (data: SessionStatusUpdate) => {
      if (data.sessionId === currentSessionId) {
        updateSessionStatus(data.status);

        // Log status changes for debugging
        if (data.status === 'expired') {
          console.log('[SessionSocket] Session expired:', data.reason);
        } else if (data.status === 'interrupted') {
          console.log('[SessionSocket] Session interrupted:', data.reason);
        }
      }
    };

    // Handle reconnection
    const handleConnect = () => {
      if (currentSessionId) {
        socket.emit('session:join', currentSessionId);
        setSocketConnected(true);
      }
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on('session:status', handleSessionStatus);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      socket.off('session:status', handleSessionStatus);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);

      // Leave session room on unmount
      if (currentSessionId) {
        socket.emit('session:leave', currentSessionId);
      }
      setSocketConnected(false);
    };
  }, [currentSessionId, isHydrated, setSocketConnected, updateSessionStatus]);
}
