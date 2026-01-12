// Socket payload types based on new backend models

// ─────────────────────────────────────────────────────────────
// Generic Socket Envelope
// ─────────────────────────────────────────────────────────────

export type SocketEnvelope<TType extends string, TData> = {
  type: TType;
  data: TData;
  timestamp?: number;
};

// ─────────────────────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Car (ICar)
// ─────────────────────────────────────────────────────────────

export interface ICarTrace {
  shop?: string;
  line?: string;
  station?: string;
  enter?: number;
  leave?: number;
}

export interface ICarShopLeadtime {
  shop?: string;
  line?: string;
  enteredAt?: number;
  exitedAt?: number;
  leadtimeMs?: number;
}

export interface ICar {
  id: string;
  sequenceNumber: number;
  model: string;
  color: string[];
  createdAt: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
  trace: ICarTrace[];
  hasDefect: boolean;
  defects?: string[];
  inRework: boolean;
  reworkEnteredAt?: number;
  reworkCompletedAt?: number;
  shopLeadtimes: ICarShopLeadtime[];
  totalLeadtimeMs?: number;
  isPart: boolean;
  partName?: string;
}

export type CarsPayload = SocketEnvelope<'CARS_STATE', ICar[]>;

// ─────────────────────────────────────────────────────────────
// Buffer (IBuffer)
// ─────────────────────────────────────────────────────────────

export type BufferType = 'BUFFER' | 'REWORK_BUFFER' | 'PART_BUFFER';
export type BufferStatus = 'EMPTY' | 'AVAILABLE' | 'FULL';

export interface IBuffer {
  id: string;
  betweenShopOrLine: 'shop' | 'line';
  to: string;
  from: string;
  capacity: number;
  currentCount: number;
  carIds: string[];
  type: BufferType;
  status?: BufferStatus;
}

export type BuffersPayload = SocketEnvelope<'BUFFERS_STATE' | 'BUFFER_EVENT', IBuffer[] | { action: string; buffer: IBuffer }>;

// ─────────────────────────────────────────────────────────────
// Stops (IStopLine)
// ─────────────────────────────────────────────────────────────

export type StopStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
export type StopSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'PLANNED' | null;
export type StopType = 'RANDOM_GENERATE' | 'PROPAGATION' | 'PLANNED';
export type StopCategory = 'PROCESS_QUALITY_FAILURE' | 'PROPAGATION' | 'PLANNED_STOP' | 'SHIFT_CHANGE' | 'NIGHT_STOP' | 'LUNCH' | 'MEETING';

export interface IStopLine {
  id: number;
  shop: string;
  line: string;
  station: string;
  reason: string;
  start_time: number;
  end_time?: number;
  status: StopStatus;
  severity?: StopSeverity;
  type: StopType;
  category: StopCategory;
  durationMs?: number;
}

export type StopsPayload = SocketEnvelope<'STOPS_STATE' | 'STOP_EVENT', IStopLine[] | { action: string; stop: IStopLine }>;

// ─────────────────────────────────────────────────────────────
// Plant State (PlantSnapshot)
// ─────────────────────────────────────────────────────────────

export interface RequiredPart {
  partType: string;
  consumeStation?: string;
}

export interface RequiredBuffer {
  to: { shop: string; line: string };
  capacity: number;
}

export interface RequiredRoutes {
  fromStation: string;
  to: { shop: string; line: string; station: string }[];
}

export interface TaktConfig {
  jph: number;
  taktMs?: number;
  shiftStart: string;
  shiftEnd: string;
}

export interface IStation {
  id: string;
  shop: string;
  line: string;
  station: string;
  index: number;
  taktMn: number;
  taktSg: number;
  isFirstStation?: boolean;
  isLastStation?: boolean;
  occupied: boolean;
  currentCar: ICar | null;
  isStopped: boolean;
  stopReason?: string;
  startStop: number;
  finishStop: number;
  stopId?: string;
  isFirstCar: boolean;
}

export interface ILine {
  id: string;
  shop: string;
  line: string;
  stations: IStation[];
  taktMn: number;
  isFeederLine?: boolean;
  feedsToLine?: string;
  feedsToStation?: string;
  MTTR?: number;
  MTBF?: number;
  productionTimeMinutes?: number;
  partType?: string;
  requiredParts?: RequiredPart[];
  partConsumptionStation?: string;
  createWith?: { line: string; station: string };
  buffers: RequiredBuffer[];
  routes: RequiredRoutes[];
  takt: TaktConfig;
}

export interface IShop {
  name: string;
  lines: Record<string, ILine> | ILine[];
  bufferCapacity?: number;
  reworkBuffer?: number;
}

export interface PlantSnapshot {
  timestamp: number;
  shops: IShop[];
  totalStations: number;
  totalOccupied: number;
  totalFree: number;
  totalStopped: number;
}

export type PlantStatePayload = SocketEnvelope<'PLANT_STATE', PlantSnapshot>;

// ─────────────────────────────────────────────────────────────
// OEE
// ─────────────────────────────────────────────────────────────

export interface OEEDataEmit {
  date: string;
  shop: string;
  line: string;
  productionTime: number;
  carsProduction: number;
  taktTime: number;
  diffTime: number;
  oee: number;
  jph: number;
}

export type OEEPayload = SocketEnvelope<'OEE_UPDATE', OEEDataEmit[]>;

// ─────────────────────────────────────────────────────────────
// MTTR/MTBF
// ─────────────────────────────────────────────────────────────

export interface MTTRMTBFData {
  date: string;
  shop: string;
  line: string;
  station: string;
  mttr: number;
  mtbf: number;
}

export type MTTRMTBFPayload = SocketEnvelope<'MTTR_MTBF_UPDATE', MTTRMTBFData[]>;
