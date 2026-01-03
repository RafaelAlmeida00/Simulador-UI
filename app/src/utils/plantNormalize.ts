import type { BufferItem } from '../stores/simulatorStore';

export type NormalizedStation = {
  id: string;
  name: string;
  taktMn?: number;
  taktSg?: number;
  currentCarId?: string;
  occupied?: boolean;
  isStopped?: boolean;
  stopReason?: string;
  startStop?: number | string;
  raw: unknown;
};

export type NormalizedLine = {
  id: string;
  name: string;
  taktMn?: number;
  shop?: string;
  stations: NormalizedStation[];
  raw: unknown;
};

export type NormalizedShop = {
  id: string;
  name: string;
  lines: NormalizedLine[];
  raw: unknown;
};

export type NormalizedPlant = {
  shops: NormalizedShop[];
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function get(v: unknown, key: string): unknown {
  return isRecord(v) ? v[key] : undefined;
}

function getPath(v: unknown, path: string[]): unknown {
  let cur: unknown = v;
  for (const key of path) {
    cur = get(cur, key);
    if (cur === undefined) return undefined;
  }
  return cur;
}

function asString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return undefined;
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function pickFirstString(...values: unknown[]): string | undefined {
  for (const v of values) {
    const s = asString(v);
    if (s && s.trim().length) return s;
  }
  return undefined;
}

function pickFirstNumber(...values: unknown[]): number | undefined {
  for (const v of values) {
    const n = asNumber(v);
    if (n !== undefined) return n;
  }
  return undefined;
}

function normalizeStations(stationsRaw: unknown): NormalizedStation[] {
  if (!Array.isArray(stationsRaw)) return [];
  return stationsRaw.map((stRaw: unknown, index: number) => {
    const id =
      pickFirstString(get(stRaw, 'id'), get(stRaw, 'stationId'), get(stRaw, 'name'), get(stRaw, 'station')) ??
      `station-${index}`;
    const name = pickFirstString(get(stRaw, 'name'), get(stRaw, 'station'), get(stRaw, 'id')) ?? `Station ${index + 1}`;
    const taktMn = pickFirstNumber(get(stRaw, 'taktMn'), get(stRaw, 'taktTimeMn'), get(stRaw, 'taktTime'), get(stRaw, 'takt'));
    const taktSg = pickFirstNumber(get(stRaw, 'taktSg'), get(stRaw, 'taktTimeSg'), get(stRaw, 'taktTimeSeconds'), get(stRaw, 'taktSeconds'));
    const currentCarId = pickFirstString(get(stRaw, 'currentCarId'), getPath(stRaw, ['currentCar', 'id']), get(stRaw, 'carId'));
    const occupied = Boolean(get(stRaw, 'occupied'));
    const isStopped = Boolean(get(stRaw, 'isStopped'));
    const stopReason = pickFirstString(get(stRaw, 'stopReason'), getPath(stRaw, ['stop', 'reason']), get(stRaw, 'reason'));
    const startStopRaw = get(stRaw, 'startStop') ?? get(stRaw, 'stopStartTime') ?? getPath(stRaw, ['stop', 'startTime']);
    const startStop =
      typeof startStopRaw === 'number' || typeof startStopRaw === 'string' ? startStopRaw : undefined;

    return {
      id,
      name,
      taktMn,
      taktSg,
      currentCarId,
      occupied,
      isStopped,
      stopReason,
      startStop,
      raw: stRaw,
    };
  });
}

function normalizeLines(linesRaw: unknown, fallbackShop?: string): NormalizedLine[] {
  if (!Array.isArray(linesRaw)) return [];
  return linesRaw.map((lineRaw: unknown, index: number) => {
    const id = pickFirstString(get(lineRaw, 'id'), get(lineRaw, 'lineId'), get(lineRaw, 'name'), get(lineRaw, 'line')) ?? `line-${index}`;
    const name = pickFirstString(get(lineRaw, 'name'), get(lineRaw, 'line'), get(lineRaw, 'id')) ?? `Line ${index + 1}`;
    const taktMn = pickFirstNumber(get(lineRaw, 'taktMn'), get(lineRaw, 'taktTimeMn'), get(lineRaw, 'taktTime'), get(lineRaw, 'takt'));
    const shop = pickFirstString(get(lineRaw, 'shop'), get(lineRaw, 'shopName')) ?? fallbackShop;
    const stationsRaw =
      get(lineRaw, 'stations') ?? get(lineRaw, 'stationList') ?? get(lineRaw, 'nodes') ?? get(lineRaw, 'workstations') ?? [];

    return {
      id,
      name,
      taktMn,
      shop,
      stations: normalizeStations(stationsRaw),
      raw: lineRaw,
    };
  });
}

export function normalizePlantSnapshot(snapshot: unknown): NormalizedPlant {
  const s = get(snapshot, 'data') ?? snapshot;

  // 1) shops (array)
  const shopsVal = get(s, 'shops');
  if (Array.isArray(shopsVal)) {
    const shops: NormalizedShop[] = shopsVal.map((shopRaw: unknown, index: number) => {
      const id = pickFirstString(get(shopRaw, 'id'), get(shopRaw, 'shopId'), get(shopRaw, 'name'), get(shopRaw, 'shop')) ?? `shop-${index}`;
      const name = pickFirstString(get(shopRaw, 'name'), get(shopRaw, 'shop'), get(shopRaw, 'id')) ?? `Shop ${index + 1}`;
      const linesRaw = get(shopRaw, 'lines') ?? get(shopRaw, 'productionLines') ?? getPath(shopRaw, ['data', 'lines']) ?? [];
      return {
        id,
        name,
        lines: normalizeLines(linesRaw, name),
        raw: shopRaw,
      };
    });
    return { shops };
  }

  // 2) shops (object map)
  if (isRecord(shopsVal)) {
    const values = Object.values(shopsVal);
    const shops: NormalizedShop[] = values.map((shopRaw: unknown, index: number) => {
      const id = pickFirstString(get(shopRaw, 'id'), get(shopRaw, 'shopId'), get(shopRaw, 'name'), get(shopRaw, 'shop')) ?? `shop-${index}`;
      const name = pickFirstString(get(shopRaw, 'name'), get(shopRaw, 'shop'), get(shopRaw, 'id')) ?? `Shop ${index + 1}`;
      const linesRaw = get(shopRaw, 'lines') ?? get(shopRaw, 'productionLines') ?? getPath(shopRaw, ['data', 'lines']) ?? [];
      return {
        id,
        name,
        lines: normalizeLines(linesRaw, name),
        raw: shopRaw,
      };
    });
    return { shops };
  }

  // 3) lines at root
  const linesRaw = get(s, 'lines') ?? get(s, 'productionLines') ?? get(s, 'plantLines') ?? [];
  if (Array.isArray(linesRaw) && linesRaw.length) {
    const allLines = normalizeLines(linesRaw, pickFirstString(get(s, 'shop'), get(s, 'shopName')) ?? 'Shop');
    const byShop = new Map<string, NormalizedLine[]>();
    for (const line of allLines) {
      const shopName = line.shop ?? 'Shop';
      const arr = byShop.get(shopName) ?? [];
      arr.push(line);
      byShop.set(shopName, arr);
    }

    const shops: NormalizedShop[] = Array.from(byShop.entries()).map(([shopName, lines], index) => ({
      id: `shop-${index}`,
      name: shopName,
      lines,
      raw: { name: shopName },
    }));

    return { shops };
  }

  return { shops: [] };
}

export function extractBuffers(buffersPayload: unknown): BufferItem[] {
  if (!buffersPayload) return [];
  const data = get(buffersPayload, 'data');

  if (Array.isArray(data)) return data;

  // buffer_event style: { data: { action, buffer } }
  const buffer = get(data, 'buffer');
  if (buffer && typeof buffer === 'object') return [buffer as BufferItem];

  // sometimes nested
  const nested = get(data, 'data');
  if (Array.isArray(nested)) return nested as BufferItem[];

  return [];
}
