// Imports from the new socket types
import type {
  HealthData,
  HealthPayload,
  ICar,
  CarsPayload,
  IBuffer,
  BuffersPayload,
  IStopLine,
  StopsPayload,
  PlantSnapshot,
  PlantStatePayload,
  OEEDataEmit,
  OEEPayload,
  MTTRMTBFData,
  MTTRMTBFPayload,
} from '../types/socket';
import { NormalizedPlant, normalizePlantSnapshot } from '../utils/plantNormalize';

// Re-export types for backward compatibility
export type { HealthData, HealthPayload, ICar, IBuffer, IStopLine, PlantSnapshot, OEEDataEmit, MTTRMTBFData };

// Legacy type aliases for backward compatibility
export type BufferItem = IBuffer;
export type Stop = IStopLine;
export type Car = ICar;

// Simulator state shape
export type SimulatorState = {
  connected: boolean;
  health: HealthPayload | null;
  plantState: PlantStatePayload | null;
  buffers: BuffersPayload | null;
  buffersState: IBuffer[];
  stops: StopsPayload | null;
  stopsState: IStopLine[];
  cars: CarsPayload | null;
  carsById: Record<string, ICar>;
  oee: OEEPayload | null;
  oeeState: OEEDataEmit[];
  mttrMtbf: MTTRMTBFPayload | null;
  mttrMtbfState: MTTRMTBFData[];
  getNormalizedPlant: () => NormalizedPlant | null;
};

let state: SimulatorState = {
  connected: false,
  health: null,
  plantState: null,
  buffers: null,
  buffersState: [],
  stops: null,
  stopsState: [],
  cars: null,
  carsById: {},
  oee: null,
  oeeState: [],
  mttrMtbf: null,
  mttrMtbfState: [],
  getNormalizedPlant: () => simulatorStore.getNormalizedPlant(),
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function isBuffer(v: unknown): v is IBuffer {
  if (!isRecord(v)) return false;
  return typeof v.id === 'string' && typeof v.capacity === 'number';
}

function isStopLine(v: unknown): v is IStopLine {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === 'number' &&
    typeof v.shop === 'string' &&
    typeof v.line === 'string' &&
    typeof v.station === 'string'
  );
}

function isCar(v: unknown): v is ICar {
  if (!isRecord(v)) return false;
  return typeof v.id === 'string' && typeof v.sequenceNumber === 'number';
}

function isOEEData(v: unknown): v is OEEDataEmit {
  if (!isRecord(v)) return false;
  return (
    typeof v.shop === 'string' &&
    typeof v.line === 'string' &&
    typeof v.oee === 'number'
  );
}

function isMTTRMTBFData(v: unknown): v is MTTRMTBFData {
  if (!isRecord(v)) return false;
  return (
    typeof v.shop === 'string' &&
    typeof v.line === 'string' &&
    typeof v.mttr === 'number' &&
    typeof v.mtbf === 'number'
  );
}

function mergeOEEEvent(prev: OEEDataEmit[], incoming: OEEDataEmit): OEEDataEmit[] {
  const idx = prev.findIndex((o) => o.shop === incoming.shop && o.line === incoming.line);
  if (idx < 0) return [...prev, incoming];
  const next = prev.slice();
  next[idx] = { ...prev[idx], ...incoming };
  return next;
}

function mergeBufferEvent(prev: IBuffer[], incoming: IBuffer): IBuffer[] {
  const idx = prev.findIndex((b) => b.id === incoming.id);
  if (idx < 0) return [...prev, incoming];
  const next = prev.slice();
  next[idx] = { ...prev[idx], ...incoming };
  return next;
}

function mergeStopEvent(prev: IStopLine[], incoming: IStopLine): IStopLine[] {
  const idx = prev.findIndex((s) => s.id === incoming.id);
  if (idx < 0) return [...prev, incoming];
  const next = prev.slice();
  next[idx] = { ...prev[idx], ...incoming };
  return next;
}

const listeners = new Set<() => void>();

function emitChange() {
  for (const l of listeners) l();
}


let cachedNormalizedPlant: NormalizedPlant | null = null;
let lastPlantStateRef: PlantStatePayload | null = null;


export const simulatorStore = {
  getSnapshot(): SimulatorState {
    return state;
  },

  getNormalizedPlant(): NormalizedPlant | null {
    const current = state.plantState;
    if (current !== lastPlantStateRef) {
      cachedNormalizedPlant = current !== null ? normalizePlantSnapshot(current) : null;
      lastPlantStateRef = current;
    }
    return cachedNormalizedPlant;
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
    let oeeState = state.oeeState;
    const data: unknown = payload?.data;

    if (Array.isArray(data)) {
      // OEE_STATE: full state replacement
      oeeState = data.filter(isOEEData);
    } else if (isRecord(data) && 'oee' in data) {
      // OEE_EVENT: incremental update
      const o = (data as { oee?: unknown }).oee;
      if (isOEEData(o)) {
        oeeState = mergeOEEEvent(oeeState, o);
      }
    } else if (isOEEData(data)) {
      // Single OEE data: merge into state
      oeeState = mergeOEEEvent(oeeState, data);
    }

    state = { ...state, oee: payload, oeeState };
    emitChange();
  },

  setMTTRMTBF(payload: MTTRMTBFPayload) {
    let mttrMtbfState = state.mttrMtbfState;
    const data: unknown = payload?.data;

    if (Array.isArray(data)) {
      mttrMtbfState = data.filter(isMTTRMTBFData);
    } else if (isMTTRMTBFData(data)) {
      mttrMtbfState = [data];
    }

    state = { ...state, mttrMtbf: payload, mttrMtbfState };
    emitChange();
  },

  setBuffers(payload: BuffersPayload) {
    let buffersState = state.buffersState;
    const data: unknown = payload?.data;

    if (Array.isArray(data)) {
      // BUFFERS_STATE: full state replacement
      buffersState = data.filter(isBuffer);
    } else if (isRecord(data) && 'buffer' in data) {
      // BUFFER_EVENT: incremental update
      const b = (data as { buffer?: unknown }).buffer;
      if (isBuffer(b)) {
        buffersState = mergeBufferEvent(buffersState, b);
      }
    }

    state = { ...state, buffers: payload, buffersState };
    emitChange();
  },

  setStops(payload: StopsPayload) {
    let stopsState = state.stopsState;
    const data: unknown = payload?.data;

    if (Array.isArray(data)) {
      // STOPS_STATE: full state replacement
      stopsState = data.filter(isStopLine);
    } else if (isRecord(data) && 'stop' in data) {
      // STOP_EVENT: incremental update
      const s = (data as { stop?: unknown }).stop;
      if (isStopLine(s)) {
        stopsState = mergeStopEvent(stopsState, s);
      }
    }

    state = { ...state, stops: payload, stopsState };
    emitChange();
  },

  setCars(payload: CarsPayload) {
    let carsById = state.carsById;
    const data: unknown = payload?.data;

    if (Array.isArray(data)) {
      // Build index from array
      carsById = {};
      for (const item of data) {
        if (isCar(item)) {
          carsById[item.id] = item;
        }
      }
    }

    state = { ...state, cars: payload, carsById };
    emitChange();
  },

  // Delta-aware setters (receive already-processed data from deltaManager)
  setStopsFromDelta(stops: IStopLine[]) {
    state = {
      ...state,
      stops: { type: 'STOPS_STATE', data: stops },
      stopsState: stops,
    };
    emitChange();
  },

  setBuffersFromDelta(buffers: IBuffer[]) {
    state = {
      ...state,
      buffers: { type: 'BUFFERS_STATE', data: buffers },
      buffersState: buffers,
    };
    emitChange();
  },

  setCarsFromDelta(cars: ICar[]) {
    const carsById: Record<string, ICar> = {};
    for (const car of cars) {
      carsById[car.id] = car;
    }
    state = {
      ...state,
      cars: { type: 'CARS_STATE', data: cars },
      carsById,
    };
    emitChange();
  },

  setOEEFromDelta(oeeData: OEEDataEmit[]) {
    state = {
      ...state,
      oee: { type: 'OEE_UPDATE', data: oeeData },
      oeeState: oeeData,
    };
    emitChange();
  },

  setMTTRMTBFFromDelta(mttrMtbfData: MTTRMTBFData[]) {
    state = {
      ...state,
      mttrMtbf: { type: 'MTTR_MTBF_UPDATE', data: mttrMtbfData },
      mttrMtbfState: mttrMtbfData,
    };
    emitChange();
  },

  /**
   * Reset all simulator data to initial state.
   * Called when switching sessions to avoid stale data from previous session.
   */
  reset() {
    cachedNormalizedPlant = null;
    lastPlantStateRef = null;
    state = {
      ...state,
      health: null,
      plantState: null,
      buffers: null,
      buffersState: [],
      stops: null,
      stopsState: [],
      cars: null,
      carsById: {},
      oee: null,
      oeeState: [],
      mttrMtbf: null,
      mttrMtbfState: [],
    };
    emitChange();
  },
};

// Helper: find stop for a specific station
export function latestStopForStation(
  stopsState: IStopLine[],
  station: { shop?: string; line?: string; station?: string }
): IStopLine | null {
  if (!stopsState.length) return null;

  const match = (s: IStopLine) =>
    (!station.shop || s.shop === station.shop) &&
    (!station.line || s.line === station.line) &&
    (!station.station || s.station === station.station);

  const candidates = stopsState.filter(match);
  if (candidates.length === 0) return null;

  // Sort by most recent (endTime or startTime)
  candidates.sort((a, b) => {
    const at = a.end_time ?? a.start_time ?? 0;
    const bt = b.end_time ?? b.start_time ?? 0;
    if (bt !== at) return bt - at;
    return b.id - a.id;
  });

  return candidates[0] ?? null;
}

// Helper: find stop by startTime
export function stopForStationByStartTime(
  stopsState: IStopLine[],
  station: { shop?: string; line?: string; station?: string; startTime?: number | string | null }
): IStopLine | null {
  if (!stopsState.length) return null;

  const startTimeRaw = station.startTime;
  const startTime =
    typeof startTimeRaw === 'number'
      ? startTimeRaw
      : typeof startTimeRaw === 'string'
        ? Number(startTimeRaw)
        : null;
  if (startTime === null || !Number.isFinite(startTime)) return null;

  const match = (s: IStopLine) =>
    s.shop === station.shop &&
    s.line === station.line &&
    s.station === station.station &&
    s.start_time === startTime;

  return stopsState.find(match) ?? null;
}

// Helper: get active stops (IN_PROGRESS)
export function getActiveStops(stopsState: IStopLine[]): IStopLine[] {
  return stopsState.filter((s) => s.status === 'IN_PROGRESS');
}

// Helper: get car by ID
export function getCarById(carsById: Record<string, ICar>, carId: string): ICar | null {
  return carsById[carId] ?? null;
}

// Helper: get buffer between shops/lines
export function getBufferBetween(
  buffersState: IBuffer[],
  from: string,
  to: string
): IBuffer | null {
  return buffersState.find((b) => b.from === from && b.to === to) ?? null;
}

// Helper: get OEE for a specific line
export function getOEEForLine(
  oeeState: OEEDataEmit[],
  shop: string,
  line: string
): OEEDataEmit | null {
  return oeeState.find((o) => o.shop === shop && o.line === line) ?? null;
}

// Helper: get MTTR/MTBF for a specific station
export function getMTTRMTBFForStation(
  mttrMtbfState: MTTRMTBFData[],
  shop: string,
  line: string,
  station: string
): MTTRMTBFData | null {
  return mttrMtbfState.find(
    (m) => m.shop === shop && m.line === line && m.station === station
  ) ?? null;
}
