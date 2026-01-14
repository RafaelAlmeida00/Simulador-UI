// Delta State Manager
// Handles caching, delta merging, and chunk reassembly for WebSocket data

import type {
  OptimizedSocketMessage,
  ChunkInfo,
  CachedPlantState,
  CachedShop,
  CachedLine,
  CachedStation,
  CachedCar,
  PlantStateDelta,
  ShopDelta,
  LineDelta,
  StationDelta,
  CarDelta,
  BaseDeltaItem,
  StopDelta,
  BufferDelta,
  CarItemDelta,
  OEEDelta,
  MTTRMTBFDelta,
  FlatArrayDelta,
  ChannelState,
  DeltaChannelName,
} from '../types/delta';

import type {
  IStopLine,
  IBuffer,
  ICar,
  OEEDataEmit,
  MTTRMTBFData,
  HealthData,
  PlantSnapshot,
  IShop,
  ILine,
  IStation,
} from '../types/socket';

// ─────────────────────────────────────────────────────────────
// Chunk Reassembly Manager
// ─────────────────────────────────────────────────────────────

interface ChunkBuffer {
  chunks: Map<number, unknown>;
  receivedAt: number;
  totalChunks: number;
}

const chunkBuffers = new Map<string, ChunkBuffer>();
const CHUNK_TIMEOUT_MS = 30000; // 30 seconds timeout for chunk reassembly

function cleanupExpiredChunks(): void {
  const now = Date.now();
  for (const [chunkId, buffer] of chunkBuffers) {
    if (now - buffer.receivedAt > CHUNK_TIMEOUT_MS) {
      console.warn(`[deltaManager] Chunk buffer ${chunkId} expired, cleaning up`);
      chunkBuffers.delete(chunkId);
    }
  }
}

export function handleChunkedMessage<T>(
  message: OptimizedSocketMessage<T>
): OptimizedSocketMessage<T> | null {
  const info = message.chunkInfo;
  if (!info) return message;

  cleanupExpiredChunks();

  let buffer = chunkBuffers.get(info.chunkId);
  if (!buffer) {
    buffer = {
      chunks: new Map(),
      receivedAt: Date.now(),
      totalChunks: info.totalChunks,
    };
    chunkBuffers.set(info.chunkId, buffer);
  }

  buffer.chunks.set(info.chunkIndex, message.data);
  buffer.receivedAt = Date.now();

  if (info.isLast && buffer.chunks.size === info.totalChunks) {
    const reassembled = reassembleChunks(buffer, message.channel);
    chunkBuffers.delete(info.chunkId);

    return {
      ...message,
      data: reassembled as T,
      chunkInfo: undefined,
    };
  }

  return null;
}

function reassembleChunks(buffer: ChunkBuffer, channel: string): unknown {
  const sortedChunks = Array.from(buffer.chunks.entries())
    .sort(([a], [b]) => a - b)
    .map(([, data]) => data);

  if (channel === 'plantstate') {
    // Chunk 0 = metadata, chunks 1+ = shops
    const metadata = sortedChunks[0] as Record<string, unknown>;
    const result: Record<string, unknown> = { ...metadata };
    result.shops = [];

    for (let i = 1; i < sortedChunks.length; i++) {
      const chunk = sortedChunks[i] as Record<string, unknown>;
      if (chunk?.shop) {
        (result.shops as unknown[]).push(chunk.shop);
      }
    }

    return result;
  }

  // For flat arrays, concatenate all items
  if (Array.isArray(sortedChunks[0])) {
    return sortedChunks.flat();
  }

  // For object-based chunks with items array
  const items: unknown[] = [];
  for (const chunk of sortedChunks) {
    const c = chunk as Record<string, unknown>;
    if (Array.isArray(c?.items)) {
      items.push(...c.items);
    }
  }

  return items.length > 0 ? { items } : sortedChunks[0];
}

// ─────────────────────────────────────────────────────────────
// Plant State Delta Manager
// ─────────────────────────────────────────────────────────────

let cachedPlantState: CachedPlantState | null = null;
let plantStateVersion = 0;

export function getPlantStateVersion(): number {
  return plantStateVersion;
}

export function getCachedPlantState(): CachedPlantState | null {
  return cachedPlantState;
}

function createEmptyPlantState(): CachedPlantState {
  return {
    timestamp: 0,
    totalStations: 0,
    totalOccupied: 0,
    totalFree: 0,
    totalStopped: 0,
    shops: new Map(),
  };
}

function convertFullToPlantState(data: PlantSnapshot): CachedPlantState {
  const state = createEmptyPlantState();

  state.timestamp = data.timestamp;
  state.totalStations = data.totalStations ?? 0;
  state.totalOccupied = data.totalOccupied ?? 0;
  state.totalFree = data.totalFree ?? 0;
  state.totalStopped = data.totalStopped ?? 0;

  if (Array.isArray(data.shops)) {
    for (const shopData of data.shops) {
      const shop = convertShopToCache(shopData);
      state.shops.set(shop.id, shop);
    }
  }

  return state;
}

function convertShopToCache(shopData: IShop): CachedShop {
  const shop: CachedShop = {
    id: shopData.name,
    name: shopData.name,
    bufferCapacity: shopData.bufferCapacity,
    reworkBuffer: shopData.reworkBuffer,
    lines: new Map(),
  };

  const linesArray = Array.isArray(shopData.lines)
    ? shopData.lines
    : Object.values(shopData.lines || {});

  for (const lineData of linesArray) {
    const line = convertLineToCache(lineData);
    shop.lines.set(line.id, line);
  }

  return shop;
}

function convertLineToCache(lineData: ILine): CachedLine {
  const line: CachedLine = {
    id: lineData.id,
    shop: lineData.shop,
    line: lineData.line,
    taktMn: lineData.taktMn,
    isFeederLine: lineData.isFeederLine,
    partType: lineData.partType,
    stations: new Map(),
  };

  if (Array.isArray(lineData.stations)) {
    for (const stationData of lineData.stations) {
      const station = convertStationToCache(stationData);
      line.stations.set(station.id, station);
    }
  }

  return line;
}

function convertStationToCache(stationData: IStation): CachedStation {
  return {
    id: stationData.id,
    index: stationData.index,
    occupied: stationData.occupied,
    isStopped: stationData.isStopped,
    stopReason: stationData.stopReason,
    stopId: stationData.stopId,
    taktMn: stationData.taktMn,
    taktSg: stationData.taktSg,
    startStop: stationData.startStop,
    finishStop: stationData.finishStop,
    currentCar: stationData.currentCar ? convertCarToCache(stationData.currentCar) : null,
  };
}

function convertCarToCache(carData: ICar): CachedCar {
  return {
    id: carData.id,
    sequenceNumber: carData.sequenceNumber,
    model: carData.model,
    color: carData.color,
    hasDefect: carData.hasDefect,
    inRework: carData.inRework,
    isPart: carData.isPart,
    partName: carData.partName,
    createdAt: carData.createdAt,
    completedAt: carData.completedAt,
  };
}

function applyCarDelta(station: CachedStation, carDelta: CarDelta): void {
  if (!station.currentCar || station.currentCar.id !== carDelta.id) {
    station.currentCar = {
      id: carDelta.id,
      sequenceNumber: carDelta.sequenceNumber ?? 0,
      model: carDelta.model ?? '',
      color: carDelta.color ?? [],
      hasDefect: carDelta.hasDefect ?? false,
      inRework: carDelta.inRework ?? false,
      isPart: carDelta.isPart ?? false,
      partName: carDelta.partName,
      currentLocation: carDelta.currentLocation,
      createdAt: carDelta.createdAt,
      completedAt: carDelta.completedAt,
    };
    return;
  }

  const car = station.currentCar;
  if (carDelta.sequenceNumber !== undefined) car.sequenceNumber = carDelta.sequenceNumber;
  if (carDelta.model !== undefined) car.model = carDelta.model;
  if (carDelta.color !== undefined) car.color = carDelta.color;
  if (carDelta.hasDefect !== undefined) car.hasDefect = carDelta.hasDefect;
  if (carDelta.inRework !== undefined) car.inRework = carDelta.inRework;
  if (carDelta.isPart !== undefined) car.isPart = carDelta.isPart;
  if (carDelta.partName !== undefined) car.partName = carDelta.partName;
  if (carDelta.currentLocation !== undefined) car.currentLocation = carDelta.currentLocation;
  if (carDelta.createdAt !== undefined) car.createdAt = carDelta.createdAt;
  if (carDelta.completedAt !== undefined) car.completedAt = carDelta.completedAt;
}

function applyStationDelta(stations: Map<string, CachedStation>, stationDelta: StationDelta): void {
  const stationId = stationDelta.id;

  if (stationDelta._removed) {
    stations.delete(stationId);
    return;
  }

  let station = stations.get(stationId);
  if (!station) {
    station = {
      id: stationId,
      index: 0,
      occupied: false,
      isStopped: false,
      currentCar: null,
    };
    stations.set(stationId, station);
  }

  if (stationDelta.index !== undefined) station.index = stationDelta.index;
  if (stationDelta.occupied !== undefined) station.occupied = stationDelta.occupied;
  if (stationDelta.isStopped !== undefined) station.isStopped = stationDelta.isStopped;
  if (stationDelta.stopReason !== undefined) station.stopReason = stationDelta.stopReason;
  if (stationDelta.stopId !== undefined) station.stopId = stationDelta.stopId;
  if (stationDelta.taktMn !== undefined) station.taktMn = stationDelta.taktMn;
  if (stationDelta.taktSg !== undefined) station.taktSg = stationDelta.taktSg;
  if (stationDelta.startStop !== undefined) station.startStop = stationDelta.startStop;
  if (stationDelta.finishStop !== undefined) station.finishStop = stationDelta.finishStop;

  if (stationDelta.currentCar === null) {
    station.currentCar = null;
  } else if (stationDelta.currentCar !== undefined) {
    applyCarDelta(station, stationDelta.currentCar);
  }
}

function applyLineDelta(lines: Map<string, CachedLine>, lineDelta: LineDelta): void {
  const lineId = lineDelta.id;

  if (lineDelta._removed) {
    lines.delete(lineId);
    return;
  }

  let line = lines.get(lineId);
  if (!line) {
    line = {
      id: lineId,
      shop: '',
      line: '',
      taktMn: 0,
      stations: new Map(),
    };
    lines.set(lineId, line);
  }

  if (lineDelta.shop !== undefined) line.shop = lineDelta.shop;
  if (lineDelta.line !== undefined) line.line = lineDelta.line;
  if (lineDelta.taktMn !== undefined) line.taktMn = lineDelta.taktMn;
  if (lineDelta.isFeederLine !== undefined) line.isFeederLine = lineDelta.isFeederLine;
  if (lineDelta.partType !== undefined) line.partType = lineDelta.partType;

  if (lineDelta.stations) {
    for (const stationDelta of lineDelta.stations) {
      applyStationDelta(line.stations, stationDelta);
    }
  }
}

function applyShopDelta(shops: Map<string, CachedShop>, shopDelta: ShopDelta): void {
  const shopId = shopDelta.id;

  if (shopDelta._removed) {
    shops.delete(shopId);
    return;
  }

  let shop = shops.get(shopId);
  if (!shop) {
    shop = {
      id: shopId,
      name: shopId,
      lines: new Map(),
    };
    shops.set(shopId, shop);
  }

  if (shopDelta.name !== undefined) shop.name = shopDelta.name;
  if (shopDelta.bufferCapacity !== undefined) shop.bufferCapacity = shopDelta.bufferCapacity;
  if (shopDelta.reworkBuffer !== undefined) shop.reworkBuffer = shopDelta.reworkBuffer;

  if (shopDelta.lines) {
    for (const lineDelta of shopDelta.lines) {
      applyLineDelta(shop.lines, lineDelta);
    }
  }
}

export function applyPlantStateDelta(
  message: OptimizedSocketMessage<PlantSnapshot | PlantStateDelta>
): CachedPlantState {
  if (message.type === 'FULL') {
    cachedPlantState = convertFullToPlantState(message.data as PlantSnapshot);
    plantStateVersion = message.version;
    return cachedPlantState;
  }

  // Validate version
  if (message.baseVersion !== undefined && message.baseVersion !== plantStateVersion) {
    console.warn(
      `[deltaManager] Plant state version mismatch. Expected ${plantStateVersion}, got baseVersion ${message.baseVersion}. Requesting full state.`
    );
    throw new Error('VERSION_MISMATCH');
  }

  if (!cachedPlantState) {
    console.warn('[deltaManager] No cached plant state, cannot apply delta');
    throw new Error('NO_CACHED_STATE');
  }

  const delta = message.data as PlantStateDelta;

  if (delta.timestamp !== undefined) cachedPlantState.timestamp = delta.timestamp;
  if (delta.totalStations !== undefined) cachedPlantState.totalStations = delta.totalStations;
  if (delta.totalOccupied !== undefined) cachedPlantState.totalOccupied = delta.totalOccupied;
  if (delta.totalFree !== undefined) cachedPlantState.totalFree = delta.totalFree;
  if (delta.totalStopped !== undefined) cachedPlantState.totalStopped = delta.totalStopped;

  if (delta.shops) {
    for (const shopDelta of delta.shops) {
      applyShopDelta(cachedPlantState.shops, shopDelta);
    }
  }

  plantStateVersion = message.version;
  return cachedPlantState;
}

// Convert cached state back to PlantSnapshot format for backward compatibility
export function convertCachedToSnapshot(cached: CachedPlantState): PlantSnapshot {
  const shops: IShop[] = [];

  for (const cachedShop of cached.shops.values()) {
    const lines: ILine[] = [];

    for (const cachedLine of cachedShop.lines.values()) {
      const stations: IStation[] = [];

      for (const cachedStation of cachedLine.stations.values()) {
        stations.push({
          id: cachedStation.id,
          shop: cachedLine.shop,
          line: cachedLine.line,
          station: cachedStation.id,
          index: cachedStation.index,
          taktMn: cachedStation.taktMn ?? cachedLine.taktMn,
          taktSg: cachedStation.taktSg ?? 0,
          occupied: cachedStation.occupied,
          isStopped: cachedStation.isStopped,
          stopReason: cachedStation.stopReason,
          stopId: cachedStation.stopId,
          startStop: cachedStation.startStop ?? 0,
          finishStop: cachedStation.finishStop ?? 0,
          isFirstCar: false,
          currentCar: cachedStation.currentCar
            ? {
                id: cachedStation.currentCar.id,
                sequenceNumber: cachedStation.currentCar.sequenceNumber,
                model: cachedStation.currentCar.model,
                color: cachedStation.currentCar.color,
                hasDefect: cachedStation.currentCar.hasDefect,
                inRework: cachedStation.currentCar.inRework,
                isPart: cachedStation.currentCar.isPart,
                partName: cachedStation.currentCar.partName,
                createdAt: cachedStation.currentCar.createdAt ?? 0,
                trace: [],
                shopLeadtimes: [],
              }
            : null,
        });
      }

      // Sort stations by index
      stations.sort((a, b) => a.index - b.index);

      lines.push({
        id: cachedLine.id,
        shop: cachedLine.shop,
        line: cachedLine.line,
        taktMn: cachedLine.taktMn,
        isFeederLine: cachedLine.isFeederLine,
        partType: cachedLine.partType,
        stations,
        buffers: [],
        routes: [],
        takt: { jph: 0, shiftStart: '', shiftEnd: '' },
      });
    }

    shops.push({
      name: cachedShop.name,
      lines,
      bufferCapacity: cachedShop.bufferCapacity,
      reworkBuffer: cachedShop.reworkBuffer,
    });
  }

  return {
    timestamp: cached.timestamp,
    shops,
    totalStations: cached.totalStations,
    totalOccupied: cached.totalOccupied,
    totalFree: cached.totalFree,
    totalStopped: cached.totalStopped,
  };
}

// ─────────────────────────────────────────────────────────────
// Flat Array Delta Manager (stops, buffers, cars, oee, mttr_mtbf)
// ─────────────────────────────────────────────────────────────

type CacheMap<T> = Map<string | number, T>;

interface FlatArrayCache<T> {
  data: CacheMap<T>;
  version: number;
}

const stopsCache: FlatArrayCache<IStopLine> = { data: new Map(), version: 0 };
const buffersCache: FlatArrayCache<IBuffer> = { data: new Map(), version: 0 };
const carsCache: FlatArrayCache<ICar> = { data: new Map(), version: 0 };
const oeeCache: FlatArrayCache<OEEDataEmit> = { data: new Map(), version: 0 };
const mttrMtbfCache: FlatArrayCache<MTTRMTBFData> = { data: new Map(), version: 0 };

function applyFlatDelta<T extends { id: string | number }, D extends BaseDeltaItem>(
  cache: CacheMap<T>,
  deltaItems: D[],
  createItem: (delta: D) => T,
  mergeItem: (existing: T, delta: D) => T
): void {
  for (const delta of deltaItems) {
    const id = delta.id;

    if (delta._removed) {
      cache.delete(id);
      continue;
    }

    const existing = cache.get(id);

    if (!existing || delta._op === 'ADD') {
      cache.set(id, createItem(delta));
    } else {
      cache.set(id, mergeItem(existing, delta));
    }
  }
}

// Stops
function createStopFromDelta(delta: StopDelta): IStopLine {
  return {
    id: delta.id,
    shop: delta.shop ?? '',
    line: delta.line ?? '',
    station: delta.station ?? '',
    reason: delta.reason ?? '',
    start_time: delta.start_time ?? 0,
    end_time: delta.end_time,
    status: (delta.status as IStopLine['status']) ?? 'IN_PROGRESS',
    severity: delta.severity as IStopLine['severity'],
    type: (delta.type as IStopLine['type']) ?? 'RANDOM_GENERATE',
    category: (delta.category as IStopLine['category']) ?? 'PROCESS_QUALITY_FAILURE',
    durationMs: delta.durationMs,
  };
}

function mergeStopWithDelta(existing: IStopLine, delta: StopDelta): IStopLine {
  return {
    ...existing,
    ...(delta.shop !== undefined && { shop: delta.shop }),
    ...(delta.line !== undefined && { line: delta.line }),
    ...(delta.station !== undefined && { station: delta.station }),
    ...(delta.reason !== undefined && { reason: delta.reason }),
    ...(delta.start_time !== undefined && { start_time: delta.start_time }),
    ...(delta.end_time !== undefined && { end_time: delta.end_time }),
    ...(delta.status !== undefined && { status: delta.status as IStopLine['status'] }),
    ...(delta.severity !== undefined && { severity: delta.severity as IStopLine['severity'] }),
    ...(delta.type !== undefined && { type: delta.type as IStopLine['type'] }),
    ...(delta.category !== undefined && { category: delta.category as IStopLine['category'] }),
    ...(delta.durationMs !== undefined && { durationMs: delta.durationMs }),
  };
}

export function applyStopsDelta(
  message: OptimizedSocketMessage<IStopLine[] | FlatArrayDelta<StopDelta>>
): IStopLine[] {
  if (message.type === 'FULL') {
    stopsCache.data.clear();
    // Handle both array format and { items: [...] } format
    const rawData = message.data;
    const data: IStopLine[] = Array.isArray(rawData)
      ? rawData
      : (rawData as FlatArrayDelta<IStopLine>).items ?? [];
    for (const item of data) {
      if (item && item.id) {
        stopsCache.data.set(item.id, item);
      }
    }
    stopsCache.version = message.version;
    return Array.from(stopsCache.data.values());
  }

  if (message.baseVersion !== undefined && message.baseVersion !== stopsCache.version) {
    throw new Error('VERSION_MISMATCH');
  }

  const delta = message.data as FlatArrayDelta<StopDelta>;
  if (delta.items) {
    applyFlatDelta(stopsCache.data, delta.items, createStopFromDelta, mergeStopWithDelta);
  }

  stopsCache.version = message.version;
  return Array.from(stopsCache.data.values());
}

// Buffers
function createBufferFromDelta(delta: BufferDelta): IBuffer {
  return {
    id: delta.id,
    betweenShopOrLine: delta.betweenShopOrLine ?? 'line',
    to: delta.to ?? '',
    from: delta.from ?? '',
    capacity: delta.capacity ?? 0,
    currentCount: delta.currentCount ?? 0,
    carIds: delta.carIds ?? [],
    type: (delta.type as IBuffer['type']) ?? 'BUFFER',
    status: delta.status as IBuffer['status'],
  };
}

function mergeBufferWithDelta(existing: IBuffer, delta: BufferDelta): IBuffer {
  return {
    ...existing,
    ...(delta.betweenShopOrLine !== undefined && { betweenShopOrLine: delta.betweenShopOrLine }),
    ...(delta.to !== undefined && { to: delta.to }),
    ...(delta.from !== undefined && { from: delta.from }),
    ...(delta.capacity !== undefined && { capacity: delta.capacity }),
    ...(delta.currentCount !== undefined && { currentCount: delta.currentCount }),
    ...(delta.carIds !== undefined && { carIds: delta.carIds }),
    ...(delta.type !== undefined && { type: delta.type as IBuffer['type'] }),
    ...(delta.status !== undefined && { status: delta.status as IBuffer['status'] }),
  };
}

export function applyBuffersDelta(
  message: OptimizedSocketMessage<IBuffer[] | FlatArrayDelta<BufferDelta>>
): IBuffer[] {
  if (message.type === 'FULL') {
    buffersCache.data.clear();
    // Handle both array format and { items: [...] } format
    const rawData = message.data;
    const data: IBuffer[] = Array.isArray(rawData)
      ? rawData
      : (rawData as FlatArrayDelta<IBuffer>).items ?? [];
    for (const item of data) {
      if (item && item.id) {
        buffersCache.data.set(item.id, item);
      }
    }
    buffersCache.version = message.version;
    return Array.from(buffersCache.data.values());
  }

  if (message.baseVersion !== undefined && message.baseVersion !== buffersCache.version) {
    throw new Error('VERSION_MISMATCH');
  }

  const delta = message.data as FlatArrayDelta<BufferDelta>;
  if (delta.items) {
    applyFlatDelta(buffersCache.data, delta.items, createBufferFromDelta, mergeBufferWithDelta);
  }

  buffersCache.version = message.version;
  return Array.from(buffersCache.data.values());
}

// Cars
function createCarFromDelta(delta: CarItemDelta): ICar {
  return {
    id: delta.id,
    sequenceNumber: delta.sequenceNumber ?? 0,
    model: delta.model ?? '',
    color: delta.color ?? [],
    createdAt: delta.createdAt ?? 0,
    completedAt: delta.completedAt,
    hasDefect: delta.hasDefect ?? false,
    inRework: delta.inRework ?? false,
    isPart: delta.isPart ?? false,
    partName: delta.partName,
    trace: (delta.trace as ICar['trace']) ?? [],
    shopLeadtimes: (delta.shopLeadtimes as ICar['shopLeadtimes']) ?? [],
  };
}

function mergeCarWithDelta(existing: ICar, delta: CarItemDelta): ICar {
  return {
    ...existing,
    ...(delta.sequenceNumber !== undefined && { sequenceNumber: delta.sequenceNumber }),
    ...(delta.model !== undefined && { model: delta.model }),
    ...(delta.color !== undefined && { color: delta.color }),
    ...(delta.createdAt !== undefined && { createdAt: delta.createdAt }),
    ...(delta.completedAt !== undefined && { completedAt: delta.completedAt }),
    ...(delta.hasDefect !== undefined && { hasDefect: delta.hasDefect }),
    ...(delta.inRework !== undefined && { inRework: delta.inRework }),
    ...(delta.isPart !== undefined && { isPart: delta.isPart }),
    ...(delta.partName !== undefined && { partName: delta.partName }),
    ...(delta.trace !== undefined && { trace: delta.trace as ICar['trace'] }),
    ...(delta.shopLeadtimes !== undefined && { shopLeadtimes: delta.shopLeadtimes as ICar['shopLeadtimes'] }),
  };
}

export function applyCarsDelta(
  message: OptimizedSocketMessage<ICar[] | FlatArrayDelta<CarItemDelta>>
): ICar[] {
  if (message.type === 'FULL') {
    carsCache.data.clear();
    // Handle both array format and { items: [...] } format
    const rawData = message.data;
    const data: ICar[] = Array.isArray(rawData)
      ? rawData
      : (rawData as FlatArrayDelta<ICar>).items ?? [];
    for (const item of data) {
      if (item && item.id) {
        carsCache.data.set(item.id, item);
      }
    }
    carsCache.version = message.version;
    return Array.from(carsCache.data.values());
  }

  if (message.baseVersion !== undefined && message.baseVersion !== carsCache.version) {
    throw new Error('VERSION_MISMATCH');
  }

  const delta = message.data as FlatArrayDelta<CarItemDelta>;
  if (delta.items) {
    applyFlatDelta(carsCache.data, delta.items, createCarFromDelta, mergeCarWithDelta);
  }

  carsCache.version = message.version;
  return Array.from(carsCache.data.values());
}

// OEE
function createOEEId(data: OEEDelta | OEEDataEmit): string {
  return `${data.shop ?? ''}-${data.line ?? ''}-${data.date ?? ''}`;
}

function createOEEFromDelta(delta: OEEDelta): OEEDataEmit {
  return {
    date: delta.date ?? '',
    shop: delta.shop ?? '',
    line: delta.line ?? '',
    productionTime: delta.productionTime ?? 0,
    carsProduction: delta.carsProduction ?? 0,
    taktTime: delta.taktTime ?? 0,
    diffTime: delta.diffTime ?? 0,
    oee: delta.oee ?? 0,
    jph: delta.jph ?? 0,
  };
}

function mergeOEEWithDelta(existing: OEEDataEmit, delta: OEEDelta): OEEDataEmit {
  return {
    ...existing,
    ...(delta.date !== undefined && { date: delta.date }),
    ...(delta.shop !== undefined && { shop: delta.shop }),
    ...(delta.line !== undefined && { line: delta.line }),
    ...(delta.productionTime !== undefined && { productionTime: delta.productionTime }),
    ...(delta.carsProduction !== undefined && { carsProduction: delta.carsProduction }),
    ...(delta.taktTime !== undefined && { taktTime: delta.taktTime }),
    ...(delta.diffTime !== undefined && { diffTime: delta.diffTime }),
    ...(delta.oee !== undefined && { oee: delta.oee }),
    ...(delta.jph !== undefined && { jph: delta.jph }),
  };
}

export function applyOEEDelta(
  message: OptimizedSocketMessage<OEEDataEmit[] | FlatArrayDelta<OEEDelta>>
): OEEDataEmit[] {
  if (message.type === 'FULL') {
    oeeCache.data.clear();
    // Handle both array format and { items: [...] } format
    const rawData = message.data;
    const data: OEEDataEmit[] = Array.isArray(rawData)
      ? rawData
      : (rawData as FlatArrayDelta<OEEDataEmit>).items ?? [];
    for (const item of data) {
      if (item) {
        oeeCache.data.set(createOEEId(item), item);
      }
    }
    oeeCache.version = message.version;
    return Array.from(oeeCache.data.values());
  }

  if (message.baseVersion !== undefined && message.baseVersion !== oeeCache.version) {
    throw new Error('VERSION_MISMATCH');
  }

  const delta = message.data as FlatArrayDelta<OEEDelta>;
  if (delta.items) {
    for (const item of delta.items) {
      const id = item.id ?? createOEEId(item);
      if (item._removed) {
        oeeCache.data.delete(id);
        continue;
      }

      const existing = oeeCache.data.get(id);
      if (!existing || item._op === 'ADD') {
        oeeCache.data.set(id, createOEEFromDelta(item));
      } else {
        oeeCache.data.set(id, mergeOEEWithDelta(existing, item));
      }
    }
  }

  oeeCache.version = message.version;
  return Array.from(oeeCache.data.values());
}

// MTTR/MTBF
function createMTTRMTBFId(data: MTTRMTBFDelta | MTTRMTBFData): string {
  return `${data.shop ?? ''}-${data.line ?? ''}-${data.station ?? ''}-${data.date ?? ''}`;
}

function createMTTRMTBFFromDelta(delta: MTTRMTBFDelta): MTTRMTBFData {
  return {
    date: delta.date ?? '',
    shop: delta.shop ?? '',
    line: delta.line ?? '',
    station: delta.station ?? '',
    mttr: delta.mttr ?? 0,
    mtbf: delta.mtbf ?? 0,
  };
}

function mergeMTTRMTBFWithDelta(existing: MTTRMTBFData, delta: MTTRMTBFDelta): MTTRMTBFData {
  return {
    ...existing,
    ...(delta.date !== undefined && { date: delta.date }),
    ...(delta.shop !== undefined && { shop: delta.shop }),
    ...(delta.line !== undefined && { line: delta.line }),
    ...(delta.station !== undefined && { station: delta.station }),
    ...(delta.mttr !== undefined && { mttr: delta.mttr }),
    ...(delta.mtbf !== undefined && { mtbf: delta.mtbf }),
  };
}

export function applyMTTRMTBFDelta(
  message: OptimizedSocketMessage<MTTRMTBFData[] | FlatArrayDelta<MTTRMTBFDelta>>
): MTTRMTBFData[] {
  if (message.type === 'FULL') {
    mttrMtbfCache.data.clear();
    // Handle both array format and { items: [...] } format
    const rawData = message.data;
    const data: MTTRMTBFData[] = Array.isArray(rawData)
      ? rawData
      : (rawData as FlatArrayDelta<MTTRMTBFData>).items ?? [];
    for (const item of data) {
      if (item) {
        mttrMtbfCache.data.set(createMTTRMTBFId(item), item);
      }
    }
    mttrMtbfCache.version = message.version;
    return Array.from(mttrMtbfCache.data.values());
  }

  if (message.baseVersion !== undefined && message.baseVersion !== mttrMtbfCache.version) {
    throw new Error('VERSION_MISMATCH');
  }

  const delta = message.data as FlatArrayDelta<MTTRMTBFDelta>;
  if (delta.items) {
    for (const item of delta.items) {
      const id = item.id ?? createMTTRMTBFId(item);
      if (item._removed) {
        mttrMtbfCache.data.delete(id);
        continue;
      }

      const existing = mttrMtbfCache.data.get(id);
      if (!existing || item._op === 'ADD') {
        mttrMtbfCache.data.set(id, createMTTRMTBFFromDelta(item));
      } else {
        mttrMtbfCache.data.set(id, mergeMTTRMTBFWithDelta(existing, item));
      }
    }
  }

  mttrMtbfCache.version = message.version;
  return Array.from(mttrMtbfCache.data.values());
}

// ─────────────────────────────────────────────────────────────
// Cache Access Functions
// ─────────────────────────────────────────────────────────────

export function getStopsCache(): IStopLine[] {
  return Array.from(stopsCache.data.values());
}

export function getBuffersCache(): IBuffer[] {
  return Array.from(buffersCache.data.values());
}

export function getCarsCache(): ICar[] {
  return Array.from(carsCache.data.values());
}

export function getOEECache(): OEEDataEmit[] {
  return Array.from(oeeCache.data.values());
}

export function getMTTRMTBFCache(): MTTRMTBFData[] {
  return Array.from(mttrMtbfCache.data.values());
}

export function getCacheVersions(): Record<string, number> {
  return {
    plantstate: plantStateVersion,
    stops: stopsCache.version,
    buffers: buffersCache.version,
    cars: carsCache.version,
    oee: oeeCache.version,
    mttr_mtbf: mttrMtbfCache.version,
  };
}

// ─────────────────────────────────────────────────────────────
// Reset Functions (for reconnection)
// ─────────────────────────────────────────────────────────────

export function resetPlantStateCache(): void {
  cachedPlantState = null;
  plantStateVersion = 0;
}

export function resetStopsCache(): void {
  stopsCache.data.clear();
  stopsCache.version = 0;
}

export function resetBuffersCache(): void {
  buffersCache.data.clear();
  buffersCache.version = 0;
}

export function resetCarsCache(): void {
  carsCache.data.clear();
  carsCache.version = 0;
}

export function resetOEECache(): void {
  oeeCache.data.clear();
  oeeCache.version = 0;
}

export function resetMTTRMTBFCache(): void {
  mttrMtbfCache.data.clear();
  mttrMtbfCache.version = 0;
}

export function resetAllCaches(): void {
  resetPlantStateCache();
  resetStopsCache();
  resetBuffersCache();
  resetCarsCache();
  resetOEECache();
  resetMTTRMTBFCache();
  chunkBuffers.clear();
}
