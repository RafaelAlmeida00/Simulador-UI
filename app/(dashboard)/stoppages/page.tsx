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
  AlertTriangle,
  Calendar,
  Clock,
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
import { StatsCard, DataTable, StatusBadge } from '@/src/components/data-display';
import { DetailsDrawer } from '@/src/components/domain';
import { EmptyState } from '@/src/components/feedback';
import { usePaginatedStops, StopFilters } from '@/src/hooks/useStopsQuery';
import { formatEpochMs } from '@/src/utils/timeFormat';
import { parseDateTimeLocal } from '@/src/utils/date';
import { uniqStrings } from '@/src/utils/safe';
import type { IStopLine } from '@/src/types/socket';
import { Stop } from '@/src/stores/simulatorStore';

type Filters = {
  shop: string;
  line: string;
  station: string;
  reason: string;
  severity: string;
  status: string;
  type: string;
  category: string;
  startFrom: string;
  startTo: string;
  endFrom: string;
  endTo: string;
};

function uniq(values: Array<string | undefined | null>): string[] {
  return uniqStrings(values);
}

function getStartTime(stop: IStopLine): number {
  return stop.start_time ?? 0;
}

function getEndTime(stop: IStopLine): number {
  return stop.end_time ?? 0;
}

const initialFilters: Filters = {
  shop: '',
  line: '',
  station: '',
  reason: '',
  severity: '',
  status: '',
  type: '',
  category: '',
  startFrom: '',
  startTo: '',
  endFrom: '',
  endTo: '',
};

// Movido para fora do componente para evitar re-criação a cada render
const filterFields = [
  { key: 'shop', label: 'Shop', icon: Factory },
  { key: 'line', label: 'Linha', icon: GitBranch },
  { key: 'station', label: 'Estacao', icon: CircuitBoard },
  { key: 'reason', label: 'Motivo', icon: AlertTriangle },
  { key: 'severity', label: 'Severidade', icon: AlertTriangle },
  { key: 'status', label: 'Status', icon: Clock },
  { key: 'type', label: 'Tipo', icon: AlertTriangle },
  { key: 'category', label: 'Categoria', icon: Factory },
] as const;

export default function StoppagesPage() {
  // Local UI state
  const [filters, setFilters] = React.useState<Filters>(initialFilters);
  const [selection, setSelection] = React.useState<Stop | null>(null);

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  // Build API filters from local filters
  const apiFilters: StopFilters = React.useMemo(() => {
    const f: StopFilters = {};
    if (filters.shop) f.shop = filters.shop;
    if (filters.line) f.line = filters.line;
    if (filters.station) f.station = filters.station;
    if (filters.severity) f.severity = filters.severity;
    if (filters.status) f.status = filters.status;
    if (filters.type) f.type = filters.type;

    // Convert date-time filters to timestamps
    const startFrom = parseDateTimeLocal(filters.startFrom);
    const endTo = parseDateTimeLocal(filters.endTo);
    if (startFrom !== null) f.start_time = startFrom;
    if (endTo !== null) f.end_time = endTo;

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
  } = usePaginatedStops(apiFilters, page, pageSize);

  const stops = React.useMemo(() => paginatedResult?.data ?? [], [paginatedResult?.data]);
  const pagination = paginatedResult?.pagination;

  // Derive loading state
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
    // Cast stops for compatibility
    const stopsAsLocal = stops as unknown as Stop[];
    return {
      shop: uniq(stopsAsLocal.map((s) => s.shop)),
      line: uniq(stopsAsLocal.map((s) => s.line)),
      station: uniq(stopsAsLocal.map((s) => s.station)),
      reason: uniq(stopsAsLocal.map((s) => s.reason)),
      severity: uniq(stopsAsLocal.map((s) => s.severity as string)),
      status: uniq(stopsAsLocal.map((s) => s.status as string)),
      type: uniq(stopsAsLocal.map((s) => s.type)),
      category: uniq(stopsAsLocal.map((s) => s.category)),
    };
  }, [stops]);

  // With server-side pagination, data is already filtered by the API
  // Only apply client-side filters that the API doesn't support (reason, category, startTo, endFrom)
  const filtered = React.useMemo(() => {
    const startTo = parseDateTimeLocal(filters.startTo);
    const endFrom = parseDateTimeLocal(filters.endFrom);
    const stopsAsLocal = stops as unknown as Stop[];

    // Only apply additional client-side filters not handled by API
    const matches = (s: Stop) => {
      if (filters.reason && s.reason !== filters.reason) return false;
      if (filters.category && String(s.category ?? '') !== filters.category) return false;

      const st = getStartTime(s);
      const et = getEndTime(s);

      // Additional time range filters not in API
      if (startTo !== null && st > startTo) return false;
      if (endFrom !== null && et < endFrom) return false;

      return true;
    };

    const next = stopsAsLocal.filter(matches);
    next.sort((a, b) => getStartTime(b) - getStartTime(a));
    return next;
  }, [stops, filters.reason, filters.category, filters.startTo, filters.endFrom]);

  // Stats calculation - uses current page data for calculations
  const stats = React.useMemo(() => {
    const totalDuration = filtered.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);
    const avgDuration = filtered.length > 0 ? totalDuration / filtered.length : 0;
    const randomStops = filtered.filter((s) => s.type === 'RANDOM_GENERATE').length;
    const plannedStops = filtered.filter((s) => s.type === 'PLANNED').length;

    return {
      total: pagination?.total ?? filtered.length,
      totalDurationMin: Math.round(totalDuration / 60000),
      avgDurationMin: Math.round(avgDuration / 60000),
      randomStops,
      plannedStops,
    };
  }, [filtered, pagination?.total]);

  // Table columns - memoizado para evitar re-criação a cada render
  const columns = React.useMemo(() => [
    { key: 'shop', header: 'Shop', sortable: true },
    { key: 'line', header: 'Linha', sortable: true },
    { key: 'station', header: 'Estacao', sortable: true },
    { key: 'reason', header: 'Motivo', sortable: true },
    {
      key: 'severity',
      header: 'Severidade',
      sortable: true,
      render: (value: unknown) => {
        const severity = String(value ?? '').toLowerCase();
        return <StatusBadge status={severity || 'info'} label={String(value ?? '--')} />;
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (value: unknown) => {
        const status = String(value ?? '').toLowerCase();
        return <StatusBadge status={status || 'pending'} label={String(value ?? '--')} />;
      },
    },
    {
      key: 'type',
      header: 'Tipo',
      sortable: true,
      render: (value: unknown) => (
        <StatusBadge
          status={String(value) === 'RANDOM_GENERATE' ? 'error' : 'info'}
          label={String(value ?? '--')}
        />
      ),
    },
    { key: 'category', header: 'Categoria', sortable: true },
    {
      key: 'start_time',
      header: 'Inicio',
      sortable: true,
      render: (value: unknown) => formatEpochMs(Number(value)) ?? '--',
    },
    {
      key: 'end_time',
      header: 'Fim',
      sortable: true,
      render: (value: unknown) => (value ? formatEpochMs(Number(value)) : '--'),
    },
    {
      key: 'durationMs',
      header: 'Duracao',
      sortable: true,
      render: (value: unknown) => {
        const ms = Number(value ?? 0);
        const minutes = Math.round(ms / 60000);
        return `${minutes} min`;
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
          <h1 className="text-2xl font-bold">Paradas</h1>
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
          title="Total de Paradas"
          value={stats.total}
          subtitle="paradas filtradas"
          icon={AlertTriangle}
          iconColor="var(--color-warning)"
        />
        <StatsCard
          title="Duracao Total"
          value={`${stats.totalDurationMin} min`}
          subtitle="tempo parado"
          icon={Clock}
          iconColor="var(--color-info)"
        />
        <StatsCard
          title="Paradas Aleatorias"
          value={stats.randomStops}
          subtitle="geradas aleatoriamente"
          icon={AlertTriangle}
          iconColor="var(--color-destructive)"
        />
        <StatsCard
          title="Paradas Planejadas"
          value={stats.plannedStops}
          subtitle="programadas"
          icon={Calendar}
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
              <Label className="text-xs">Inicio (de)</Label>
              <Input
                type="datetime-local"
                value={filters.startFrom}
                onChange={(e) => setFilters((p) => ({ ...p, startFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 min-w-[200px]">
              <Label className="text-xs">Inicio (ate)</Label>
              <Input
                type="datetime-local"
                value={filters.startTo}
                onChange={(e) => setFilters((p) => ({ ...p, startTo: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 min-w-[200px]">
              <Label className="text-xs">Fim (de)</Label>
              <Input
                type="datetime-local"
                value={filters.endFrom}
                onChange={(e) => setFilters((p) => ({ ...p, endFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 min-w-[200px]">
              <Label className="text-xs">Fim (ate)</Label>
              <Input
                type="datetime-local"
                value={filters.endTo}
                onChange={(e) => setFilters((p) => ({ ...p, endTo: e.target.value }))}
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
          <h3 className="text-sm font-semibold mb-3">Lista de Paradas</h3>

          {loading ? (
            <Skeleton className="h-[400px]" />
          ) : isError ? (
            <EmptyState
              type="error"
              title="Erro ao carregar"
              description={error?.message ?? 'Falha ao carregar os dados de paradas. Verifique a conexao com a API.'}
              action={{ label: 'Tentar novamente', onClick: () => refetch() }}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              type={hasActiveFilters ? 'search' : 'no-data'}
              title={hasActiveFilters ? 'Nenhum resultado' : 'Sem dados'}
              description={
                hasActiveFilters
                  ? 'Nenhuma parada corresponde aos filtros selecionados.'
                  : 'Nenhuma parada registrada.'
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
              onRowClick={(row) => setSelection(row as unknown as Stop)}
              emptyMessage="Nenhuma parada encontrada"
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
        title={selection ? `Parada ${String((selection as unknown as Record<string, unknown>).id ?? '')}` : ''}
        sections={selection ? [{ title: 'Detalhes da Parada', value: selection }] : []}
        onClose={() => setSelection(null)}
      />
    </div>
  );
}
