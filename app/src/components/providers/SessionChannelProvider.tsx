'use client';

import * as React from 'react';
import { throttle } from 'lodash-es';
import type { Socket } from 'socket.io-client';
import { getSocket } from '@/src/utils/socket';
import { simulatorStore } from '@/src/stores/simulatorStore';
import {
  useSessionStore,
  selectCurrentSessionId,
  selectIsHydrated,
} from '@/src/stores/sessionStore';
import {
  handleChunkedMessage,
  applyPlantStateDelta,
  applyStopsDelta,
  applyBuffersDelta,
  applyCarsDelta,
  applyOEEDelta,
  applyMTTRMTBFDelta,
  convertCachedToSnapshot,
  resetAllCaches,
} from '@/src/utils/deltaManager';
import type { OptimizedSocketMessage, AckPayload } from '@/src/types/delta';
import type { PlantSnapshot, IStopLine, IBuffer, ICar, OEEDataEmit, MTTRMTBFData } from '@/src/types/socket';

/**
 * Throttle configuration for each WebSocket channel.
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
 * Check if payload is an OptimizedSocketMessage (delta protocol)
 */
function isOptimizedMessage(payload: unknown): payload is OptimizedSocketMessage {
  if (typeof payload !== 'object' || payload === null) return false;
  const msg = payload as Record<string, unknown>;
  return (
    (msg.type === 'FULL' || msg.type === 'DELTA') &&
    typeof msg.channel === 'string' &&
    typeof msg.version === 'number'
  );
}

/**
 * Send ACK for backpressure control
 */
function sendAck(socket: Socket, channel: string, version: number): void {
  const ack: AckPayload = { channel, version };
  socket.emit('ack', ack);
}

/**
 * Request full state when version mismatch occurs
 */
function requestFullState(socket: Socket, channel: string): void {
  console.log(`[SessionChannel] Requesting full state for: ${channel}`);
  socket.emit('requestFull', channel);
}

/**
 * Handle plantstate messages with delta protocol support
 */
function handlePlantStateMessage(socket: Socket, message: OptimizedSocketMessage): void {
  try {
    // Handle chunked messages
    if (message.chunkInfo) {
      const reassembled = handleChunkedMessage(message);
      if (!reassembled) return; // Waiting for more chunks
      message = reassembled;
    }

    const cachedState = applyPlantStateDelta(message as OptimizedSocketMessage<PlantSnapshot>);
    const snapshot = convertCachedToSnapshot(cachedState);
    
    simulatorStore.setPlantState({
      type: 'PLANT_STATE',
      data: snapshot,
      timestamp: snapshot.timestamp,
    });

    if (message.requiresAck) {
      sendAck(socket, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error &&
        (error.message === 'VERSION_MISMATCH' || error.message === 'NO_CACHED_STATE')) {
      requestFullState(socket, message.channel);
    } else {
      console.error('[SessionChannel] Error handling plantstate:', error);
    }
  }
}

/**
 * Handle stops messages with delta protocol support
 */
function handleStopsMessage(socket: Socket, message: OptimizedSocketMessage): void {
  try {
    if (message.chunkInfo) {
      const reassembled = handleChunkedMessage(message);
      if (!reassembled) return;
      message = reassembled;
    }

    const stops = applyStopsDelta(message as OptimizedSocketMessage<IStopLine[]>);
    simulatorStore.setStopsFromDelta(stops);

    if (message.requiresAck) {
      sendAck(socket, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      requestFullState(socket, message.channel);
    } else {
      console.error('[SessionChannel] Error handling stops:', error);
    }
  }
}

/**
 * Handle buffers messages with delta protocol support
 */
function handleBuffersMessage(socket: Socket, message: OptimizedSocketMessage): void {
  try {
    if (message.chunkInfo) {
      const reassembled = handleChunkedMessage(message);
      if (!reassembled) return;
      message = reassembled;
    }

    const buffers = applyBuffersDelta(message as OptimizedSocketMessage<IBuffer[]>);
    simulatorStore.setBuffersFromDelta(buffers);

    if (message.requiresAck) {
      sendAck(socket, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      requestFullState(socket, message.channel);
    } else {
      console.error('[SessionChannel] Error handling buffers:', error);
    }
  }
}

/**
 * Handle cars messages with delta protocol support
 */
function handleCarsMessage(socket: Socket, message: OptimizedSocketMessage): void {
  try {
    if (message.chunkInfo) {
      const reassembled = handleChunkedMessage(message);
      if (!reassembled) return;
      message = reassembled;
    }

    const cars = applyCarsDelta(message as OptimizedSocketMessage<ICar[]>);
    simulatorStore.setCarsFromDelta(cars);

    if (message.requiresAck) {
      sendAck(socket, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      requestFullState(socket, message.channel);
    } else {
      console.error('[SessionChannel] Error handling cars:', error);
    }
  }
}

/**
 * Handle OEE messages with delta protocol support
 */
function handleOEEMessage(socket: Socket, message: OptimizedSocketMessage): void {
  try {
    if (message.chunkInfo) {
      const reassembled = handleChunkedMessage(message);
      if (!reassembled) return;
      message = reassembled;
    }

    const oeeData = applyOEEDelta(message as OptimizedSocketMessage<OEEDataEmit[]>);
    simulatorStore.setOEEFromDelta(oeeData);

    if (message.requiresAck) {
      sendAck(socket, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      requestFullState(socket, message.channel);
    } else {
      console.error('[SessionChannel] Error handling OEE:', error);
    }
  }
}

/**
 * Handle MTTR/MTBF messages with delta protocol support
 */
function handleMTTRMTBFMessage(socket: Socket, message: OptimizedSocketMessage): void {
  try {
    if (message.chunkInfo) {
      const reassembled = handleChunkedMessage(message);
      if (!reassembled) return;
      message = reassembled;
    }

    const mttrMtbfData = applyMTTRMTBFDelta(message as OptimizedSocketMessage<MTTRMTBFData[]>);
    simulatorStore.setMTTRMTBFFromDelta(mttrMtbfData);

    if (message.requiresAck) {
      sendAck(socket, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      requestFullState(socket, message.channel);
    } else {
      console.error('[SessionChannel] Error handling MTTR/MTBF:', error);
    }
  }
}

/**
 * Create a delta-aware handler that supports both legacy and delta protocols
 */
function createDeltaAwareHandler(
  socket: Socket,
  channel: SessionChannel,
  deltaHandler: (socket: Socket, message: OptimizedSocketMessage) => void,
  legacyHandler: (payload: unknown) => void
): (payload: unknown) => void {
  return (payload: unknown) => {
    // Log raw socket data
    console.log(`[Socket:${channel}] RAW PAYLOAD:`, payload);

    if (isOptimizedMessage(payload)) {
      console.log(`[Socket:${channel}] Type: OPTIMIZED (${payload.type}), Version: ${payload.version}`);
      deltaHandler(socket, payload);
    } else {
      // Legacy format - pass directly to store
      console.log(`[Socket:${channel}] Type: LEGACY`);
      legacyHandler(payload);
    }
  };
}

/**
 * Provider that manages session-scoped WebSocket channel subscriptions.
 *
 * Supports both legacy payloads and optimized delta protocol with:
 * - Delta tracking and merging
 * - Chunk reassembly for large payloads
 * - Version mismatch recovery
 * - Backpressure acknowledgment
 */
export function SessionChannelProvider({ children }: SessionChannelProviderProps) {
  const currentSessionId = useSessionStore(selectCurrentSessionId);
  const isHydrated = useSessionStore(selectIsHydrated);
  const prevSessionIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Wait for store hydration
    if (!isHydrated || !currentSessionId) return;

    // Clear data and caches on session change
    if (prevSessionIdRef.current && prevSessionIdRef.current !== currentSessionId) {
      resetAllCaches();
      simulatorStore.reset();
    }
    prevSessionIdRef.current = currentSessionId;

    const socket = getSocket();
    type ThrottledHandler = ReturnType<typeof throttle>;
    const handlers: Record<string, ThrottledHandler> = {};

    // Create delta-aware handlers for each channel
    const deltaHandlers = {
      plantstate: createDeltaAwareHandler(
        socket,
        'plantstate',
        handlePlantStateMessage,
        (p) => simulatorStore.setPlantState(p as Parameters<typeof simulatorStore.setPlantState>[0])
      ),
      stops: createDeltaAwareHandler(
        socket,
        'stops',
        handleStopsMessage,
        (p) => simulatorStore.setStops(p as Parameters<typeof simulatorStore.setStops>[0])
      ),
      buffers: createDeltaAwareHandler(
        socket,
        'buffers',
        handleBuffersMessage,
        (p) => simulatorStore.setBuffers(p as Parameters<typeof simulatorStore.setBuffers>[0])
      ),
      health: (p: unknown) => {
        // Health doesn't use delta protocol
        console.log('[Socket:health] RAW PAYLOAD:', p);
        simulatorStore.setHealth(p as Parameters<typeof simulatorStore.setHealth>[0]);
      },
      cars: createDeltaAwareHandler(
        socket,
        'cars',
        handleCarsMessage,
        (p) => simulatorStore.setCars(p as Parameters<typeof simulatorStore.setCars>[0])
      ),
      oee: createDeltaAwareHandler(
        socket,
        'oee',
        handleOEEMessage,
        (p) => simulatorStore.setOEE(p as Parameters<typeof simulatorStore.setOEE>[0])
      ),
      mttr_mtbf: createDeltaAwareHandler(
        socket,
        'mttr_mtbf',
        handleMTTRMTBFMessage,
        (p) => simulatorStore.setMTTRMTBF(p as Parameters<typeof simulatorStore.setMTTRMTBF>[0])
      ),
    };

    // Subscribe to session-scoped channels
    SESSION_CHANNELS.forEach((channel: SessionChannel) => {
      const sessionChannel = `session:${currentSessionId}:${channel}`;
      const throttleMs = THROTTLE_CONFIG[channel] ?? 500;

      // Create throttled handler
      handlers[channel] = throttle(
        deltaHandlers[channel],
        throttleMs,
        { leading: true, trailing: true }
      );

      // Subscribe to the session-scoped channel
      socket.on(sessionChannel, handlers[channel]);

      // Also subscribe to chunk events
      socket.on(`${sessionChannel}:chunk`, handlers[channel]);

      console.log(`[SessionChannel] Subscribed to ${sessionChannel}`);
    });

    // Request full state for all channels after listeners are set up
    // This ensures we get initial state even if we missed the automatic send
    setTimeout(() => {
      SESSION_CHANNELS.forEach((channel) => {
        socket.emit('requestFull', { sessionId: currentSessionId, channel });
        console.log(`[SessionChannel] Requested full state for ${channel}`);
      });

      // Log the complete store state after channels have loaded
      setTimeout(() => {
        const state = simulatorStore.getSnapshot();
        console.log('[SessionChannel] === SIMULATOR STORE STATE ===');
        console.log('[SessionChannel] Connected:', state.connected);
        console.log('[SessionChannel] Health:', state.health?.data ?? null);
        console.log('[SessionChannel] PlantState:', state.plantState ? 'loaded' : null, state.plantState?.data ? `(${Object.keys(state.plantState.data.shops || {}).length} shops)` : '');
        console.log('[SessionChannel] Buffers:', state.buffersState.length, 'items');
        console.log('[SessionChannel] Stops:', state.stopsState.length, 'items');
        console.log('[SessionChannel] Cars:', Object.keys(state.carsById).length, 'items');
        console.log('[SessionChannel] OEE:', state.oeeState.length, 'items', state.oeeState);
        console.log('[SessionChannel] MTTR/MTBF:', state.mttrMtbfState.length, 'items');
        console.log('[SessionChannel] === END STATE ===');
      }, 2000); // Wait 2s for data to arrive
    }, 100); // Small delay to ensure listeners are fully registered

    // Cleanup function
    return () => {
      SESSION_CHANNELS.forEach((channel) => {
        const sessionChannel = `session:${currentSessionId}:${channel}`;
        if (handlers[channel]) {
          handlers[channel].cancel();
          socket.off(sessionChannel, handlers[channel]);
          socket.off(`${sessionChannel}:chunk`, handlers[channel]);
          console.log(`[SessionChannel] Unsubscribed from ${sessionChannel}`);
        }
      });
    };
  }, [currentSessionId, isHydrated]);

  return <>{children}</>;
}
