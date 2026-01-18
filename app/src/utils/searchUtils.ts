import type { SimulatorState } from '../stores/simulatorStore';
import type { SearchResult, SearchIndex, SearchCategory } from '../types/search';
import { CATEGORY_ROUTES } from '../types/search';
import type { NormalizedPlant, NormalizedShop, NormalizedLine, NormalizedStation } from './plantNormalize';

/**
 * Normalize search term for case-insensitive matching
 */
export function normalizeSearchTerm(term: string): string {
  return term.toLowerCase().trim();
}

/**
 * Check if a value matches search term
 */
export function matchesSearch(value: unknown, searchTerm: string): boolean {
  if (!value) return false;
  const normalized = normalizeSearchTerm(String(value));
  return normalized.includes(searchTerm);
}

/**
 * Calculate relevance score (higher = better)
 */
export function calculateScore(value: string, searchTerm: string): number {
  const normalized = normalizeSearchTerm(value);
  const term = normalizeSearchTerm(searchTerm);

  if (normalized === term) return 100; // Exact match
  if (normalized.startsWith(term)) return 80; // Prefix match
  if (normalized.includes(term)) return 50; // Contains match
  return 0;
}

/**
 * Build search result for a shop
 */
function buildShopResult(shop: NormalizedShop, index: number): SearchResult {
  return {
    id: `shop-${index}`,
    category: 'shop',
    title: shop.name,
    subtitle: `${shop.lines.length} linha${shop.lines.length !== 1 ? 's' : ''}`,
    data: shop.raw,
    matchedFields: ['name'],
    route: CATEGORY_ROUTES.shop,
    score: 0,
  };
}

/**
 * Build search result for a line
 */
function buildLineResult(
  line: NormalizedLine,
  shop: NormalizedShop,
  shopIndex: number,
  lineIndex: number
): SearchResult {
  return {
    id: `line-${shopIndex}-${lineIndex}`,
    category: 'line',
    title: line.name,
    subtitle: `Shop: ${shop.name}${line.taktMn ? ` | Takt: ${line.taktMn}` : ''}`,
    data: line.raw,
    matchedFields: ['name', 'shop'],
    route: CATEGORY_ROUTES.line,
    score: 0,
  };
}

/**
 * Build search result for a station
 */
function buildStationResult(
  station: NormalizedStation,
  line: NormalizedLine,
  shop: NormalizedShop,
  shopIndex: number,
  lineIndex: number,
  stationIndex: number
): SearchResult {
  const statusParts: string[] = [];
  if (station.occupied) statusParts.push('Ocupada');
  else statusParts.push('Livre');
  if (station.isStopped) statusParts.push('Parada');

  return {
    id: `station-${shopIndex}-${lineIndex}-${stationIndex}`,
    category: 'station',
    title: station.name,
    subtitle: `${shop.name} - ${line.name} | ${statusParts.join(' | ')}`,
    description: station.isStopped && station.stopReason ? station.stopReason : undefined,
    data: station.raw,
    matchedFields: ['name', 'shop', 'line'],
    route: CATEGORY_ROUTES.station,
    score: 0,
  };
}

/**
 * Build complete search index from simulator state
 */
export function buildSearchIndex(state: SimulatorState): SearchIndex {
  const index: SearchIndex = {
    shops: [],
    lines: [],
    stations: [],
    buffers: [],
    cars: [],
    oee: [],
    stops: [],
    mttr: [],
  };

  // Get normalized plant
  const plant: NormalizedPlant | null = state.getNormalizedPlant();
  if (plant) {
    // Index Shops, Lines, Stations from plant hierarchy
    plant.shops.forEach((shop, shopIndex) => {
      index.shops.push(buildShopResult(shop, shopIndex));

      shop.lines.forEach((line, lineIndex) => {
        index.lines.push(buildLineResult(line, shop, shopIndex, lineIndex));

        line.stations.forEach((station, stationIndex) => {
          index.stations.push(
            buildStationResult(station, line, shop, shopIndex, lineIndex, stationIndex)
          );
        });
      });
    });
  }

  // Index Buffers
  state.buffersState.forEach((buffer) => {
    const statusText = buffer.status || 'N/A';
    const percentFull = buffer.capacity > 0
      ? Math.round((buffer.currentCount / buffer.capacity) * 100)
      : 0;

    index.buffers.push({
      id: buffer.id,
      category: 'buffer',
      title: buffer.id,
      subtitle: `${buffer.from} → ${buffer.to} | ${buffer.currentCount}/${buffer.capacity} (${percentFull}%)`,
      description: `Tipo: ${buffer.type} | Status: ${statusText}`,
      data: buffer,
      matchedFields: ['id', 'from', 'to', 'type', 'status'],
      route: CATEGORY_ROUTES.buffer,
      score: 0,
    });
  });

  // Index Cars
  Object.values(state.carsById).forEach((car) => {
    const statusParts: string[] = [];
    if (car.hasDefect) statusParts.push('Defeito');
    if (car.inRework) statusParts.push('Retrabalho');

    index.cars.push({
      id: car.id,
      category: 'car',
      title: `Carro #${car.sequenceNumber}`,
      subtitle: `ID: ${car.id} | Modelo: ${car.model} | Cor: ${car.color.join(', ')}`,
      description: statusParts.length > 0 ? statusParts.join(' | ') : undefined,
      data: car,
      matchedFields: ['id', 'sequenceNumber', 'model', 'color'],
      route: CATEGORY_ROUTES.car,
      score: 0,
    });
  });

  // Index OEE
  state.oeeState.forEach((oee) => {
    const oeeFormatted = oee.oee.toFixed(1);
    const jphFormatted = Math.round(oee.jph);

    index.oee.push({
      id: `oee-${oee.shop}-${oee.line}`,
      category: 'oee',
      title: `OEE ${oee.line}`,
      subtitle: `Shop: ${oee.shop} | OEE: ${oeeFormatted}% | JPH: ${jphFormatted}`,
      description: `Producao: ${oee.carsProduction} carros`,
      data: oee,
      matchedFields: ['shop', 'line'],
      route: CATEGORY_ROUTES.oee,
      score: 0,
    });
  });

  // Index Stops
  state.stopsState.forEach((stop) => {
    const statusLabel =
      stop.status === 'IN_PROGRESS' ? 'Em Andamento' :
      stop.status === 'COMPLETED' ? 'Finalizada' :
      stop.status === 'PLANNED' ? 'Planejada' : stop.status;

    index.stops.push({
      id: `stop-${stop.id}`,
      category: 'stop',
      title: `Parada - ${stop.station}`,
      subtitle: `${stop.shop} - ${stop.line} | ${statusLabel}`,
      description: stop.reason,
      data: stop,
      matchedFields: ['shop', 'line', 'station', 'reason', 'type', 'category'],
      route: CATEGORY_ROUTES.stop,
      score: 0,
    });
  });

  // Index MTTR/MTBF
  state.mttrMtbfState.forEach((mttr) => {
    const mttrFormatted = mttr.mttr.toFixed(1);
    const mtbfFormatted = mttr.mtbf.toFixed(1);

    index.mttr.push({
      id: `mttr-${mttr.shop}-${mttr.line}-${mttr.station}`,
      category: 'mttr',
      title: mttr.station,
      subtitle: `${mttr.shop} - ${mttr.line}`,
      description: `MTTR: ${mttrFormatted} min | MTBF: ${mtbfFormatted} min`,
      data: mttr,
      matchedFields: ['shop', 'line', 'station'],
      route: CATEGORY_ROUTES.mttr,
      score: 0,
    });
  });

  return index;
}

/**
 * Filter and score results based on search term
 */
export function filterResults(
  index: SearchIndex,
  searchTerm: string
): SearchResult[] {
  if (!searchTerm.trim()) {
    // Return all results when no search term (limited to prevent overwhelming)
    const allResults: SearchResult[] = [];
    Object.values(index).forEach((items) => {
      allResults.push(...items.slice(0, 10)); // Limit per category when showing all
    });
    return allResults;
  }

  const normalized = normalizeSearchTerm(searchTerm);
  const results: SearchResult[] = [];

  // Search each category
  Object.values(index).forEach((items: SearchResult[]) => {
    items.forEach((item: SearchResult) => {
      let maxScore = 0;
      const matched: string[] = [];

      // Check title and subtitle (most important)
      if (matchesSearch(item.title, normalized)) {
        const score = calculateScore(item.title, normalized);
        maxScore = Math.max(maxScore, score);
        matched.push('title');
      }
      if (matchesSearch(item.subtitle, normalized)) {
        const score = calculateScore(item.subtitle || '', normalized);
        maxScore = Math.max(maxScore, score * 0.8); // Slightly lower weight for subtitle
        matched.push('subtitle');
      }
      if (matchesSearch(item.description, normalized)) {
        const score = calculateScore(item.description || '', normalized);
        maxScore = Math.max(maxScore, score * 0.6); // Lower weight for description
        matched.push('description');
      }

      // Check data fields (with proper type guard)
      const data = item.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const dataRecord = data as Record<string, unknown>;
        item.matchedFields.forEach((field: string) => {
          const value = dataRecord[field];
          if (matchesSearch(value, normalized)) {
            const score = calculateScore(String(value), normalized);
            maxScore = Math.max(maxScore, score * 0.7);
            if (!matched.includes(field)) matched.push(field);
          }
        });
      }

      if (maxScore > 0) {
        results.push({
          ...item,
          score: maxScore,
          matchedFields: matched,
        });
      }
    });
  });

  // Sort by score (descending)
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Group results by category
 */
export function groupResultsByCategory(
  results: SearchResult[]
): Record<SearchCategory, SearchResult[]> {
  const groups: Record<SearchCategory, SearchResult[]> = {
    shop: [],
    line: [],
    station: [],
    buffer: [],
    car: [],
    oee: [],
    stop: [],
    mttr: [],
  };

  results.forEach((result) => {
    groups[result.category].push(result);
  });

  return groups;
}
