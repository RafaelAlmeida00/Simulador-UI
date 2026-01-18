'use client';

import * as React from 'react';
import { throttle } from 'lodash-es';
import { getSocket } from '@/src/utils/socket';
import { simulatorStore } from '@/src/stores/simulatorStore';
import {
  useSessionStore,
  selectCurrentSessionId,
  selectIsHydrated,
} from '@/src/stores/sessionStore';

/**
 * Throttle configuration for each WebSocket channel.
 * Matches the config in socket.ts for consistency.
 */
const THROTTLE_CONFIG: Record<string, number> = {
  plantstate: 100,
  stops: 500,
  buffers: 500,
  health: 3000,
  cars: 1000,
  oee: 2000,
  mttr_mtbf: 5000,
};

/**
 * Session-scoped channels to subscribe to
 */
const SESSION_CHANNELS = [
  'plantstate',
  'stops',
  'buffers',
  'health',
  'cars',
  'oee',
  'mttr_mtbf',
] as const;

type SessionChannel = (typeof SESSION_CHANNELS)[number];

interface SessionChannelProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that manages session-scoped WebSocket channel subscriptions.
 *
 * Responsibilities:
 * - Subscribes to `session:{sessionId}:{channel}` on mount
 * - Throttles updates per channel (reuses THROTTLE_CONFIG)
 * - Dispatches data to simulatorStore
 * - Cleanup on session change/unmount
 *
 * @example
 * ```tsx
 * <SessionChannelProvider>
 *   {children}
 * </SessionChannelProvider>
 * ```
 */
export function SessionChannelProvider({ children }: SessionChannelProviderProps) {
  const currentSessionId = useSessionStore(selectCurrentSessionId);
  const isHydrated = useSessionStore(selectIsHydrated);
  const prevSessionIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Wait for store hydration
    if (!isHydrated || !currentSessionId) return;

    // Clear data on session change to avoid stale data
    if (prevSessionIdRef.current && prevSessionIdRef.current !== currentSessionId) {
      simulatorStore.reset();
    }
    prevSessionIdRef.current = currentSessionId;

    const socket = getSocket();
    type ThrottledHandler = ReturnType<typeof throttle>;
    const handlers: Record<string, ThrottledHandler> = {};

    // Subscribe to session-scoped channels
    SESSION_CHANNELS.forEach((channel: SessionChannel) => {
      const sessionChannel = `session:${currentSessionId}:${channel}`;
      const throttleMs = THROTTLE_CONFIG[channel] ?? 500;

      // Create throttled handler that dispatches to store
      handlers[channel] = throttle(
        (payload: unknown) => {
          switch (channel) {
            case 'plantstate':
              simulatorStore.setPlantState(
                payload as Parameters<typeof simulatorStore.setPlantState>[0]
              );
              break;
            case 'stops':
              simulatorStore.setStops(
                payload as Parameters<typeof simulatorStore.setStops>[0]
              );
              break;
            case 'buffers':
              simulatorStore.setBuffers(
                payload as Parameters<typeof simulatorStore.setBuffers>[0]
              );
              break;
            case 'health':
              simulatorStore.setHealth(
                payload as Parameters<typeof simulatorStore.setHealth>[0]
              );
              break;
            case 'cars':
              simulatorStore.setCars(
                payload as Parameters<typeof simulatorStore.setCars>[0]
              );
              break;
            case 'oee':
              simulatorStore.setOEE(
                payload as Parameters<typeof simulatorStore.setOEE>[0]
              );
              break;
            case 'mttr_mtbf':
              simulatorStore.setMTTRMTBF(
                payload as Parameters<typeof simulatorStore.setMTTRMTBF>[0]
              );
              break;
          }
        },
        throttleMs,
        { leading: true, trailing: true }
      );

      // Subscribe to the session-scoped channel
      socket.on(sessionChannel, handlers[channel]);
      console.log(`[SessionChannel] Subscribed to ${sessionChannel}`);
    });

    // Cleanup function
    return () => {
      SESSION_CHANNELS.forEach((channel) => {
        const sessionChannel = `session:${currentSessionId}:${channel}`;
        if (handlers[channel]) {
          handlers[channel].cancel();
          socket.off(sessionChannel, handlers[channel]);
          console.log(`[SessionChannel] Unsubscribed from ${sessionChannel}`);
        }
      });
    };
  }, [currentSessionId, isHydrated]);

  return <>{children}</>;
}
