// util/socket.ts
import { io, Socket } from 'socket.io-client';
import { throttle } from 'lodash-es';
import { simulatorStore } from '../stores/simulatorStore';
import { getRuntimeEnv } from './runtimeEnv';

let socket: Socket | null = null;

// Events channel removed - now API-only
const DEFAULT_CHANNELS = ['plantstate', 'stops', 'buffers', 'health', 'cars', 'oee', 'mttr_mtbf'] as const;

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

  // Throttle plantstate updates to 100ms to reduce re-renders
  const throttledPlantStateUpdate = throttle((payload) => {
    simulatorStore.setPlantState(payload);
  }, 100, { leading: true, trailing: true });

  s.on('connect', () => {
    simulatorStore.setConnected(true);
    console.log('[socket] connected', { id: s.id });
    ensureDefaultSubscriptions(s);
  });

  s.on('disconnect', (reason) => {
    simulatorStore.setConnected(false);
    console.log('[socket] disconnected', reason);
  });

  // Plant state channel with throttling
  s.on('plantstate', throttledPlantStateUpdate);

  // Stops channel
  s.on('stops', (payload) => {
    simulatorStore.setStops(payload);
  });

  // Buffers channel
  s.on('buffers', (payload) => {
    simulatorStore.setBuffers(payload);
  });

  // Health channel
  s.on('health', (payload) => {
    simulatorStore.setHealth(payload);
  });

  // Cars channel
  s.on('cars', (payload) => {
    simulatorStore.setCars(payload);
  });

  // OEE channel
  s.on('oee', (payload) => {
    simulatorStore.setOEE(payload);
  });

  // MTTR/MTBF channel
  s.on('mttr_mtbf', (payload) => {
    simulatorStore.setMTTRMTBF(payload);
  });

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
