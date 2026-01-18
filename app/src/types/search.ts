// Search types for Global Search / Command Palette

export type SearchCategory =
  | 'shop'
  | 'line'
  | 'station'
  | 'buffer'
  | 'car'
  | 'oee'
  | 'stop'
  | 'mttr';

export interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  data: unknown;
  matchedFields: string[];
  route: string;
  score: number;
}

export interface SearchIndex {
  shops: SearchResult[];
  lines: SearchResult[];
  stations: SearchResult[];
  buffers: SearchResult[];
  cars: SearchResult[];
  oee: SearchResult[];
  stops: SearchResult[];
  mttr: SearchResult[];
}

export const CATEGORY_LABELS: Record<SearchCategory, string> = {
  shop: 'Shops',
  line: 'Linhas',
  station: 'Estacoes',
  buffer: 'Buffers',
  car: 'Carros',
  oee: 'OEE',
  stop: 'Paradas',
  mttr: 'MTTR/MTBF',
};

export const CATEGORY_ROUTES: Record<SearchCategory, string> = {
  shop: '/',
  line: '/',
  station: '/',
  buffer: '/buffers',
  car: '/',
  oee: '/oee',
  stop: '/stoppages',
  mttr: '/mttr-mtbf',
};

export const CATEGORY_ORDER: SearchCategory[] = [
  'shop',
  'line',
  'station',
  'buffer',
  'car',
  'oee',
  'stop',
  'mttr',
];
