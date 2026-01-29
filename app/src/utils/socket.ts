// util/socket.ts
// Base socket connection - channel handlers are now in SessionChannelProvider
import { io, Socket } from 'socket.io-client';
import customParser from 'socket.io-msgpack-parser';
import { simulatorStore } from '../stores/simulatorStore';
import { getRuntimeEnv } from './runtimeEnv';
import { getAuthToken, getCsrfToken, refreshAuthToken } from './authTokens';
import { resetAllCaches } from './deltaManager';

let socket: Socket | null = null;

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

export type CommandPayload = {
  type: 'start' | 'pause' | 'reset' | 'custom' | string;
  payload?: Record<string, unknown>;
};

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
    extraHeaders: {},
  });

  // ====== CONNECTION EVENTS ======
  s.on('connect', () => {
    simulatorStore.setConnected(true);
    // Reset caches on reconnect to ensure fresh state
    resetAllCaches();
    console.log('[socket] Connected');
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
    console.log('[socket] Reconnect attempt');
  });

  s.io.on('reconnect', () => {
    console.log('[socket] Reconnected');
  });

  s.io.on('reconnect_error', () => {
    console.log('[socket] Reconnect error');
  });

  s.io.on('reconnect_failed', () => {
    console.log('[socket] Reconnect failed');
  });

  s.on('disconnect', () => {
    simulatorStore.setConnected(false);
    // Reset caches on disconnect
    resetAllCaches();
    // Clear subscribed rooms on disconnect
    subscribedRooms.clear();
    console.log('[socket] Disconnected');
  });

  return s;
}

export function getSocket(): Socket {
  if (!socket) socket = createSocket();
  return socket;
}

// Force reconnection without page reload
export function reconnectSocket(): Socket {
  const s = getSocket();

  if (!s.connected) {
    try {
      s.connect();
    } catch {
      // ignore
    }
  }

  return s;
}

// Helper to subscribe dynamically to a channel
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
  console.log(`[socket] Requesting full state for channel: ${channel}`);
  s.emit('requestFull', channel);
}
