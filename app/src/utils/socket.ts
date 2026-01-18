// util/socket.ts
import { io, Socket } from 'socket.io-client';
import customParser from 'socket.io-msgpack-parser';
import { throttle, DebouncedFunc } from 'lodash-es';
import { simulatorStore } from '../stores/simulatorStore';
import { getRuntimeEnv } from './runtimeEnv';
import { getAuthToken, getCsrfToken, refreshAuthToken } from './authTokens';
import type { OptimizedSocketMessage, AckPayload } from '../types/delta';
import type { PlantSnapshot, IStopLine, IBuffer, ICar, OEEDataEmit, MTTRMTBFData } from '../types/socket';
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
  getCacheVersions,
} from './deltaManager';

let socket: Socket | null = null;

// Events channel removed - now API-only
const DEFAULT_CHANNELS = ['plantstate', 'stops', 'buffers', 'health', 'cars', 'oee', 'mttr_mtbf'] as const;

// Track subscribed rooms
const subscribedRooms = new Set<string>();

// Simulator control types
export type SimulatorAction = 'start' | 'pause' | 'restart' | 'stop';

export interface ControlSimulatorResponse {
  success: boolean;
  action: SimulatorAction;
  status: 'running' | 'stopped' | 'paused' | 'unknown';
  error?: string;
}

/**
 * Throttle configuration for each WebSocket channel.
 * Optimized based on data update frequency and UI requirements.
 *
 * - plantstate: 100ms - Critical real-time updates (station occupancy)
 * - stops: 500ms - Stop events change moderately
 * - buffers: 500ms - Buffer state updates moderately
 * - health: 3000ms - Health polling doesn't need to be fast
 * - cars: 1000ms - Car state can be slower (large payload)
 * - oee: 2000ms - Aggregated metrics, less frequent
 * - mttr_mtbf: 5000ms - Calculated at shift end only
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

// Store for throttled handlers (for cleanup on disconnect)
type ThrottledHandler = DebouncedFunc<(payload: unknown) => void>;
const throttledHandlers: Map<string, ThrottledHandler> = new Map();

/**
 * Creates a throttled handler for a given channel.
 * Uses lodash throttle with leading+trailing for immediate response and final state.
 */
function createThrottledHandler(
  channel: string,
  setter: (payload: unknown) => void
): ThrottledHandler {
  const delay = THROTTLE_CONFIG[channel] ?? 500;
  return throttle(setter, delay, { leading: true, trailing: true });
}

function ensureDefaultSubscriptions(s: Socket) {
  for (const ch of DEFAULT_CHANNELS) {
    s.emit('subscribe', ch);
    subscribedRooms.add(ch);
  }
}

export type CommandPayload = {
  type: 'start' | 'pause' | 'reset' | 'custom' | string;
  payload?: Record<string, unknown>;
};

/**
 * Checks if a payload is an OptimizedSocketMessage (delta protocol)
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
 * Sends ACK for backpressure control
 */
function sendAck(s: Socket, channel: string, version: number): void {
  const ack: AckPayload = { channel, version };
  s.emit('ack', ack);
}

/**
 * Requests full state when version mismatch occurs
 */
function requestFullState(s: Socket, channel: string): void {
  console.log(`[socket] Requesting full state for channel: ${channel}`);
  s.emit('requestFull', channel);
}

/**
 * Handles delta protocol messages for plantstate channel
 */
function handlePlantStateMessage(s: Socket, message: OptimizedSocketMessage): void {
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
      sendAck(s, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      requestFullState(s, message.channel);
    } else if (error instanceof Error && error.message === 'NO_CACHED_STATE') {
      requestFullState(s, message.channel);
    } else {
      console.error('[socket] Error handling plantstate message:', error);
    }
  }
}

/**
 * Handles delta protocol messages for stops channel
 */
function handleStopsMessage(s: Socket, message: OptimizedSocketMessage): void {
  try {
    if (message.chunkInfo) {
      const reassembled = handleChunkedMessage(message);
      if (!reassembled) return;
      message = reassembled;
    }

    const stops = applyStopsDelta(message as OptimizedSocketMessage<IStopLine[]>);

    simulatorStore.setStopsFromDelta(stops);

    if (message.requiresAck) {
      sendAck(s, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      requestFullState(s, message.channel);
    } else {
      console.error('[socket] Error handling stops message:', error);
    }
  }
}

/**
 * Handles delta protocol messages for buffers channel
 */
function handleBuffersMessage(s: Socket, message: OptimizedSocketMessage): void {
  try {
    if (message.chunkInfo) {
      const reassembled = handleChunkedMessage(message);
      if (!reassembled) return;
      message = reassembled;
    }

    const buffers = applyBuffersDelta(message as OptimizedSocketMessage<IBuffer[]>);

    simulatorStore.setBuffersFromDelta(buffers);

    if (message.requiresAck) {
      sendAck(s, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      requestFullState(s, message.channel);
    } else {
      console.error('[socket] Error handling buffers message:', error);
    }
  }
}

/**
 * Handles delta protocol messages for cars channel
 */
function handleCarsMessage(s: Socket, message: OptimizedSocketMessage): void {
  try {
    if (message.chunkInfo) {
      const reassembled = handleChunkedMessage(message);
      if (!reassembled) return;
      message = reassembled;
    }

    const cars = applyCarsDelta(message as OptimizedSocketMessage<ICar[]>);

    simulatorStore.setCarsFromDelta(cars);

    if (message.requiresAck) {
      sendAck(s, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      requestFullState(s, message.channel);
    } else {
      console.error('[socket] Error handling cars message:', error);
    }
  }
}

/**
 * Handles delta protocol messages for OEE channel
 */
function handleOEEMessage(s: Socket, message: OptimizedSocketMessage): void {
  try {
    if (message.chunkInfo) {
      const reassembled = handleChunkedMessage(message);
      if (!reassembled) return;
      message = reassembled;
    }

    const oeeData = applyOEEDelta(message as OptimizedSocketMessage<OEEDataEmit[]>);

    simulatorStore.setOEEFromDelta(oeeData);

    if (message.requiresAck) {
      sendAck(s, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      requestFullState(s, message.channel);
    } else {
      console.error('[socket] Error handling OEE message:', error);
    }
  }
}

/**
 * Handles delta protocol messages for MTTR/MTBF channel
 */
function handleMTTRMTBFMessage(s: Socket, message: OptimizedSocketMessage): void {
  try {
    if (message.chunkInfo) {
      const reassembled = handleChunkedMessage(message);
      if (!reassembled) return;
      message = reassembled;
    }

    const mttrMtbfData = applyMTTRMTBFDelta(message as OptimizedSocketMessage<MTTRMTBFData[]>);

    simulatorStore.setMTTRMTBFFromDelta(mttrMtbfData);

    if (message.requiresAck) {
      sendAck(s, message.channel, message.version);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'VERSION_MISMATCH') {
      requestFullState(s, message.channel);
    } else {
      console.error('[socket] Error handling MTTR/MTBF message:', error);
    }
  }
}

/**
 * Creates a message handler that supports both legacy and delta protocols
 */
function createDeltaAwareHandler(
  channel: string,
  deltaHandler: (s: Socket, message: OptimizedSocketMessage) => void,
  legacyHandler: (payload: unknown) => void
): (payload: unknown) => void {
  return (payload: unknown) => {
    const s = socket;
    if (!s) return;

    if (isOptimizedMessage(payload)) {
      deltaHandler(s, payload);
    } else {
      // Legacy format - pass directly to store
      legacyHandler(payload);
    }
  };
}


function createSocket(): Socket {
  const { socketUrl } = getRuntimeEnv();

  const s = io(socketUrl || undefined, {
    transports: ['websocket'],
    path: '/socket.io',
    parser: customParser,
    // Auth function is called on each connection/reconnection
    auth: async (cb) => {
      try {
        const [token, csrfToken] = await Promise.all([
          getAuthToken(),
          getCsrfToken(),
        ]);
        cb({
          token: token || undefined,
          csrfToken: csrfToken || undefined,
        });
      } catch {
        cb({});
      }
    },
    // Also send as extraHeaders for middleware validation
    extraHeaders: {},
  });



  // Create delta-aware handlers for all channels
  const handlers = {
    plantstate: createThrottledHandler(
      'plantstate',
      createDeltaAwareHandler(
        'plantstate',
        handlePlantStateMessage,
        (p) => simulatorStore.setPlantState(p as Parameters<typeof simulatorStore.setPlantState>[0])
      )
    ),
    stops: createThrottledHandler(
      'stops',
      createDeltaAwareHandler(
        'stops',
        handleStopsMessage,
        (p) => simulatorStore.setStops(p as Parameters<typeof simulatorStore.setStops>[0])
      )
    ),
    buffers: createThrottledHandler(
      'buffers',
      createDeltaAwareHandler(
        'buffers',
        handleBuffersMessage,
        (p) => simulatorStore.setBuffers(p as Parameters<typeof simulatorStore.setBuffers>[0])
      )
    ),
    health: createThrottledHandler('health', (p) => {
      // Health doesn't use delta protocol
      simulatorStore.setHealth(p as Parameters<typeof simulatorStore.setHealth>[0]);
    }),
    cars: createThrottledHandler(
      'cars',
      createDeltaAwareHandler(
        'cars',
        handleCarsMessage,
        (p) => simulatorStore.setCars(p as Parameters<typeof simulatorStore.setCars>[0])
      )
    ),
    oee: createThrottledHandler(
      'oee',
      createDeltaAwareHandler(
        'oee',
        handleOEEMessage,
        (p) => simulatorStore.setOEE(p as Parameters<typeof simulatorStore.setOEE>[0])
      )
    ),
    mttr_mtbf: createThrottledHandler(
      'mttr_mtbf',
      createDeltaAwareHandler(
        'mttr_mtbf',
        handleMTTRMTBFMessage,
        (p) => simulatorStore.setMTTRMTBF(p as Parameters<typeof simulatorStore.setMTTRMTBF>[0])
      )
    ),
  };

  // Store handlers for potential cleanup
  Object.entries(handlers).forEach(([channel, handler]) => {
    throttledHandlers.set(channel, handler);
  });

  // ====== EVENTOS DE CONEXÃO ======
  s.on('connect', () => {
    simulatorStore.setConnected(true);
    // Reset caches on reconnect to ensure fresh state
    resetAllCaches();
    ensureDefaultSubscriptions(s);
  });

  s.on('connect_error', (error) => {
    // Check if error is due to expired token
    const errorMsg = error?.message || '';
    if (errorMsg.includes('expirado') || errorMsg.includes('expired')) {
      console.log('[socket] Token expired, refreshing and reconnecting');
      refreshAuthToken().then(() => {
        // Retry connection after token refresh
        setTimeout(() => s.connect(), 1000);
      });
    }
  });

  s.io.on('reconnect_attempt', () => {
  });

  s.io.on('reconnect', () => {
  });

  s.io.on('reconnect_error', () => {
  });

  s.io.on('reconnect_failed', () => {
  });

  s.on('disconnect', () => {
    simulatorStore.setConnected(false);

    // Cancel pending throttled updates on disconnect
    throttledHandlers.forEach((handler) => handler.cancel());

    // Reset caches on disconnect
    resetAllCaches();

    // Clear subscribed rooms on disconnect
    subscribedRooms.clear();
  });


  // Handle chunk events for large payloads
  s.on('plantstate:chunk', handlers.plantstate);
  s.on('stops:chunk', handlers.stops);
  s.on('buffers:chunk', handlers.buffers);
  s.on('cars:chunk', handlers.cars);
  s.on('oee:chunk', handlers.oee);
  s.on('mttr_mtbf:chunk', handlers.mttr_mtbf);

  // Register all channel handlers with throttling
  s.on('plantstate', handlers.plantstate);
  s.on('stops', handlers.stops);
  s.on('buffers', handlers.buffers);
  s.on('health', handlers.health);
  s.on('cars', handlers.cars);
  s.on('oee', handlers.oee);
  s.on('mttr_mtbf', handlers.mttr_mtbf);

  return s;
}

export function getSocket(): Socket {
  if (!socket) socket = createSocket();
  return socket;
}

// Force reconnection and resubscription without page reload
export function reconnectSocket(): Socket {
  const s = getSocket();

  if (!s.connected) {
    try {
      s.connect();
    } catch {
      // ignore
    }
  }

  ensureDefaultSubscriptions(s);
  return s;
}

// Helper to subscribe dynamically
export function subscribeTo(...channels: string[]) {
  const s = getSocket();
  channels.forEach(ch => {
    s.emit('subscribe', ch);
    subscribedRooms.add(ch);
  });
}

// Helper to unsubscribe from channels
export function unsubscribeFrom(...channels: string[]) {
  const s = getSocket();
  channels.forEach(ch => {
    s.emit('unsubscribe', ch);
    subscribedRooms.delete(ch);
  });
}

// Get list of subscribed rooms
export function getSubscribedRooms(): string[] {
  return Array.from(subscribedRooms);
}

// Get count of subscribed rooms
export function getSubscribedRoomsCount(): number {
  return subscribedRooms.size;
}

// Send simulator control command
export function sendSimulatorControl(
  action: SimulatorAction,
  onResponse?: (response: ControlSimulatorResponse) => void
): void {
  const s = getSocket();
  s.emit('controlSimulator', { action });

  if (onResponse) {
    s.once('controlSimulator', onResponse);
  }
}

// Request full state for a specific channel
export function requestFullStateForChannel(channel: string): void {
  const s = getSocket();
  requestFullState(s, channel);
}

// Get current cache versions for debugging
export function getSocketCacheVersions(): Record<string, number> {
  return getCacheVersions();
}
