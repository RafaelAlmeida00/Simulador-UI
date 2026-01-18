'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Factory,
  GitBranch,
  CircuitBoard,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Timer,
  Zap,
} from 'lucide-react';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Progress } from '@/src/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Label } from '@/src/components/ui/label';
import { StatsCard, DataTable } from '@/src/components/data-display';
import { DetailsDrawer } from '@/src/components/domain';
import { EmptyState } from '@/src/components/feedback';
import http from '@/src/utils/http';
import { getSocket } from '@/src/utils/socket';
import { normalizePlantSnapshot } from '@/src/utils/plantNormalize';
import { formatEpochMs } from '@/src/utils/timeFormat';
import { ymdFromEpochMs } from '@/src/utils/date';
import { asArrayFromPayload, uniqStrings } from '@/src/utils/safe';
import type { IStopLine, MTTRMTBFData } from '@/src/types/socket';
import { useSimulatorSelector } from '@/src/hooks/useSimulatorStore';
import { cn } from '@/src/lib/utils';

function todayStr(epochMs: number): string {
  return ymdFromEpochMs(epochMs);
}

function uniq(values: Array<string | undefined | null>): string[] {
  return uniqStrings(values);
}

function asArray<T>(payload: unknown): T[] {
  return asArrayFromPayload<T>(payload);
}

function getEndTime(stop: IStopLine): number {
  return stop.end_time ?? 0;
}

type MttrMtbfRecord = MTTRMTBFData & {
  id?: number;
  total_failures?: number;
  total_repair_time?: number;
  total_uptime?: number;
};

type StationRow = {
  shop: string;
  line: string;
  station: string;
  lastStopEndTime: number | null;
  mtbf: number;
  percentUntilMtbf: number;
};

function MtbfStatusIcon({ percentage }: { percentage: number }) {
  if (percentage <= 20) {
    return <CheckCircle className="h-5 w-5 text-success" />;
  }
  if (percentage <= 50) {
    return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
  }
  if (percentage <= 70) {
    return <AlertTriangle className="h-5 w-5 text-warning" />;
  }
  return <XCircle className="h-5 w-5 text-destructive" />;
}

function MtbfStatusBadge({ percentage }: { percentage: number }) {
  if (percentage <= 20) {
    return <Badge variant="success">OK</Badge>;
  }
  if (percentage <= 50) {
    return <Badge variant="outline">Normal</Badge>;
  }
  if (percentage <= 70) {
    return <Badge variant="warning">Atencao</Badge>;
  }
  return <Badge variant="destructive">Critico</Badge>;
}

export default function MttrMtbfPage() {
  React.useEffect(() => {
    getSocket();
  }, []);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const plantState = useSimulatorSelector((s) => s.plantState?.data);
  const healthSimMs = useSimulatorSelector((s) => s.health?.data?.simulatorTimestamp);
  const simNowMs = mounted ? (healthSimMs ?? Date.now()) : null;
  const simToday = React.useMemo(
    () => (typeof simNowMs === 'number' ? todayStr(simNowMs) : ''),
    [simNowMs]
  );

  const [filterDate, setFilterDate] = React.useState('');
  const [filterShop, setFilterShop] = React.useState('');
  const [filterLine, setFilterLine] = React.useState('');
  const [filterStation, setFilterStation] = React.useState('');

  const lastAutoDateRef = React.useRef(simToday);
  React.useEffect(() => {
    if (simToday && filterDate === lastAutoDateRef.current && simToday !== lastAutoDateRef.current) {
      setFilterDate(simToday);
    }
    lastAutoDateRef.current = simToday;
  }, [simToday, filterDate]);

  const plant = React.useMemo(() => normalizePlantSnapshot(plantState), [plantState]);
  const shopOptions = React.useMemo(() => uniq(plant.shops.map((s) => s.name)), [plant.shops]);
  const lineOptions = React.useMemo(() => {
    if (!filterShop) {
      return uniq(plant.shops.flatMap((s) => s.lines.map((l) => l.name)));
    }
    const shop = plant.shops.find((s) => s.name === filterShop);
    return shop ? uniq(shop.lines.map((l) => l.name)) : [];
  }, [plant.shops, filterShop]);
  const stationOptions = React.useMemo(() => {
    const stations: string[] = [];
    for (const shop of plant.shops) {
      if (filterShop && shop.name !== filterShop) continue;
      for (const line of shop.lines) {
        if (filterLine && line.name !== filterLine) continue;
        for (const station of line.stations) {
          stations.push(station.name);
        }
      }
    }
    return uniq(stations);
  }, [plant.shops, filterShop, filterLine]);

  const [loading, setLoading] = React.useState(false);
  const [mttrMtbfData, setMttrMtbfData] = React.useState<MttrMtbfRecord[]>([]);
  const [stopsLoading, setStopsLoading] = React.useState(false);
  const [stops, setStops] = React.useState<IStopLine[]>([]);

  const simTimestamp = healthSimMs ?? Date.now();

  // Fetch MTTR/MTBF data
  React.useEffect(() => {
    if (!filterDate) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { date: filterDate };
        if (filterShop) params.shop = filterShop;
        if (filterLine) params.line = filterLine;
        if (filterStation) params.station = filterStation;

        const res = await http.get('/mttr-mtbf', { params });
        if (!cancelled) setMttrMtbfData(asArray<MttrMtbfRecord>(res.data));
      } catch {
        if (!cancelled) setMttrMtbfData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterDate, filterShop, filterLine, filterStation]);

  // Fetch stops
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setStopsLoading(true);
      try {
        const params: Record<string, string> = { status: 'COMPLETED' };
        if (filterShop) params.shop = filterShop;
        if (filterLine) params.line = filterLine;
        if (filterStation) params.station = filterStation;

        const res = await http.get('/stops', { params });
        if (!cancelled) setStops(asArray<IStopLine>(res.data));
      } catch {
        if (!cancelled) setStops([]);
      } finally {
        if (!cancelled) setStopsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterShop, filterLine, filterStation]);

  // Calculate averages
  const { avgMttr, avgMtbf } = React.useMemo(() => {
    if (mttrMtbfData.length === 0) return { avgMttr: 0, avgMtbf: 0 };

    let totalMttr = 0;
    let totalMtbf = 0;
    let countMttr = 0;
    let countMtbf = 0;

    for (const r of mttrMtbfData) {
      if (typeof r.mttr === 'number' && r.mttr > 0) {
        totalMttr += r.mttr;
        countMttr++;
      }
      if (typeof r.mtbf === 'number' && r.mtbf > 0) {
        totalMtbf += r.mtbf;
        countMtbf++;
      }
    }

    return {
      avgMttr: countMttr > 0 ? totalMttr / countMttr : 0,
      avgMtbf: countMtbf > 0 ? totalMtbf / countMtbf : 0,
    };
  }, [mttrMtbfData]);

  // Build station rows
  const stationRows = React.useMemo((): StationRow[] => {
    const stationMap = new Map<string, { shop: string; line: string; station: string; lastEnd: number }>();

    for (const s of stops) {
      const { shop, line, station, status, type } = s;
      const endTime = getEndTime(s);

      if (!station || status !== 'COMPLETED' || type !== 'RANDOM_GENERATE') continue;

      const key = `${shop}::${line}::${station}`;
      const existing = stationMap.get(key);

      if (!existing || endTime > existing.lastEnd) {
        stationMap.set(key, { shop, line, station, lastEnd: endTime });
      }
    }

    const rows: StationRow[] = [];

    for (const [, data] of stationMap) {
      const mtbfRecord = mttrMtbfData.find(
        (r) => r.shop === data.shop && r.line === data.line && r.station === data.station
      );

      const mtbfMinutes = mtbfRecord?.mtbf ?? 0;
      const mtbfMs = mtbfMinutes * 60 * 1000;

      let percentUntilMtbf = 0;
      if (mtbfMs > 0 && data.lastEnd > 0) {
        const timeSinceLastStop = simTimestamp - data.lastEnd;
        percentUntilMtbf = Math.min(100, (timeSinceLastStop / mtbfMs) * 100);
      }

      rows.push({
        shop: data.shop,
        line: data.line,
        station: data.station,
        lastStopEndTime: data.lastEnd || null,
        mtbf: mtbfMinutes,
        percentUntilMtbf,
      });
    }

    rows.sort((a, b) => b.percentUntilMtbf - a.percentUntilMtbf);

    return rows;
  }, [stops, mttrMtbfData, simTimestamp]);

  const [selection, setSelection] = React.useState<StationRow | null>(null);

  const hasActiveFilters = filterShop !== '' || filterLine !== '' || filterStation !== '';

  const clearFilters = () => {
    setFilterShop('');
    setFilterLine('');
    setFilterStation('');
  };

  // Generate date options
  const dateOptions = React.useMemo(() => {
    if (!simNowMs) return [];
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(simNowMs);
      d.setDate(d.getDate() - i);
      return todayStr(d.getTime());
    });
  }, [simNowMs]);

  // Table columns
  const columns = [
    { key: 'shop', header: 'Shop', sortable: true },
    { key: 'line', header: 'Linha', sortable: true },
    { key: 'station', header: 'Estacao', sortable: true },
    {
      key: 'lastStopEndTime',
      header: 'Ultima Parada',
      sortable: true,
      render: (value: unknown) => (value ? formatEpochMs(Number(value)) : '--'),
    },
    {
      key: 'mtbf',
      header: 'MTBF (min)',
      sortable: true,
      render: (value: unknown) => (Number(value) > 0 ? Number(value).toFixed(1) : '--'),
    },
    {
      key: 'percentUntilMtbf',
      header: '% ate MTBF',
      sortable: true,
      render: (value: unknown, row: StationRow) => (
        <div className="flex items-center gap-2">
          <Progress
            value={Number(value)}
            className="w-16 h-2"
            indicatorClassName={cn(
              Number(value) <= 20
                ? 'bg-success'
                : Number(value) <= 50
                ? 'bg-muted-foreground'
                : Number(value) <= 70
                ? 'bg-warning'
                : 'bg-destructive'
            )}
          />
          <span className="text-xs">{Number(value).toFixed(1)}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: unknown, row: StationRow) => <MtbfStatusBadge percentage={row.percentUntilMtbf} />,
    },
  ];

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[60px] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[150px] rounded-xl" />
          <Skeleton className="h-[150px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <h1 className="text-2xl font-bold">MTTR / MTBF</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{stationRows.length} estacoes</span>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Filtros</h3>
              {hasActiveFilters && (
                <Badge variant="outline">Filtros ativos</Badge>
              )}
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5 min-w-[160px]">
              <Label className="text-xs">Data</Label>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger>
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {dateOptions.map((date) => (
                    <SelectItem key={date} value={date}>
                      {date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 min-w-[160px]">
              <Label className="text-xs">Shop</Label>
              <Select value={filterShop || "__all__"} onValueChange={(v) => setFilterShop(v === "__all__" ? "" : v)}>
                <SelectTrigger>
                  <Factory className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {shopOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 min-w-[160px]">
              <Label className="text-xs">Linha</Label>
              <Select value={filterLine || "__all__"} onValueChange={(v) => setFilterLine(v === "__all__" ? "" : v)}>
                <SelectTrigger>
                  <GitBranch className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {lineOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 min-w-[160px]">
              <Label className="text-xs">Estacao</Label>
              <Select value={filterStation || "__all__"} onValueChange={(v) => setFilterStation(v === "__all__" ? "" : v)}>
                <SelectTrigger>
                  <CircuitBoard className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {stationOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {loading ? (
          <>
            <Skeleton className="h-[150px] rounded-xl" />
            <Skeleton className="h-[150px] rounded-xl" />
          </>
        ) : (
          <>
            <StatsCard
              title="MTTR (Mean Time To Repair)"
              value={avgMttr.toFixed(1)}
              subtitle="Tempo medio de uma falha (minutos)"
              icon={Timer}
              iconColor="var(--color-warning)"
            />
            <StatsCard
              title="MTBF (Mean Time Between Failures)"
              value={avgMtbf.toFixed(1)}
              subtitle="Tempo medio entre falhas (minutos)"
              icon={Zap}
              iconColor="var(--color-success)"
            />
          </>
        )}
      </motion.div>

      {/* Stations Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Estacoes - % ate MTBF</h3>

          {stopsLoading || loading ? (
            <Skeleton className="h-[300px]" />
          ) : stationRows.length === 0 ? (
            <EmptyState
              type={hasActiveFilters ? 'search' : 'no-data'}
              title={hasActiveFilters ? 'Nenhum resultado' : 'Sem dados'}
              description={
                hasActiveFilters
                  ? 'Nenhuma estacao corresponde aos filtros selecionados.'
                  : 'Nenhuma estacao com parada COMPLETED encontrada.'
              }
              action={hasActiveFilters ? { label: 'Limpar Filtros', onClick: clearFilters } : undefined}
            />
          ) : (
            <DataTable
              data={stationRows as unknown as Record<string, unknown>[]}
              columns={columns as { key: string; header: string; sortable?: boolean; render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode }[]}
              pageSize={20}
              onRowClick={(row) => setSelection(row as unknown as StationRow)}
              emptyMessage="Nenhuma estacao encontrada"
            />
          )}
        </Card>
      </motion.div>

      {/* Details Drawer */}
      <DetailsDrawer
        open={Boolean(selection)}
        title={selection ? `Estacao ${selection.station}` : ''}
        sections={selection ? [{ title: 'Info da Estacao', value: selection }] : []}
        onClose={() => setSelection(null)}
      />
    </div>
  );
}
