'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Factory, GitBranch, Wifi, Car, Timer, TrendingUp } from 'lucide-react';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Label } from '@/src/components/ui/label';
import { OEEChart, BarChart as RechartsBarChart } from '@/src/components/charts';
import { StatsCard, DataTable, StatusBadge } from '@/src/components/data-display';
import { DetailsDrawer } from '@/src/components/domain';
import { useSimulatorSelector } from '@/src/hooks/useSimulatorStore';
import { useOEEByDate, useOEEHistorical, OEERecord } from '@/src/hooks/useOEEQuery';
import { useStopsByDate } from '@/src/hooks/useStopsQuery';
import { getSocket, subscribeTo } from '@/src/utils/socket';
import { normalizePlantSnapshot } from '@/src/utils/plantNormalize';
import { formatEpochMs } from '@/src/utils/timeFormat';
import { ymdFromEpochMs } from '@/src/utils/date';
import { getStringField, uniqStrings } from '@/src/utils/safe';
import type { IStopLine, OEEDataEmit } from '@/src/types/socket';
import { cn } from '@/src/lib/utils';

function todayStr(epochMs: number): string {
  return ymdFromEpochMs(epochMs);
}

function uniq(values: Array<string | undefined | null>): string[] {
  return uniqStrings(values);
}

function getStartTime(stop: IStopLine): number {
  return stop.start_time;
}

function getEndTime(stop: IStopLine): number {
  return stop.end_time ?? 0;
}

function getField(obj: unknown, key: string): string {
  return getStringField(obj, key);
}

// Local OEE type that extends the imported one for WebSocket compatibility
type LocalOEERecord = OEERecord | (OEEDataEmit & {
  id?: number;
  production_time?: number;
  cars_production?: number;
  takt_time?: number;
  diff_time?: number;
});

function getDiffTimeMinutes(r: LocalOEERecord): number {
  const v = (r as OEERecord).diffTime ?? (r as OEERecord).diff_time;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function getCarsProduced(r: LocalOEERecord): number {
  const v = (r as OEERecord).carsProduction ?? (r as OEERecord).cars_production;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function getJPH(r: LocalOEERecord): number {
  const jph = (r as OEERecord).jph;
  return typeof jph === 'number' && Number.isFinite(jph) ? jph : 0;
}

const HOURS = Array.from({ length: 18 }, (_, i) => (7 + i) % 24);
const TOTAL_MINUTES = 17 * 60;

function hourLabel(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

type HourSlot = {
  hour: number;
  type: 'ok' | 'random' | 'propagation' | 'planned';
  stops: IStopLine[];
  stoppedMinutes: number;
};

// Hour Timeline Component with Recharts-style design
function HourTimeline({ slots }: { slots: HourSlot[] }) {
  const data = slots.map((slot) => ({
    name: hourLabel(slot.hour),
    value: slot.stoppedMinutes,
    type: slot.type,
  }));

  const getColor = (type: string) => {
    switch (type) {
      case 'random':
        return 'var(--color-destructive)';
      case 'propagation':
      case 'planned':
        return 'var(--color-info)';
      default:
        return 'var(--color-success)';
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-1 h-[140px]">
        {data.map((d) => (
          <div key={d.name} className="flex-1 flex flex-col items-center h-full">
            <div className="flex-1 w-full flex flex-col justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ duration: 0.3 }}
                className="w-full rounded-t-sm min-h-[20px]"
                style={{ backgroundColor: getColor(d.type) }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground mt-1">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Minute Timeline Component
function MinuteTimeline({ slots }: { slots: { minute: number; type: string }[] }) {
  const groups: { type: string; count: number }[] = [];
  for (const slot of slots) {
    const last = groups[groups.length - 1];
    if (last && last.type === slot.type) {
      last.count++;
    } else {
      groups.push({ type: slot.type, count: 1 });
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'random':
        return 'bg-destructive';
      case 'propagation':
      case 'planned':
        return 'bg-info';
      default:
        return 'bg-success';
    }
  };

  return (
    <div className="flex h-[60px] w-full rounded-lg overflow-hidden">
      {groups.map((g, i) => (
        <div
          key={`${g.type}-${i}`}
          className={cn('min-w-0', getColor(g.type))}
          style={{ flex: g.count }}
        />
      ))}
    </div>
  );
}

// Table columns for stops
const stopsColumns = [
  { key: 'shop', header: 'Shop', sortable: true },
  { key: 'line', header: 'Linha', sortable: true },
  { key: 'station', header: 'Estacao', sortable: true },
  {
    key: 'type',
    header: 'Tipo',
    sortable: true,
    render: (value: unknown) => (
      <StatusBadge
        status={String(value) === 'RANDOM_GENERATE' ? 'error' : 'info'}
        label={String(value)}
      />
    ),
  },
  { key: 'reason', header: 'Motivo', sortable: true },
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
    render: (value: unknown) => formatEpochMs(Number(value)) ?? '--',
  },
];

export default function OEEPage() {
  const plantState = useSimulatorSelector((s) => s.plantState?.data);
  const oeeState = useSimulatorSelector((s) => s.oeeState);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const STOPS_UTC_OFFSET_MS = 3 * 3600000;
  const healthSimMs = useSimulatorSelector((s) => s.health?.data?.simulatorTimestamp);
  // Use ref to capture initial Date.now() only once, avoiding impure function during render
  const initialNowRef = React.useRef<number | null>(null);
  const [simNowMs, setSimNowMs] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (mounted && initialNowRef.current === null) {
      initialNowRef.current = Date.now();
    }
  }, [mounted]);

  React.useEffect(() => {
    if (!mounted) {
      setSimNowMs(null);
      return;
    }
    if (typeof healthSimMs === 'number') {
      setSimNowMs(healthSimMs);
    } else if (initialNowRef.current !== null) {
      setSimNowMs(initialNowRef.current);
    }
  }, [mounted, healthSimMs]);

  const simToday = React.useMemo(
    () => (typeof simNowMs === 'number' ? todayStr(simNowMs) : ''),
    [simNowMs]
  );

  React.useEffect(() => {
    getSocket();
    subscribeTo('oee');
  }, []);

  const [filterDate, setFilterDate] = React.useState('');
  const [filterShop, setFilterShop] = React.useState('');
  const [filterLine, setFilterLine] = React.useState('');

  const lastAutoDateRef = React.useRef(simToday);
  React.useEffect(() => {
    if (simToday && filterDate === lastAutoDateRef.current && simToday !== lastAutoDateRef.current) {
      setFilterDate(simToday);
    }
    lastAutoDateRef.current = simToday;
  }, [simToday, filterDate]);

  const isToday = Boolean(filterDate && simToday && filterDate === simToday);

  const plant = React.useMemo(() => normalizePlantSnapshot(plantState), [plantState]);
  const shopOptions = React.useMemo(() => uniq(plant.shops.map((s) => s.name)), [plant.shops]);
  const lineOptions = React.useMemo(() => {
    if (!filterShop) {
      return uniq(plant.shops.flatMap((s) => s.lines.map((l) => l.name)));
    }
    const shop = plant.shops.find((s) => s.name === filterShop);
    return shop ? uniq(shop.lines.map((l) => l.name)) : [];
  }, [plant.shops, filterShop]);

  // Check if WebSocket OEE data is available for today
  const hasValidWebSocketOee = React.useMemo(() => {
    if (!isToday) return false;
    return oeeState.length > 0;
  }, [isToday, oeeState]);

  // React Query: Fetch OEE data for selected date (only when not using WebSocket)
  const shouldFetchOeeApi = Boolean(filterDate && (!isToday || !hasValidWebSocketOee));
  const {
    data: oeeApiData = [],
    isLoading: oeeApiLoading,
  } = useOEEByDate(shouldFetchOeeApi ? filterDate : null);

  // React Query: Fetch historical OEE (last 7 days)
  const {
    data: oeeHistorical = [],
  } = useOEEHistorical(7, simNowMs ?? undefined);

  // React Query: Fetch stops for selected date
  const {
    data: stopsData = [],
    isLoading: stopsLoading,
  } = useStopsByDate(filterDate || null, {
    shop: filterShop || undefined,
    line: filterLine || undefined,
  });

  // Cast stops data for local type compatibility
  const stops = stopsData as unknown as IStopLine[];

  // Determine OEE loading state
  const oeeLoading = shouldFetchOeeApi && oeeApiLoading;

  // Determine if using API fallback (when WebSocket not available for today)
  const usingApiFallback = isToday && !hasValidWebSocketOee && oeeApiData.length > 0;

  // OPTIMIZED: Single OEE source selector - replaces 4 duplicate useMemos
  const oeeSource = React.useMemo((): LocalOEERecord[] => {
    if (isToday && hasValidWebSocketOee) {
      return oeeState;
    }
    // Use API data (either for today as fallback or for historical dates)
    return oeeApiData as LocalOEERecord[];
  }, [isToday, hasValidWebSocketOee, oeeState, oeeApiData]);

  // Filter OEE by location - depends only on oeeSource and filters
  const filteredOee = React.useMemo(() => {
    return oeeSource.filter((r) => {
      if (filterShop && r.shop !== filterShop) return false;
      // Handle line comparison - WebSocket uses "shop-line" format
      if (filterLine) {
        const lineMatch = r.line === filterLine || r.line === `${filterShop}-${filterLine}`;
        if (!lineMatch) return false;
      }
      return true;
    });
  }, [oeeSource, filterShop, filterLine]);

  // Calculate all OEE metrics from filtered data in a single memo
  const { currentOee, jphReal, carsProduced, difftime } = React.useMemo(() => {
    if (filteredOee.length === 0) {
      return { currentOee: 0, jphReal: 0, carsProduced: 0, difftime: 0 };
    }

    const count = filteredOee.length;
    let totalOee = 0;
    let totalJph = 0;
    let totalCars = 0;
    let totalDiff = 0;

    for (const r of filteredOee) {
      totalOee += r.oee ?? 0;
      totalJph += getJPH(r);
      totalCars += getCarsProduced(r);
      totalDiff += getDiffTimeMinutes(r);
    }

    return {
      currentOee: totalOee / count,
      jphReal: totalJph / count,
      carsProduced: totalCars / count,
      difftime: totalDiff / count,
    };
  }, [filteredOee]);

  const last7Days = React.useMemo(() => {
    if (!simNowMs) return [];
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(simNowMs);
      d.setDate(d.getDate() - i);
      dates.push(todayStr(d.getTime()));
    }

    // Cast historical data to LocalOEERecord for type compatibility
    const historicalData = oeeHistorical as unknown as LocalOEERecord[];

    return dates.map((date) => {
      const dayRecords = historicalData.filter((r) => {
        if ((r as OEERecord).date !== date) return false;
        if (filterShop && r.shop !== filterShop) return false;
        if (filterLine) {
          const lineMatch = r.line === filterLine || r.line === `${filterShop}-${filterLine}`;
          if (!lineMatch) return false;
        }
        return true;
      });
      const avg =
        dayRecords.length > 0 ? dayRecords.reduce((s, r) => s + (r.oee ?? 0), 0) / dayRecords.length : 0;
      return { name: date.slice(5), value: avg };
    });
  }, [oeeHistorical, filterShop, filterLine, simNowMs]);

  const hourSlots = React.useMemo((): HourSlot[] => {
    if (!filterDate) return [];
    const dateStart = new Date(filterDate + 'T07:00:00').getTime();

    const filteredByShopLine = stops.filter((s) => {
      if (filterShop && getField(s, 'shop') !== filterShop) return false;
      if (filterLine && getField(s, 'line') !== filterLine) return false;
      return true;
    });

    return HOURS.map((hour) => {
      const hourStart = dateStart + (hour >= 7 ? (hour - 7) * 3600000 : (hour + 17) * 3600000);
      const hourEnd = hourStart + 3600000;

      const overlapping = filteredByShopLine.filter((s) => {
        const st = getStartTime(s) + STOPS_UTC_OFFSET_MS;
        const et = (getEndTime(s) || getStartTime(s) + 60000) + STOPS_UTC_OFFSET_MS;
        return st < hourEnd && et > hourStart;
      });

      let stoppedMs = 0;
      for (const s of overlapping) {
        const st = Math.max(getStartTime(s) + STOPS_UTC_OFFSET_MS, hourStart);
        const et = Math.min((getEndTime(s) || getStartTime(s) + 60000) + STOPS_UTC_OFFSET_MS, hourEnd);
        stoppedMs += Math.max(0, et - st);
      }
      const stoppedMinutes = Math.round(stoppedMs / 60000);

      let type: HourSlot['type'] = 'ok';
      for (const s of overlapping) {
        const t = getField(s, 'type');
        if (t === 'RANDOM_GENERATE') {
          type = 'random';
          break;
        }
        if (t === 'PROPAGATION') {
          type = 'propagation';
        } else if (t === 'PLANNED' && type !== 'propagation') {
          type = 'planned';
        }
      }

      return { hour, type, stops: overlapping, stoppedMinutes };
    });
  }, [filterDate, stops, filterShop, filterLine, STOPS_UTC_OFFSET_MS]);

  const minuteSlots = React.useMemo(() => {
    if (!filterDate) return [];
    const dateStart = new Date(filterDate + 'T07:00:00').getTime();
    const slots: { minute: number; type: string }[] = [];

    const filteredByShopLine = stops.filter((s) => {
      if (filterShop && getField(s, 'shop') !== filterShop) return false;
      if (filterLine && getField(s, 'line') !== filterLine) return false;
      return true;
    });

    for (let m = 0; m < TOTAL_MINUTES; m++) {
      const minuteStart = dateStart + m * 60000;
      const minuteEnd = minuteStart + 60000;

      const overlapping = filteredByShopLine.filter((s) => {
        const st = getStartTime(s) + STOPS_UTC_OFFSET_MS;
        const et = (getEndTime(s) || getStartTime(s) + 60000) + STOPS_UTC_OFFSET_MS;
        return st < minuteEnd && et > minuteStart;
      });

      let type = 'ok';
      for (const s of overlapping) {
        const t = getField(s, 'type');
        if (t === 'RANDOM_GENERATE') {
          type = 'random';
          break;
        }
        if (t === 'PROPAGATION') {
          type = 'propagation';
        } else if (t === 'PLANNED' && type !== 'propagation') {
          type = 'planned';
        }
      }

      slots.push({ minute: m, type });
    }

    return slots;
  }, [filterDate, stops, filterShop, filterLine, STOPS_UTC_OFFSET_MS]);

  const filteredStops = React.useMemo(() => {
    return stops
      .filter((s) => {
        if (filterShop && getField(s, 'shop') !== filterShop) return false;
        if (filterLine && getField(s, 'line') !== filterLine) return false;
        return true;
      })
      .sort((a, b) => getStartTime(b) - getStartTime(a));
  }, [stops, filterShop, filterLine]);

  const [selection, setSelection] = React.useState<IStopLine | null>(null);

  // Generate date options
  const dateOptions = React.useMemo(() => {
    if (!simNowMs) return [];
    return Array.from({ length: 365 }, (_, i) => {
      const d = new Date(simNowMs);
      d.setDate(d.getDate() - i);
      return todayStr(d.getTime());
    });
  }, [simNowMs]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[100px] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">OEE</h1>
          {isToday && hasValidWebSocketOee && (
            <Badge variant="success" className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Tempo Real
            </Badge>
          )}
          {isToday && !hasValidWebSocketOee && usingApiFallback && (
            <Badge variant="warning">API (Reconectando...)</Badge>
          )}
          {!isToday && filterDate && <Badge variant="info">Historico</Badge>}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filteredStops.length} paradas</span>
          {stops.length !== filteredStops.length && (
            <span className="text-xs">de {stops.length} total</span>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Filtros</h3>
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
          </div>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">OEE Atual</p>
              {oeeLoading ? (
                <Skeleton className="h-10 w-20 mt-1" />
              ) : (
                <OEEChart value={currentOee} size="sm" />
              )}
            </div>
          </div>
        </Card>

        <StatsCard
          title="JPH Real"
          value={jphReal.toFixed(1)}
          subtitle="carros/hora"
          icon={TrendingUp}
          iconColor="var(--color-success)"
        />

        <StatsCard
          title="Carros Produzidos"
          value={Math.round(carsProduced)}
          subtitle="unidades"
          icon={Car}
          iconColor="var(--color-primary)"
        />

        <StatsCard
          title="Tempo Justificativa"
          value={difftime.toFixed(1)}
          subtitle="minutos"
          icon={Timer}
          iconColor="var(--color-warning)"
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">OEE Ultimos 7 Dias</h3>
          <RechartsBarChart
            data={last7Days}
            dataKey="value"
            xAxisKey="name"
            height={200}
            colorByValue
          />
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Hora a Hora (07:00 - 00:00)</h3>
          {stopsLoading ? (
            <Skeleton className="h-[140px]" />
          ) : (
            <HourTimeline slots={hourSlots} />
          )}

          <h3 className="text-sm font-semibold mt-4 mb-3">Minuto a Minuto</h3>
          {stopsLoading ? (
            <Skeleton className="h-[60px]" />
          ) : (
            <MinuteTimeline slots={minuteSlots} />
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-3 justify-center flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-success" />
              <span className="text-xs">OK</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-destructive" />
              <span className="text-xs">Random</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-info" />
              <span className="text-xs">Propagation/Planned</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stops Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Paradas do Dia</h3>
          <DataTable
            data={filteredStops as unknown as Record<string, unknown>[]}
            columns={stopsColumns}
            loading={stopsLoading}
            pageSize={20}
            onRowClick={(row) => setSelection(row as unknown as IStopLine)}
            emptyMessage="Nenhuma parada encontrada para os filtros selecionados"
          />
        </Card>
      </motion.div>

      {/* Details Drawer */}
      <DetailsDrawer
        open={Boolean(selection)}
        title={selection ? `Parada ${selection.id ?? ''}` : ''}
        sections={selection ? [{ title: 'Parada', value: selection }] : []}
        onClose={() => setSelection(null)}
      />
    </div>
  );
}
