export type SocketEnvelope<TType extends string, TData> = {
  type: TType;
  data: TData;
  timestamp?: number;
};

export type HealthData = {
  serverStatus?: 'healthy' | 'unhealthy' | string;
  simulatorStatus?: 'running' | 'stopped' | 'paused' | string;
  timestamp?: number;
  simulator?: unknown;
  simulatorTimestamp?: number;
  simulatorTimeString?: string;
  uptime?: number;
};

export type HealthPayload = SocketEnvelope<'HEALTH', HealthData>;

export type BufferStatus = 'EMPTY' | 'AVAILABLE' | 'FULL' | string;
export type BufferType = 'BUFFER' | 'REWORK_BUFFER' | 'PART_BUFFER' | string;

export type BufferItem = {
  id: string;
  betweenShopOrLine?: string;
  from?: string;
  to?: string;
  capacity?: number;
  currentCount?: number;
  status?: BufferStatus;
  type?: BufferType;
  carIds?: string[];
};

export type BuffersPayload = SocketEnvelope<'BUFFERS_STATE' | 'BUFFER_EVENT' | string, BufferItem[] | unknown>;

export type StopSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'PLANNED' | null | string;
export type StopStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | string;

export type Stop = {
  id?: number;
  shop?: string;
  line?: string;
  station?: string;
  reason?: string;
  severity?: StopSeverity;
  type?: string;
  category?: string;
  startTime?: number;
  endTime?: number;
  status?: StopStatus;
  durationMs?: number;
};

export type StopsEventPayload = SocketEnvelope<
  'STOP_EVENT' | 'STOPS_STATE' | string,
  { action?: 'STARTED' | 'ENDED' | 'UPDATED' | string; stop?: Stop } | Stop[] | unknown
>;

export type Car = Record<string, unknown> & {
  id: string;
};

export type CarsPayload = SocketEnvelope<'CARS_STATE' | string, Car[] | unknown>;

export type PlantStatePayload = SocketEnvelope<'PLANT_STATE' | string, unknown>;
export type OEEPayload = SocketEnvelope<'OEE' | string, unknown>;


export type CarEventType =
  | 'CREATED'
  | 'MOVED'
  | 'COMPLETED'
  | 'REWORK_IN'
  | 'REWORK_OUT'
  | 'BUFFER_IN'
  | 'BUFFER_OUT'
  | string;

export type CarEventData = {
  carId: string;
  eventType: CarEventType;
  shop: string;
  line: string;
  station: string;
  timestamp: number;
  data?: Record<string, unknown>;
};

export type EventsPayload = SocketEnvelope<'CAR_EVENT' | string, CarEventData | unknown>;

export type SimulatorState = {
  connected: boolean;
  health: HealthPayload | null;
  plantState: PlantStatePayload | null;
  events: EventsPayload | null;
  /** Últimos eventos recebidos (janela curta para debug/UI). */
  eventsState: CarEventData[];
  /** Índice para buscar rapidamente o último MOVED por (shop,line,station,carId). */
  movedIndex: Record<string, number>;
  buffers: BuffersPayload | null;
  buffersState: BufferItem[];
  stops: StopsEventPayload | null;
  cars: CarsPayload | null;
  oee: OEEPayload | null;
};

let state: SimulatorState = {
  connected: false,
  health: null,
  plantState: null,
  events: null,
  eventsState: [],
  movedIndex: {},
  buffers: null,
  buffersState: [],
  stops: null,
  cars: null,
  oee: null,
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function isCarEventData(v: unknown): v is CarEventData {
  if (!isRecord(v)) return false;
  return (
    typeof v.carId === 'string' &&
    typeof v.eventType === 'string' &&
    typeof v.shop === 'string' &&
    typeof v.line === 'string' &&
    typeof v.station === 'string' &&
    typeof v.timestamp === 'number'
  );
}

function movedKey(parts: { shop: string; line: string; station: string; carId: string }): string {
  return `${parts.shop}::${parts.line}::${parts.station}::${parts.carId}`;
}

function mergeBufferEvent(prev: BufferItem[], incoming: BufferItem): BufferItem[] {
  const idx = prev.findIndex((b) => b.id === incoming.id);
  if (idx < 0) return [...prev, incoming];
  const next = prev.slice();
  next[idx] = { ...prev[idx], ...incoming };
  return next;
}

const listeners = new Set<() => void>();

function emitChange() {
  for (const l of listeners) l();
}

export const simulatorStore = {
  getSnapshot(): SimulatorState {
    return state;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setConnected(connected: boolean) {
    state = { ...state, connected };
    emitChange();
  },

  setHealth(payload: HealthPayload) {
    state = { ...state, health: payload };
    emitChange();
  },

  setPlantState(payload: PlantStatePayload) {
    state = { ...state, plantState: payload };
    emitChange();
  },

  setOEE(payload: OEEPayload) {
    state = { ...state, oee: payload };
    console.log(state);
    emitChange();
  },

  setEvents(payload: EventsPayload) {
    const data: unknown = payload?.data;
    let eventsState = state.eventsState;
    let movedIndex = state.movedIndex;

    if (isCarEventData(data)) {
      // mantém uma janela curta só para debug/consulta
      const nextEvents = eventsState.length >= 250 ? eventsState.slice(-200) : eventsState;
      eventsState = [...nextEvents, data];

      if (String(data.eventType) === 'MOVED') {
        const key = movedKey({ shop: data.shop, line: data.line, station: data.station, carId: data.carId });
        // imutável pra garantir re-render
        movedIndex = { ...movedIndex, [key]: data.timestamp };
      }
    }

    state = { ...state, events: payload, eventsState, movedIndex };
    emitChange();
  },

  setBuffers(payload: BuffersPayload) {
    // Mantém uma visão estável (stateful) para renderizar buffers,
    // mesmo quando o servidor emite eventos incrementais.
    let buffersState = state.buffersState;
    const data: unknown = payload?.data;

    if (Array.isArray(data)) {
      // BUFFERS_STATE vem como array de BufferItem
      // Filtra e converte para garantir o tipo correto
      buffersState = (data as unknown[])
        .filter((item): item is BufferItem => isRecord(item) && typeof (item as Record<string, unknown>).id === 'string')
        .map((item) => {
          const r = item as Record<string, unknown>;
          return {
            id: String(r.id),
            betweenShopOrLine: typeof r.betweenShopOrLine === 'string' ? r.betweenShopOrLine : undefined,
            from: typeof r.from === 'string' ? r.from : undefined,
            to: typeof r.to === 'string' ? r.to : undefined,
            capacity: typeof r.capacity === 'number' ? r.capacity : undefined,
            currentCount: typeof r.currentCount === 'number' ? r.currentCount : undefined,
            status: typeof r.status === 'string' ? r.status : undefined,
            type: typeof r.type === 'string' ? r.type : undefined,
            carIds: Array.isArray(r.carIds) ? (r.carIds as unknown[]).map(String) : [],
          } as BufferItem;
        });
    } else if (isRecord(data) && 'buffer' in data) {
      const b = (data as { buffer?: unknown }).buffer;
      if (b && isRecord(b) && typeof b.id === 'string') {
        buffersState = mergeBufferEvent(buffersState, b as unknown as BufferItem);
      }
    }

    state = { ...state, buffers: payload, buffersState };
    emitChange();
  },

  setStops(payload: StopsEventPayload) {
    state = { ...state, stops: payload };
    emitChange();
  },

  setCars(payload: CarsPayload) {
    state = { ...state, cars: payload };
    emitChange();
  },
};

export function latestStopForStation(
  stopsPayload: StopsEventPayload | null,
  station: { shop?: string; line?: string; station?: string }
): Stop | null {
  if (!stopsPayload) return null;
  const data: unknown = stopsPayload.data;

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

  const match = (s: Stop) =>
    (!station.shop || s.shop === station.shop) &&
    (!station.line || s.line === station.line) &&
    (!station.station || s.station === station.station);

  let asArray: Stop[] = [];
  if (Array.isArray(data)) {
    asArray = data as Stop[];
  } else if (isRecord(data) && 'stop' in data) {
    const stop = (data as { stop?: unknown }).stop;
    if (stop && typeof stop === 'object') asArray = [stop as Stop];
  } else if (isRecord(data) && Array.isArray((data as { data?: unknown }).data)) {
    asArray = ((data as { data?: unknown }).data as unknown[]) as Stop[];
  }

  const candidates = asArray.filter(match);
  if (candidates.length === 0) return null;

  // Heurística: pega o mais recente pelo startTime/endTime/id
  candidates.sort((a, b) => {
    const at = a.endTime ?? a.startTime ?? 0;
    const bt = b.endTime ?? b.startTime ?? 0;
    if (bt !== at) return bt - at;
    return (b.id ?? 0) - (a.id ?? 0);
  });

  return candidates[0] ?? null;
}

export function stopForStationByStartTime(
  stopsPayload: StopsEventPayload | null,
  station: { shop?: string; line?: string; station?: string; startTime?: number | string | null }
): Stop | null {
  if (!stopsPayload) return null;
  const data: unknown = stopsPayload.data;

  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);

  const startTimeRaw = station.startTime;
  const startTime =
    typeof startTimeRaw === 'number'
      ? startTimeRaw
      : typeof startTimeRaw === 'string'
        ? Number(startTimeRaw)
        : null;
  if (startTime === null || !Number.isFinite(startTime)) return null;

  const match = (s: Stop) =>
    s.shop === station.shop && s.line === station.line && s.station === station.station && s.startTime === startTime;

  let asArray: Stop[] = [];
  if (Array.isArray(data)) {
    asArray = data as Stop[];
  } else if (isRecord(data) && 'stop' in data) {
    const stop = (data as { stop?: unknown }).stop;
    if (stop && typeof stop === 'object') asArray = [stop as Stop];
  } else if (isRecord(data) && Array.isArray((data as { data?: unknown }).data)) {
    asArray = ((data as { data?: unknown }).data as unknown[]) as Stop[];
  }

  return asArray.find(match) ?? null;
}

export function carsById(carsPayload: CarsPayload | null): Record<string, Car> {
  const result: Record<string, Car> = {};
  const data: unknown = carsPayload?.data;
  if (!Array.isArray(data)) return result;

  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue;
    const rec = item as Record<string, unknown>;
    const id = rec.id;
    if (typeof id === 'string' && id.length) result[id] = rec as Car;
  }
  return result;
}
