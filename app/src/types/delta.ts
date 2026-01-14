// Delta Protocol Types for WebSocket Communication
// Based on the optimized delta protocol from the backend

// ─────────────────────────────────────────────────────────────
// Core Protocol Types
// ─────────────────────────────────────────────────────────────

export type MessageType = 'FULL' | 'DELTA';

export interface ChunkInfo {
  chunkId: string;
  chunkIndex: number;
  totalChunks: number;
  isLast: boolean;
}

export interface OptimizedSocketMessage<T = unknown> {
  type: MessageType;
  channel: string;
  version: number;
  baseVersion?: number;
  data: T;
  timestamp: number;
  chunkInfo?: ChunkInfo;
  requiresAck: boolean;
}

export interface AckPayload {
  channel: string;
  version: number;
}

// ─────────────────────────────────────────────────────────────
// Plant State Delta Types (Hierarchical)
// ─────────────────────────────────────────────────────────────

export interface CarDelta {
  id: string;
  sequenceNumber?: number;
  model?: string;
  color?: string[];
  hasDefect?: boolean;
  inRework?: boolean;
  isPart?: boolean;
  partName?: string;
  currentLocation?: {
    shop?: string;
    line?: string;
    station?: string;
  };
  createdAt?: number;
  completedAt?: number;
}

export interface StationDelta {
  id: string;
  index?: number;
  occupied?: boolean;
  isStopped?: boolean;
  stopReason?: string;
  stopId?: string;
  taktMn?: number;
  taktSg?: number;
  startStop?: number;
  finishStop?: number;
  currentCar?: CarDelta | null;
  _removed?: true;
}

export interface LineDelta {
  id: string;
  shop?: string;
  line?: string;
  taktMn?: number;
  isFeederLine?: boolean;
  partType?: string;
  stations?: StationDelta[];
  _removed?: true;
}

export interface ShopDelta {
  id: string;
  name?: string;
  bufferCapacity?: number;
  reworkBuffer?: number;
  lines?: LineDelta[];
  _removed?: true;
}

export interface PlantStateDelta {
  timestamp?: number;
  totalStations?: number;
  totalOccupied?: number;
  totalFree?: number;
  totalStopped?: number;
  shops?: ShopDelta[];
}

// ─────────────────────────────────────────────────────────────
// Flat Array Delta Types (stops, buffers, cars, oee, mttr_mtbf)
// ─────────────────────────────────────────────────────────────

export type DeltaOperation = 'ADD' | 'UPDATE' | 'REMOVE';

export interface BaseDeltaItem {
  id: string | number;
  _op?: DeltaOperation;
  _removed?: true;
}

export interface StopDelta extends BaseDeltaItem {
  id: number;
  shop?: string;
  line?: string;
  station?: string;
  reason?: string;
  start_time?: number;
  end_time?: number;
  status?: string;
  severity?: string;
  type?: string;
  category?: string;
  durationMs?: number;
}

export interface BufferDelta extends BaseDeltaItem {
  id: string;
  betweenShopOrLine?: 'shop' | 'line';
  to?: string;
  from?: string;
  capacity?: number;
  currentCount?: number;
  carIds?: string[];
  type?: string;
  status?: string;
}

export interface CarItemDelta extends BaseDeltaItem {
  id: string;
  sequenceNumber?: number;
  model?: string;
  color?: string[];
  createdAt?: number;
  completedAt?: number;
  hasDefect?: boolean;
  inRework?: boolean;
  isPart?: boolean;
  partName?: string;
  trace?: unknown[];
  shopLeadtimes?: unknown[];
}

export interface OEEDelta extends BaseDeltaItem {
  id: string;
  date?: string;
  shop?: string;
  line?: string;
  productionTime?: number;
  carsProduction?: number;
  taktTime?: number;
  diffTime?: number;
  oee?: number;
  jph?: number;
}

export interface MTTRMTBFDelta extends BaseDeltaItem {
  id: string;
  date?: string;
  shop?: string;
  line?: string;
  station?: string;
  mttr?: number;
  mtbf?: number;
}

// Delta payload for flat arrays
export interface FlatArrayDelta<T extends BaseDeltaItem> {
  items: T[];
}

// ─────────────────────────────────────────────────────────────
// Cached State Types (Map-based for fast lookups)
// ─────────────────────────────────────────────────────────────

export interface CachedCar {
  id: string;
  sequenceNumber: number;
  model: string;
  color: string[];
  hasDefect: boolean;
  inRework: boolean;
  isPart: boolean;
  partName?: string;
  currentLocation?: {
    shop?: string;
    line?: string;
    station?: string;
  };
  createdAt?: number;
  completedAt?: number;
}

export interface CachedStation {
  id: string;
  index: number;
  occupied: boolean;
  isStopped: boolean;
  stopReason?: string;
  stopId?: string;
  taktMn?: number;
  taktSg?: number;
  startStop?: number;
  finishStop?: number;
  currentCar: CachedCar | null;
}

export interface CachedLine {
  id: string;
  shop: string;
  line: string;
  taktMn: number;
  isFeederLine?: boolean;
  partType?: string;
  stations: Map<string, CachedStation>;
}

export interface CachedShop {
  id: string;
  name: string;
  bufferCapacity?: number;
  reworkBuffer?: number;
  lines: Map<string, CachedLine>;
}

export interface CachedPlantState {
  timestamp: number;
  totalStations: number;
  totalOccupied: number;
  totalFree: number;
  totalStopped: number;
  shops: Map<string, CachedShop>;
}

// ─────────────────────────────────────────────────────────────
// Channel State Metadata
// ─────────────────────────────────────────────────────────────

export interface ChannelState<T> {
  version: number;
  data: T;
  lastUpdated: number;
}

export type DeltaChannelName = 'plantstate' | 'stops' | 'buffers' | 'cars' | 'oee' | 'mttr_mtbf' | 'health';
