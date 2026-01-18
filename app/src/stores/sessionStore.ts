'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SessionMetadata, SessionStatus } from '../types/session';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'simulator-session';
const COOKIE_NAME = 'current-session-id';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// ─────────────────────────────────────────────────────────────
// Cookie Helpers (for middleware SSR access)
// ─────────────────────────────────────────────────────────────

function setCookie(value: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface SessionState {
  // Persisted data
  currentSessionId: string | null;
  sessionMetadata: SessionMetadata | null;

  // Runtime state (not persisted)
  socketConnected: boolean;
  isHydrated: boolean;
}

interface SessionActions {
  /**
   * Set the current session and sync to cookie
   */
  setSession: (id: string, metadata: SessionMetadata) => void;

  /**
   * Clear current session and cookie
   */
  clearSession: () => void;

  /**
   * Update session status (from socket events)
   */
  updateSessionStatus: (status: SessionStatus) => void;

  /**
   * Update session metadata (partial update)
   */
  updateSessionMetadata: (partial: Partial<SessionMetadata>) => void;

  /**
   * Set socket connection status
   */
  setSocketConnected: (connected: boolean) => void;

  /**
   * Mark store as hydrated
   */
  setHydrated: () => void;
}

export type SessionStore = SessionState & SessionActions;

// ─────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────

const initialState: SessionState = {
  currentSessionId: null,
  sessionMetadata: null,
  socketConnected: false,
  isHydrated: false,
};

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSession: (id, metadata) => {
        setCookie(id);
        set({
          currentSessionId: id,
          sessionMetadata: metadata,
        });
      },

      clearSession: () => {
        clearCookie();
        set({
          currentSessionId: null,
          sessionMetadata: null,
          socketConnected: false,
        });
      },

      updateSessionStatus: (status) => {
        const current = get().sessionMetadata;
        if (current) {
          set({
            sessionMetadata: { ...current, status },
          });
        }
      },

      updateSessionMetadata: (partial) => {
        const current = get().sessionMetadata;
        if (current) {
          set({
            sessionMetadata: { ...current, ...partial },
          });
        }
      },

      setSocketConnected: (connected) => {
        set({ socketConnected: connected });
      },

      setHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
        sessionMetadata: state.sessionMetadata,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[SessionStore] Failed to rehydrate:', error);
          // Clear corrupted storage
          localStorage.removeItem(STORAGE_KEY);
          clearCookie();
        } else if (state) {
          // Sync cookie on rehydration
          if (state.currentSessionId) {
            setCookie(state.currentSessionId);
          } else {
            clearCookie();
          }
          state.setHydrated();
        }
      },
    }
  )
);

// ─────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────

export const selectCurrentSessionId = (state: SessionStore) => state.currentSessionId;
export const selectSessionMetadata = (state: SessionStore) => state.sessionMetadata;
export const selectSessionStatus = (state: SessionStore) => state.sessionMetadata?.status ?? null;
export const selectSessionName = (state: SessionStore) => state.sessionMetadata?.name ?? null;
export const selectIsHydrated = (state: SessionStore) => state.isHydrated;
export const selectSocketConnected = (state: SessionStore) => state.socketConnected;

/**
 * Check if session is in a valid state for dashboard access
 */
export const selectIsSessionValid = (state: SessionStore) => {
  if (!state.currentSessionId || !state.sessionMetadata) return false;
  const invalidStatuses: SessionStatus[] = ['expired', 'stopped'];
  return !invalidStatuses.includes(state.sessionMetadata.status);
};

/**
 * Check if session needs recovery (interrupted state)
 */
export const selectNeedsRecovery = (state: SessionStore) => {
  return state.sessionMetadata?.status === 'interrupted';
};
