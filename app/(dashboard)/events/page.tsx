'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Factory,
  GitBranch,
  CircuitBoard,
  Filter,
  X,
  RefreshCw,
  Activity,
  Car,
  Clock,
  Zap,
} from 'lucide-react';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Label } from '@/src/components/ui/label';
import { StatsCard, DataTable, EventTypeBadge } from '@/src/components/data-display';
import { DetailsDrawer } from '@/src/components/domain';
import { EmptyState } from '@/src/components/feedback';
import { usePaginatedEvents, EventFilters } from '@/src/hooks/useEventsQuery';
import { formatEpochMs } from '@/src/utils/timeFormat';
import { parseDateTimeLocal } from '@/src/utils/date';
import { uniqStrings } from '@/src/utils/safe';

type EventRow = Record<string, unknown> & {
  id?: string | number;
  carId?: string;
  car_id?: string;
  eventType?: string;
  event_type?: string;
  shop?: string;
  line?: string;
  station?: string;
  timestamp?: number;
};

type Filters = {
  carId: string;
  eventType: string;
  shop: string;
  line: string;
  station: string;
  timeFrom: string;
  timeTo: string;
};

function uniq(values: Array<string | undefined | null>): string[] {
  return uniqStrings(values);
}

function getCarId(e: EventRow): string {
  return String(e.carId ?? e.car_id ?? '');
}

function getEventType(e: EventRow): string {
  return String(e.eventType ?? e.event_type ?? '');
}

function getTimestamp(e: EventRow): number {
  return typeof e.timestamp === 'number' && Number.isFinite(e.timestamp) ? e.timestamp : 0;
}

const initialFilters: Filters = {
  carId: '',
  eventType: '',
  shop: '',
  line: '',
  station: '',
  timeFrom: '',
  timeTo: '',
};

// Movido para fora do componente para evitar re-criação a cada render
const filterFields = [
  { key: 'carId', label: 'Carro', icon: Car },
  { key: 'eventType', label: 'Tipo de Evento', icon: Zap },
  { key: 'shop', label: 'Shop', icon: Factory },
  { key: 'line', label: 'Linha', icon: GitBranch },
  { key: 'station', label: 'Estacao', icon: CircuitBoard },
] as const;

export default function EventsPage() {
  // Local UI state
  const [filters, setFilters] = React.useState<Filters>(initialFilters);
  const [selection, setSelection] = React.useState<EventRow | null>(null);

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  // Build API filters from local filters
  const apiFilters: EventFilters = React.useMemo(() => {
    const f: EventFilters = {};
    if (filters.carId) f.car_id = filters.carId;
    if (filters.eventType) f.event_type = filters.eventType;
    if (filters.shop) f.shop = filters.shop;
    if (filters.line) f.line = filters.line;
    if (filters.station) f.station = filters.station;

    // Convert date-time filters to timestamps
    const timeFrom = parseDateTimeLocal(filters.timeFrom);
    const timeTo = parseDateTimeLocal(filters.timeTo);
    if (timeFrom !== null) f.start_time = timeFrom;
    if (timeTo !== null) f.end_time = timeTo;

    return f;
  }, [filters]);

  // React Query for data fetching with server-side pagination
  const {
    data: paginatedResult,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePaginatedEvents(apiFilters, page, pageSize);

  const events = React.useMemo(() => paginatedResult?.data ?? [], [paginatedResult?.data]);
  const pagination = paginatedResult?.pagination;

  // Derive loading state (initial load or background refetch)
  const loading = isLoading;

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [apiFilters]);

  const clearFilters = React.useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const hasActiveFilters = React.useMemo(() => {
    return Object.values(filters).some((v) => v !== '');
  }, [filters]);

  const options = React.useMemo(() => {
    // Cast events to EventRow for compatibility with helper functions
    const eventsAsRows = events as unknown as EventRow[];
    return {
      carId: uniq(eventsAsRows.map(getCarId)),
      eventType: uniq(eventsAsRows.map(getEventType)),
      shop: uniq(eventsAsRows.map((e) => (typeof e.shop === 'string' ? e.shop : null))),
      line: uniq(eventsAsRows.map((e) => (typeof e.line === 'string' ? e.line : null))),
      station: uniq(eventsAsRows.map((e) => (typeof e.station === 'string' ? e.station : null))),
    };
  }, [events]);

  // With server-side pagination, data is already filtered by the API
  // Just sort the data client-side
  const filtered = React.useMemo(() => {
    const eventsAsRows = events as unknown as EventRow[];
    const sorted = [...eventsAsRows].sort((a, b) => getTimestamp(b) - getTimestamp(a));
    return sorted;
  }, [events]);

  // Stats calculation - uses current page data for calculations
  const stats = React.useMemo(() => {
    const typeCount: Record<string, number> = {};
    for (const e of filtered) {
      const type = getEventType(e);
      typeCount[type] = (typeCount[type] || 0) + 1;
    }

    const uniqueCars = new Set(filtered.map(getCarId)).size;
    const mostCommonType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];

    return {
      total: pagination?.total ?? filtered.length,
      uniqueCars,
      mostCommonType: mostCommonType ? mostCommonType[0] : '--',
      mostCommonCount: mostCommonType ? mostCommonType[1] : 0,
    };
  }, [filtered, pagination?.total]);

  // Table columns - memoizado para evitar re-criação a cada render
  const columns = React.useMemo(() => [
    {
      key: 'carId',
      header: 'Carro',
      sortable: true,
      render: (_: unknown, row: EventRow) => getCarId(row) || '--',
    },
    {
      key: 'eventType',
      header: 'Tipo de Evento',
      sortable: true,
      render: (_: unknown, row: EventRow) => {
        const type = getEventType(row);
        return type ? <EventTypeBadge type={type} /> : '--';
      },
    },
    { key: 'shop', header: 'Shop', sortable: true },
    { key: 'line', header: 'Linha', sortable: true },
    { key: 'station', header: 'Estacao', sortable: true },
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (value: unknown) => {
        const ts = Number(value);
        return ts ? formatEpochMs(ts) : '--';
      },
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Eventos</h1>
          <Badge variant="info">API</Badge>
          <Badge variant="outline">{pagination?.total ?? 0} registros</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatsCard
          title="Total de Eventos"
          value={stats.total}
          subtitle="eventos filtrados"
          icon={Activity}
          iconColor="var(--color-info)"
        />
        <StatsCard
          title="Carros Unicos"
          value={stats.uniqueCars}
          subtitle="carros com eventos"
          icon={Car}
          iconColor="var(--color-primary)"
        />
        <StatsCard
          title="Tipo Mais Comum"
          value={stats.mostCommonType}
          subtitle={`${stats.mostCommonCount} ocorrencias`}
          icon={Zap}
          iconColor="var(--color-warning)"
        />
        <StatsCard
          title="Pagina Atual"
          value={`${page}/${pagination?.totalPages ?? 1}`}
          subtitle="paginas disponiveis"
          icon={Clock}
          iconColor="var(--color-success)"
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Filtros</h3>
              {hasActiveFilters && <Badge variant="outline">Filtros ativos</Badge>}
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {filterFields.map((field) => (
              <div key={field.key} className="space-y-1.5 min-w-[160px]">
                <Label className="text-xs">{field.label}</Label>
                <Select
                  value={(filters as Record<string, string>)[field.key] || "__all__"}
                  onValueChange={(v) => setFilters((prev) => ({ ...prev, [field.key]: v === "__all__" ? "" : v }))}
                >
                  <SelectTrigger>
                    <field.icon className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {(options as Record<string, string[]>)[field.key].map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="space-y-1.5 min-w-[200px]">
              <Label className="text-xs">Timestamp (de)</Label>
              <Input
                type="datetime-local"
                value={filters.timeFrom}
                onChange={(e) => setFilters((p) => ({ ...p, timeFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 min-w-[200px]">
              <Label className="text-xs">Timestamp (ate)</Label>
              <Input
                type="datetime-local"
                value={filters.timeTo}
                onChange={(e) => setFilters((p) => ({ ...p, timeTo: e.target.value }))}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Lista de Eventos</h3>

          {loading ? (
            <Skeleton className="h-[400px]" />
          ) : isError ? (
            <EmptyState
              type="error"
              title="Erro ao carregar"
              description={error?.message ?? 'Falha ao carregar os eventos. Verifique a conexao com a API.'}
              action={{ label: 'Tentar novamente', onClick: () => refetch() }}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              type={hasActiveFilters ? 'search' : 'no-data'}
              title={hasActiveFilters ? 'Nenhum resultado' : 'Sem dados'}
              description={
                hasActiveFilters
                  ? 'Nenhum evento corresponde aos filtros selecionados.'
                  : 'Nenhum evento registrado.'
              }
              action={
                hasActiveFilters
                  ? { label: 'Limpar Filtros', onClick: clearFilters }
                  : { label: 'Atualizar', onClick: () => refetch() }
              }
            />
          ) : (
            <DataTable
              data={filtered as unknown as Record<string, unknown>[]}
              columns={columns as { key: string; header: string; sortable?: boolean; render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode }[]}
              pageSize={pageSize}
              onRowClick={(row) => setSelection(row as unknown as EventRow)}
              emptyMessage="Nenhum evento encontrado"
              serverPagination={pagination}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </Card>
      </motion.div>

      {/* Details Drawer */}
      <DetailsDrawer
        open={Boolean(selection)}
        title={selection ? `Evento ${String(selection.id ?? '')}` : ''}
        sections={selection ? [{ title: 'Detalhes do Evento', value: selection }] : []}
        onClose={() => setSelection(null)}
      />
    </div>
  );
}
