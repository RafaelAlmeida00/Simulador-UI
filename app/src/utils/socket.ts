// util/socket.ts
import { io, Socket } from 'socket.io-client';
import { throttle, DebouncedFunc } from 'lodash-es';
import { simulatorStore } from '../stores/simulatorStore';
import { getRuntimeEnv } from './runtimeEnv';

let socket: Socket | null = null;

// Events channel removed - now API-only
const DEFAULT_CHANNELS = ['plantstate', 'stops', 'buffers', 'health', 'cars', 'oee', 'mttr_mtbf'] as const;

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
  }
}

export type CommandPayload = {
  type: 'start' | 'pause' | 'reset' | 'custom' | string;
  payload?: Record<string, unknown>;
};

function createSocket(): Socket {
  const { socketUrl } = getRuntimeEnv();
  const s = io(socketUrl || undefined, {
    transports: ['websocket'],
    path: '/socket.io'
  });

  // Create throttled handlers for all channels
  // Type casting is safe here as socket.io events are typed by the server
  const handlers = {
    plantstate: createThrottledHandler('plantstate', (p) => simulatorStore.setPlantState(p as Parameters<typeof simulatorStore.setPlantState>[0])),
    stops: createThrottledHandler('stops', (p) => simulatorStore.setStops(p as Parameters<typeof simulatorStore.setStops>[0])),
    buffers: createThrottledHandler('buffers', (p) => simulatorStore.setBuffers(p as Parameters<typeof simulatorStore.setBuffers>[0])),
    health: createThrottledHandler('health', (p) => simulatorStore.setHealth(p as Parameters<typeof simulatorStore.setHealth>[0])),
    cars: createThrottledHandler('cars', (p) => simulatorStore.setCars(p as Parameters<typeof simulatorStore.setCars>[0])),
    oee: createThrottledHandler('oee', (p) => simulatorStore.setOEE(p as Parameters<typeof simulatorStore.setOEE>[0])),
    mttr_mtbf: createThrottledHandler('mttr_mtbf', (p) => simulatorStore.setMTTRMTBF(p as Parameters<typeof simulatorStore.setMTTRMTBF>[0])),
  };

  // Store handlers for potential cleanup
  Object.entries(handlers).forEach(([channel, handler]) => {
    throttledHandlers.set(channel, handler);
  });

  s.on('connect', () => {
    simulatorStore.setConnected(true);
    console.log('[socket] connected', { id: s.id });
    ensureDefaultSubscriptions(s);
  });

  s.on('disconnect', (reason) => {
    simulatorStore.setConnected(false);
    console.log('[socket] disconnected', reason);

    // Cancel pending throttled updates on disconnect
    throttledHandlers.forEach((handler) => handler.cancel());
  });

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
  channels.forEach(ch => s.emit('subscribe', ch));
}

// Helper to unsubscribe from channels
export function unsubscribeFrom(...channels: string[]) {
  const s = getSocket();
  channels.forEach(ch => s.emit('unsubscribe', ch));
}
