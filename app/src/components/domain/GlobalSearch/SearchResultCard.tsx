'use client';

import * as React from 'react';
import {
  Factory,
  GitBranch,
  Square,
  Box,
  Car,
  Gauge,
  AlertTriangle,
  Clock,
  ExternalLink,
  X,
  LucideIcon,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Separator } from '@/src/components/ui/separator';
import type { SearchResult, SearchCategory } from '@/src/types/search';
import { CATEGORY_LABELS } from '@/src/types/search';
import { cn } from '@/src/lib/utils';

interface SearchResultCardProps {
  result: SearchResult;
  onNavigate: (route: string) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<SearchCategory, LucideIcon> = {
  shop: Factory,
  line: GitBranch,
  station: Square,
  buffer: Box,
  car: Car,
  oee: Gauge,
  stop: AlertTriangle,
  mttr: Clock,
};

const CATEGORY_COLORS: Record<SearchCategory, string> = {
  shop: 'bg-info/20 text-info border-info/30',
  line: 'bg-info/20 text-info border-info/30',
  station: 'bg-secondary text-secondary-foreground',
  buffer: 'bg-warning/20 text-warning border-warning/30',
  car: 'bg-primary/20 text-primary border-primary/30',
  oee: 'bg-success/20 text-success border-success/30',
  stop: 'bg-destructive/20 text-destructive border-destructive/30',
  mttr: 'bg-muted text-muted-foreground',
};

// Field labels in Portuguese
const FIELD_LABELS: Record<string, string> = {
  // Common
  id: 'ID',
  name: 'Nome',
  shop: 'Shop',
  line: 'Linha',
  station: 'Estacao',
  status: 'Status',
  type: 'Tipo',
  timestamp: 'Timestamp',

  // Shop/Line/Station
  taktMn: 'Takt (min)',
  taktSg: 'Takt (seg)',
  taktTime: 'Tempo Takt',
  occupied: 'Ocupada',
  isStopped: 'Parada',
  stopReason: 'Motivo Parada',
  currentCar: 'Carro Atual',
  currentCarId: 'ID Carro',
  isFirstStation: 'Primeira Estacao',
  isLastStation: 'Ultima Estacao',
  index: 'Indice',

  // Buffer
  from: 'Origem',
  to: 'Destino',
  capacity: 'Capacidade',
  currentCount: 'Quantidade Atual',
  carIds: 'IDs dos Carros',
  betweenShopOrLine: 'Entre',

  // Car
  sequenceNumber: 'Numero Sequencial',
  model: 'Modelo',
  color: 'Cor',
  createdAt: 'Criado em',
  completedAt: 'Completado em',
  hasDefect: 'Tem Defeito',
  defects: 'Defeitos',
  inRework: 'Em Retrabalho',
  reworkEnteredAt: 'Entrou Retrabalho',
  reworkCompletedAt: 'Saiu Retrabalho',
  trace: 'Rastro',
  shopLeadtimes: 'Lead Times',
  totalLeadtimeMs: 'Lead Time Total (ms)',
  isPart: 'E Peca',
  partName: 'Nome da Peca',

  // OEE
  oee: 'OEE (%)',
  jph: 'JPH',
  carsProduction: 'Carros Produzidos',
  productionTime: 'Tempo Producao',
  diffTime: 'Diff Time',
  date: 'Data',

  // Stop
  reason: 'Motivo',
  start_time: 'Inicio',
  end_time: 'Fim',
  severity: 'Severidade',
  category: 'Categoria',
  durationMs: 'Duracao (ms)',

  // MTTR/MTBF
  mttr: 'MTTR (min)',
  mtbf: 'MTBF (min)',
};

// Fields to skip (internal or redundant)
const SKIP_FIELDS = new Set([
  'raw',
  'metadata',
  '__v',
  '_id',
]);

// Fields that are timestamps (to format)
const TIMESTAMP_FIELDS = new Set([
  'timestamp',
  'createdAt',
  'completedAt',
  'start_time',
  'end_time',
  'reworkEnteredAt',
  'reworkCompletedAt',
]);

function formatValue(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Boolean
  if (typeof value === 'boolean') {
    return (
      <Badge variant={value ? 'success' : 'outline'} className="text-xs">
        {value ? 'Sim' : 'Nao'}
      </Badge>
    );
  }

  // Timestamp
  if (TIMESTAMP_FIELDS.has(key) && typeof value === 'number') {
    const date = new Date(value);
    return (
      <span className="font-mono text-xs">
        {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR')}
      </span>
    );
  }

  // Array
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">-</span>;
    }

    // Simple array of strings/numbers
    if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {String(v)}
            </Badge>
          ))}
        </div>
      );
    }

    // Complex array (objects)
    return (
      <span className="text-xs text-muted-foreground">
        {value.length} item{value.length !== 1 ? 's' : ''}
      </span>
    );
  }

  // Object
  if (typeof value === 'object') {
    return (
      <span className="text-xs text-muted-foreground">
        Objeto
      </span>
    );
  }

  // Number (format)
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return <span className="font-mono">{value.toLocaleString('pt-BR')}</span>;
    }
    return <span className="font-mono">{value.toFixed(2)}</span>;
  }

  // String
  return <span>{String(value)}</span>;
}

function FieldRow({ label, value, fieldKey }: { label: string; value: unknown; fieldKey: string }) {
  if (value === null || value === undefined) return null;
  if (SKIP_FIELDS.has(fieldKey)) return null;
  if (typeof value === 'object' && !Array.isArray(value)) return null;

  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-2 items-start">
      <div className="text-sm font-medium text-muted-foreground truncate">
        {FIELD_LABELS[fieldKey] || label}
      </div>
      <div className="text-sm">{formatValue(fieldKey, value)}</div>
    </div>
  );
}

// Priority fields for sorting (defined outside component)
const PRIORITY_FIELDS = ['id', 'name', 'shop', 'line', 'station', 'status', 'type'];

export function SearchResultCard({ result, onNavigate, onClose }: SearchResultCardProps) {
  const Icon = CATEGORY_ICONS[result.category];

  // Get sorted field entries (prioritize common fields)
  const fieldEntries = React.useMemo(() => {
    const data = result.data;
    // Type guard for data
    if (!data || typeof data !== 'object' || Array.isArray(data)) return [];

    const dataRecord = data as Record<string, unknown>;
    const entries = Object.entries(dataRecord);

    return entries.sort(([keyA], [keyB]) => {
      const priorityA = PRIORITY_FIELDS.indexOf(keyA);
      const priorityB = PRIORITY_FIELDS.indexOf(keyB);

      if (priorityA !== -1 && priorityB !== -1) return priorityA - priorityB;
      if (priorityA !== -1) return -1;
      if (priorityB !== -1) return 1;
      return keyA.localeCompare(keyB);
    });
  }, [result.data]);

  return (
    <Card className="border-0 shadow-none flex flex-col h-full max-h-[calc(90vh-48px)] p-6">
      {/* Fixed Header */}
      <CardHeader className="pb-4 flex-shrink-0 p-0">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex items-center justify-center h-12 w-12 rounded-xl border',
              CATEGORY_COLORS[result.category]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className={cn('text-xs', CATEGORY_COLORS[result.category])}
              >
                {CATEGORY_LABELS[result.category]}
              </Badge>
            </div>
            <CardTitle className="text-xl">{result.title}</CardTitle>
            {result.subtitle && (
              <CardDescription className="mt-1">{result.subtitle}</CardDescription>
            )}
            {result.description && (
              <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Scrollable Content */}
      <CardContent className="pt-0 px-0 flex-1 min-h-0 overflow-hidden">
        <Separator className="mb-4" />
        <ScrollArea className="h-full pr-4">
          <div className="space-y-0 pb-2">
            {fieldEntries.map(([key, value]) => (
              <React.Fragment key={key}>
                <FieldRow label={key} value={value} fieldKey={key} />
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Fixed Footer */}
      <CardFooter className="flex gap-2 pt-4 px-0 pb-0 border-t flex-shrink-0">
        <Button onClick={() => onNavigate(result.route)} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Ir para Pagina
        </Button>
        <Button variant="outline" onClick={onClose} className="gap-2">
          <X className="h-4 w-4" />
          Fechar
        </Button>
      </CardFooter>
    </Card>
  );
}
