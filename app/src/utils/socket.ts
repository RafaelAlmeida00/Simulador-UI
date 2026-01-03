// util/socket.ts (exemplo)
import { io, Socket } from 'socket.io-client';
import { simulatorStore } from '../stores/simulatorStore';
import { getRuntimeEnv } from './runtimeEnv';

let socket: Socket | null = null;

const DEFAULT_CHANNELS = ['plantstate', 'events', 'stops', 'buffers', 'health', 'cars', 'oee'] as const;

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
    path: '/socket.io' // opcional se você usa padrão
  });

  s.on('connect', () => {
    simulatorStore.setConnected(true);
    console.log('[socket] connected', { id: s.id });
    // inscreve assim que conectar
    ensureDefaultSubscriptions(s);
  });

  s.on('disconnect', (reason) => {
    simulatorStore.setConnected(false);
    console.log('[socket] disconnected', reason);
  });

  // Escutar os nomes que o servidor realmente emite
  s.on('plantstate', (payload) => {
    simulatorStore.setPlantState(payload);
  });
  s.on('events', (payload) => {
    simulatorStore.setEvents(payload);
  });
  // alias legacy (websocketdata.yaml: emits também 'car_event')
  s.on('car_event', (payload) => {
    simulatorStore.setEvents(payload);
  });
  s.on('stops', (payload) => {
    simulatorStore.setStops(payload);
  });
  s.on('buffers', (payload) => {
    simulatorStore.setBuffers(payload);
  });
  s.on('health', (payload) => {
    simulatorStore.setHealth(payload);
  });
  s.on('cars', (payload) => {
    simulatorStore.setCars(payload);
  });
   s.on('oee', (payload) => {        
    simulatorStore.setOEE(payload);
  });
  return s;
}

export function getSocket(): Socket {
  if (!socket) socket = createSocket();
  return socket;
}

// Força reconexão e reinscrição sem dar reload na página.
// Útil quando o socket foi desconectado manualmente ou perdeu as subscriptions.
export function reconnectSocket(): Socket {
  const s = getSocket();

  // Se alguém chamou disconnect() em algum ponto, precisamos re-habilitar o connect.
  if (!s.connected) {
    try {
      s.connect();
    } catch {
      // ignore
    }
  }

  // Reinscreve de forma idempotente (server-side pode ignorar duplicados).
  ensureDefaultSubscriptions(s);
  return s;
}

// helper para inscrever dinamicamente
export function subscribeTo(...channels: string[]) {
  const s = getSocket();
  channels.forEach(ch => s.emit('subscribe', ch));
}