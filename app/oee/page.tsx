'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import RefreshIcon from '@mui/icons-material/Refresh';

import { AppHeader } from '../src/components/AppHeader';
import { DetailsDrawer } from '../src/components/DetailsDrawer';
import { ConnectionStatus, ResultsCount } from '../src/components/FeedbackStates';
import http from '../src/utils/http';
import { useSimulatorStore } from '../src/hooks/useSimulatorStore';
import { getSocket, subscribeTo } from '../src/utils/socket';
import { normalizePlantSnapshot } from '../src/utils/plantNormalize';
import { formatEpochMs } from '../src/utils/timeFormat';
import { ymdFromEpochMs } from '../src/utils/date';
import { asArrayFromPayload, getStringField, toNumber as toNumberSafe, uniqStrings } from '../src/utils/safe';
import { MetricValue } from '../src/components/MetricValue';
import type { Stop } from '../src/stores/simulatorStore';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function todayStr(epochMs: number): string {
  return ymdFromEpochMs(epochMs);
}

function uniq(values: Array<string | undefined | null>): string[] {
  return uniqStrings(values);
}

function asArray<T>(payload: unknown): T[] {
  return asArrayFromPayload<T>(payload);
}

function toNumber(v: unknown): number | undefined {
  return toNumberSafe(v);
}

function getStartTime(stop: Stop): number {
  const rec = stop as unknown as Record<string, unknown>;
  return toNumber(rec.startTime) ?? toNumber(rec.start_time) ?? 0;
}

function getEndTime(stop: Stop): number {
  const rec = stop as unknown as Record<string, unknown>;
  return toNumber(rec.endTime) ?? toNumber(rec.end_time) ?? 0;
}

function getField(obj: unknown, key: string): string {
  return getStringField(obj, key);
}

type OEERecord = {
  id?: number;
  date?: string;
  shop?: string;
  line?: string;
  productionTime?: number;
  production_time?: number;
  carsProduction?: number;
  cars_production?: number;
  taktTime?: number;
  takt_time?: number;
  diffTime?: number;
  diff_time?: number;
  oee?: number;
};

function normalizeOee(r: OEERecord): { date: string; shop: string; line: string; oee: number } {
  return {
    date: r.date ?? '',
    shop: r.shop ?? '',
    line: r.line ?? '',
    oee: r.oee ?? 0,
  };
}

function getDiffTimeMinutes(r: OEERecord): number {
  const v = r.diffTime ?? r.diff_time;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function getCarsProduced(r: OEERecord): number {
  const v = r.carsProduction ?? r.cars_production;
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function countDistinctLines(records: OEERecord[]): number {
  const set = new Set<string>();
  for (const r of records) {
    const line = (r.line ?? '').trim();
    if (!line) continue;
    if (line.toUpperCase() === 'ALL') continue;
    set.add(line);
  }
  return set.size;
}

// Hours from 07:00 to 00:00 (next day)
const HOURS = Array.from({ length: 18 }, (_, i) => (7 + i) % 24);

// Simulator timezone offset (UTC-3 for Brazil)
// Production starts at 7:00 AM in simulator timezone
// 7:00 AM at UTC-3 = 10:00 AM UTC
const SIMULATOR_UTC_OFFSET_HOURS = -3;
const PRODUCTION_START_HOUR_LOCAL = 7;
const PRODUCTION_START_HOUR_UTC = PRODUCTION_START_HOUR_LOCAL - SIMULATOR_UTC_OFFSET_HOURS; // 10

// Stops timestamps come in UTC+0, need to add offset to convert to simulator timezone
const STOPS_UTC_OFFSET_MS = 3 * 3600000; // +3 hours in milliseconds

function hourLabel(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function PieChart({ value, size = 140 }: { value: number; size?: number }) {
  const theme = useTheme();
  const pct = Math.min(100, Math.max(0, value));
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color =
    pct >= 85 ? theme.palette.success.main : pct >= 60 ? theme.palette.warning.main : theme.palette.error.main;

  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.palette.divider}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {pct.toFixed(1)}%
        </Typography>
      </Box>
    </Box>
  );
}

function BarChart({ data, height = 180 }: { data: { label: string; value: number }[]; height?: number }) {
  const theme = useTheme();
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height, width: '100%' }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const color =
          d.value >= 85
            ? theme.palette.success.main
            : d.value >= 60
              ? theme.palette.warning.main
              : theme.palette.error.main;
        return (
          <Box
            key={i}
            sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}
          >
            <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Box
                sx={{
                  width: '100%',
                  height: `${pct}%`,
                  bgcolor: color,
                  borderRadius: 1,
                  minHeight: 4,
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ mt: 0.5, fontSize: 10 }}>
              {d.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

type HourSlot = {
  hour: number;
  type: 'ok' | 'random' | 'propagation' | 'planned';
  stops: Stop[];
  stoppedMinutes: number;
};

function HourTimeline({ slots, height = 140 }: { slots: HourSlot[]; height?: number }) {
  const theme = useTheme();

  const colorFor = (type: HourSlot['type']) => {
    switch (type) {
      case 'random':
        return theme.palette.error.main;
      case 'propagation':
      case 'planned':
        return theme.palette.info.main;
      default:
        return theme.palette.success.main;
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.5, height, width: '100%' }}>
      {slots.map((slot) => {
        const showTooltip = slot.type !== 'ok' && slot.stoppedMinutes > 0;

        const tooltipContent = showTooltip ? (
          <Box sx={{ p: 0.5, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
              {hourLabel(slot.hour)}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: colorFor(slot.type) }}>
              {slot.stoppedMinutes} min
            </Typography>
            <Typography variant="caption" color="text.secondary">
              parado
            </Typography>
          </Box>
        ) : null;

        const bar = (
          <Box
            sx={{
              flex: 1,
              width: '100%',
              bgcolor: colorFor(slot.type),
              borderRadius: 1,
              minHeight: 20,
              cursor: showTooltip ? 'pointer' : 'default',
              transition: 'transform 0.15s, box-shadow 0.15s',
              '&:hover': showTooltip
                ? {
                  transform: 'scaleY(1.05)',
                  boxShadow: 4,
                }
                : {},
            }}
          />
        );

        return (
          <Box
            key={slot.hour}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
            }}
          >
            {showTooltip ? (
              <Tooltip
                title={tooltipContent}
                arrow
                placement="top"
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      boxShadow: 6,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      p: 1,
                      minWidth: 80,
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'background.paper',
                      '&::before': {
                        border: `1px solid ${theme.palette.divider}`,
                      },
                    },
                  },
                }}
              >
                {bar}
              </Tooltip>
            ) : (
              bar
            )}
            <Typography variant="caption" sx={{ mt: 0.5, fontSize: 9 }}>
              {hourLabel(slot.hour)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

type MinuteSlot = {
  minute: number; // minutes since 07:00
  type: 'ok' | 'random' | 'propagation' | 'planned';
};

// Total minutes from 07:00 to 00:00 = 17 hours * 60 = 1020 minutes
const TOTAL_MINUTES = 17 * 60;

function MinuteTimeline({ slots, height = 80 }: { slots: MinuteSlot[]; height?: number }) {
  const theme = useTheme();

  const colorFor = (type: MinuteSlot['type']) => {
    switch (type) {
      case 'random':
        return theme.palette.error.main;
      case 'propagation':
      case 'planned':
        return theme.palette.info.main;
      default:
        return theme.palette.success.main;
    }
  };

  // Group consecutive minutes with the same type to reduce DOM elements
  const groups: { type: MinuteSlot['type']; count: number }[] = [];
  for (const slot of slots) {
    const last = groups[groups.length - 1];
    if (last && last.type === slot.type) {
      last.count++;
    } else {
      groups.push({ type: slot.type, count: 1 });
    }
  }

  return (
    <Box sx={{ display: 'flex', height, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
      {groups.map((g, i) => (
        <Box
          key={i}
          sx={{
            flex: g.count,
            bgcolor: colorFor(g.type),
            minWidth: 0,
          }}
        />
      ))}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function OEEPage() {
  const theme = useTheme();
  const sim = useSimulatorStore();
  console.log(sim);
  

  // Avoid hydration mismatch: do not use Date.now()/new Date() during SSR render.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Use the simulator "today" (from /health payload via websocket)
  const healthSimMs = sim.health?.data?.simulatorTimestamp;
  const simNowMs = mounted ? (healthSimMs ?? Date.now()) : null;
  const simToday = React.useMemo(() => (typeof simNowMs === 'number' ? todayStr(simNowMs) : ''), [simNowMs]);

  // Subscribe to oee room
  React.useEffect(() => {
    getSocket();
    subscribeTo('oee');
  }, []);

  // Filters
  const [filterDate, setFilterDate] = React.useState('');
  const [filterShop, setFilterShop] = React.useState('');
  const [filterLine, setFilterLine] = React.useState('');

  // Keep the default date aligned with simulator "today" when health arrives,
  // but don't override if the user already changed the filter.
  const lastAutoDateRef = React.useRef(simToday);
  React.useEffect(() => {
    if (simToday && filterDate === lastAutoDateRef.current && simToday !== lastAutoDateRef.current) {
      setFilterDate(simToday);
    }
    lastAutoDateRef.current = simToday;
  }, [simToday, filterDate]);

  const isToday = Boolean(filterDate && simToday && filterDate === simToday);

  // Dynamic options from plantstate
  const plant = React.useMemo(() => normalizePlantSnapshot(sim.plantState), [sim.plantState]);
  const shopOptions = React.useMemo(() => uniq(plant.shops.map((s) => s.name)), [plant.shops]);
  const lineOptions = React.useMemo(() => {
    if (!filterShop) {
      return uniq(plant.shops.flatMap((s) => s.lines.map((l) => l.name)));
    }
    const shop = plant.shops.find((s) => s.name === filterShop);
    return shop ? uniq(shop.lines.map((l) => l.name)) : [];
  }, [plant.shops, filterShop]);

  // OEE data
  const [oeeLoading, setOeeLoading] = React.useState(false);
  const [oeeApiData, setOeeApiData] = React.useState<OEERecord[]>([]);
  const [oeeHistorical, setOeeHistorical] = React.useState<OEERecord[]>([]);
  const [oeeApiFallback, setOeeApiFallback] = React.useState<OEERecord[]>([]); // Fallback for today when WebSocket fails
  const [usingApiFallback, setUsingApiFallback] = React.useState(false);

  // Stops data
  const [stopsLoading, setStopsLoading] = React.useState(false);
  const [stops, setStops] = React.useState<Stop[]>([]);

  // Check if WebSocket OEE data is valid for today
  const hasValidWebSocketOee = React.useMemo(() => {
    if (!isToday || !sim.oee) return false;
    const oeeData = sim.oee.data;
    return Array.isArray(oeeData) && oeeData.length > 0;
  }, [isToday, sim.oee]);

  // Fetch OEE from API - for historical dates OR as fallback for today when WebSocket fails
  React.useEffect(() => {
    if (!filterDate) {
      setOeeLoading(false);
      return;
    }

    // For today: only fetch from API if WebSocket data is not available
    if (isToday && hasValidWebSocketOee) {
      // WebSocket is working, clear fallback and don't fetch from API
      setOeeApiFallback([]);
      setUsingApiFallback(false);
      setOeeLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setOeeLoading(true);
      try {
        const res = await http.get('/oee', { params: { date: filterDate } });
        if (!cancelled) {
          const data = asArray<OEERecord>(res.data);
          if (isToday) {
            // Today but WebSocket not available - use API as fallback
            setOeeApiFallback(data);
            setUsingApiFallback(true);
          } else {
            // Historical date
            setOeeApiData(data);
            setUsingApiFallback(false);
          }
        }
      } catch {
        if (!cancelled) {
          if (isToday) {
            setOeeApiFallback([]);
          } else {
            setOeeApiData([]);
          }
        }
      } finally {
        if (!cancelled) setOeeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      setOeeLoading(false);
    };
  }, [filterDate, isToday, hasValidWebSocketOee]);

  // Retry WebSocket connection periodically when using API fallback for today
  React.useEffect(() => {
    if (!isToday || hasValidWebSocketOee) return;

    // Attempt to reconnect to WebSocket every 5 seconds
    const retryInterval = setInterval(() => {
      getSocket();
      subscribeTo('oee');
    }, 5000);

    return () => clearInterval(retryInterval);
  }, [isToday, hasValidWebSocketOee]);

  // Fetch last 7 days OEE
  React.useEffect(() => {
    if (!simNowMs) return;
    let cancelled = false;
    (async () => {
      try {
        const dates: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(simNowMs);
          d.setDate(d.getDate() - i);
          dates.push(todayStr(d.getTime()));
        }
        const res = await http.get('/oee', { params: { start_time: dates[0], end_time: dates[6] } });
        if (!cancelled) setOeeHistorical(asArray<OEERecord>(res.data));
      } catch {
        if (!cancelled) setOeeHistorical([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [simNowMs]);

  // Fetch stops based on filter
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setStopsLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filterShop) params.shop = filterShop;
        if (filterLine) params.line = filterLine;
        // Filter by date - convert to timestamp range
        const startOfDay = new Date(filterDate + 'T00:00:00').getTime();
        const endOfDay = new Date(filterDate + 'T23:59:59').getTime();
        params.start_time = String(startOfDay);
        params.end_time = String(endOfDay);

        const res = await http.get('/stops', { params });
        if (!cancelled) setStops(asArray<Stop>(res.data));
      } catch {
        if (!cancelled) setStops([]);
      } finally {
        if (!cancelled) setStopsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterDate, filterShop, filterLine]);

  // OEE value to display
  const currentOee = React.useMemo(() => {
    // For today: prefer WebSocket data, fallback to API
    if (isToday) {
      // Try WebSocket data first
      if (hasValidWebSocketOee && sim.oee) {
        const oeeData = sim.oee.data;
        if (Array.isArray(oeeData)) {
          const filtered = oeeData.filter((r: OEERecord) => {
            if (filterShop && r.shop !== filterShop) return false;
            if (filterLine && r.line !== filterLine) return false;
            return true;
          });
          if (filtered.length > 0) {
            const avg = filtered.reduce((sum: number, r: OEERecord) => sum + (r.oee ?? 0), 0) / filtered.length;
            return avg;
          }
        }
      }
      // Fallback to API data for today
      if (oeeApiFallback.length > 0) {
        const filtered = oeeApiFallback.filter((r) => {
          if (filterShop && r.shop !== filterShop) return false;
          if (filterLine && r.line !== filterLine) return false;
          return true;
        });
        if (filtered.length > 0) {
          return filtered.reduce((sum, r) => sum + (r.oee ?? 0), 0) / filtered.length;
        }
      }
      return 0;
    }
    // Historical: use API data
    const filtered = oeeApiData.filter((r) => {
      if (filterShop && r.shop !== filterShop) return false;
      if (filterLine && r.line !== filterLine) return false;
      return true;
    });
    if (filtered.length > 0) {
      return filtered.reduce((sum, r) => sum + (r.oee ?? 0), 0) / filtered.length;
    }
    return 0;
  }, [isToday, hasValidWebSocketOee, sim.oee, oeeApiData, oeeApiFallback, filterShop, filterLine]);

  // Diff time (minutes): production_time - takt_time * cars_production
  const difftime = React.useMemo(() => {
    // For today: prefer WebSocket, fallback to API
    if (isToday) {
      // Try WebSocket data first
      if (hasValidWebSocketOee && sim.oee) {
        const oeeData = sim.oee.data;
        if (Array.isArray(oeeData)) {
          const filtered = oeeData.filter((r: OEERecord) => {
            if (filterShop && r.shop !== filterShop) return false;
            if (filterLine && r.line !== filterLine) return false;
            return true;
          });
          if (filtered.length > 0) {
            return filtered.reduce((sum: number, r: OEERecord) => sum + getDiffTimeMinutes(r), 0) / filtered.length;
          }
        }
      }
      // Fallback to API data for today
      if (oeeApiFallback.length > 0) {
        const filtered = oeeApiFallback.filter((r) => {
          if (filterShop && r.shop !== filterShop) return false;
          if (filterLine && r.line !== filterLine) return false;
          return true;
        });
        if (filtered.length > 0) {
          return filtered.reduce((sum, r) => sum + getDiffTimeMinutes(r), 0) / filtered.length;
        }
      }
      return 0;
    }

    // Historical: use API data
    const filtered = oeeApiData.filter((r) => {
      if (filterShop && r.shop !== filterShop) return false;
      if (filterLine && r.line !== filterLine) return false;
      return true;
    });
    if (filtered.length > 0) {
      return filtered.reduce((sum, r) => sum + getDiffTimeMinutes(r), 0) / filtered.length;
    }
    return 0;
  }, [isToday, hasValidWebSocketOee, sim.oee, oeeApiData, oeeApiFallback, filterShop, filterLine]);

  // JPH (Jobs per Hour) Real = carsProduction / elapsedHours
  // elapsedHours = (simulatorTimestamp - 07:00 of same day) in hours
  // Uses UTC methods to avoid timezone inconsistencies across different servers
  const jphReal = React.useMemo(() => {
    if (!filterDate) return 0;

    // 1) Tempo decorrido (usando UTC para consistência)
    let elapsedHours = 0;
    if (isToday) {
      if (!simNowMs) return 0;
      const start = new Date(simNowMs);

      // Set to 7:00 AM in simulator timezone (UTC-3) = 10:00 AM UTC
      start.setUTCHours(PRODUCTION_START_HOUR_LOCAL, 0, 0, 0);
      const elapsedMs = simNowMs - start.getTime();
      elapsedHours = elapsedMs > 0 ? elapsedMs / 3600000 : 0;
      // clamp to the 07:00 -> 00:00 window

      if (elapsedHours > 17) elapsedHours = 17;
    } else {
      // Historical: full production window is always 17 hours (07:00 -> 00:00)
      elapsedHours = 17;
    }

    if (elapsedHours <= 0) return 0;

    // 2) Fonte de dados: prefer WebSocket for today, fallback to API
    let source: OEERecord[] = [];
    if (isToday) {
      if (hasValidWebSocketOee && Array.isArray(sim.oee?.data)) {
        source = sim.oee!.data as OEERecord[];
      } else if (oeeApiFallback.length > 0) {
        source = oeeApiFallback;
      }
    } else {
      source = oeeApiData;
    }

    // 3) Filtrar por shop/line
    const filtered = source.filter((r: OEERecord) => {
      if (filterShop && r.shop !== filterShop) return false;
      if (filterLine && r.line !== filterLine) return false;
      return true;
    });
    if (filtered.length === 0) return 0;

    // 4) Numerador: carsProduction
    // - Se line está selecionada: soma da line
    // - Se line = Todos: média por quantidade de linhas (shop selecionado ou planta toda)
    const totalCars = filtered.reduce((sum: number, r: OEERecord) => sum + getCarsProduced(r), 0);

    let carsValue = totalCars;
    if (!filterLine) {
      // Prefer the plant snapshot to count lines; fallback to distinct lines in the payload
      let lineCount = 0;
      if (filterShop) {
        const shop = plant.shops.find((s) => s.name === filterShop);
        lineCount = shop?.lines?.length ?? 0;
      } else {
        lineCount = plant.shops.reduce((acc, s) => acc + (s.lines?.length ?? 0), 0);
      }

      if (!lineCount) lineCount = countDistinctLines(filtered);
      if (lineCount > 0) carsValue = totalCars / lineCount;
    }


    return carsValue / elapsedHours;
  }, [filterDate, isToday, simNowMs, hasValidWebSocketOee, sim.oee, oeeApiData, oeeApiFallback, filterShop, filterLine, plant.shops]);

  // Last 7 days bar data
  const last7Days = React.useMemo(() => {
    if (!simNowMs) return [] as { label: string; value: number }[];
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(simNowMs);
      d.setDate(d.getDate() - i);
      dates.push(todayStr(d.getTime()));
    }

    return dates.map((date) => {
      const dayRecords = oeeHistorical.filter((r) => {
        if (r.date !== date) return false;
        if (filterShop && r.shop !== filterShop) return false;
        if (filterLine && r.line !== filterLine) return false;
        return true;
      });
      const avg = dayRecords.length > 0 ? dayRecords.reduce((s, r) => s + (r.oee ?? 0), 0) / dayRecords.length : 0;
      return { label: date.slice(5), value: avg };
    });
  }, [oeeHistorical, filterShop, filterLine, simNowMs]);

  // Hour slots for timeline
  const hourSlots = React.useMemo((): HourSlot[] => {
    const dateStart = new Date(filterDate + 'T07:00:00').getTime();

    // Filter stops by shop/line first
    const filteredByShopLine = stops.filter((s) => {
      if (filterShop && getField(s, 'shop') !== filterShop) return false;
      if (filterLine && getField(s, 'line') !== filterLine) return false;
      return true;
    });

    return HOURS.map((hour) => {
      const hourStart = dateStart + (hour >= 7 ? (hour - 7) * 3600000 : (hour + 17) * 3600000);
      const hourEnd = hourStart + 3600000;

      const overlapping = filteredByShopLine.filter((s) => {
        // Add offset to convert stop timestamps from UTC+0 to simulator timezone
        const st = getStartTime(s) + STOPS_UTC_OFFSET_MS;
        const et = (getEndTime(s) || getStartTime(s) + 60000) + STOPS_UTC_OFFSET_MS; // default 1 min if no end
        return st < hourEnd && et > hourStart;
      });

      // Calculate stopped minutes within this hour
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
  }, [filterDate, stops, filterShop, filterLine]);

  // Minute slots for detailed timeline (07:00 to 00:00 = 1020 minutes)
  const minuteSlots = React.useMemo((): MinuteSlot[] => {
    const dateStart = new Date(filterDate + 'T07:00:00').getTime();
    const slots: MinuteSlot[] = [];

    // Filter stops by shop/line first
    const filteredByShopLine = stops.filter((s) => {
      if (filterShop && getField(s, 'shop') !== filterShop) return false;
      if (filterLine && getField(s, 'line') !== filterLine) return false;
      return true;
    });

    for (let m = 0; m < TOTAL_MINUTES; m++) {
      const minuteStart = dateStart + m * 60000;
      const minuteEnd = minuteStart + 60000;

      const overlapping = filteredByShopLine.filter((s) => {
        // Add offset to convert stop timestamps from UTC+0 to simulator timezone
        const st = getStartTime(s) + STOPS_UTC_OFFSET_MS;
        const et = (getEndTime(s) || getStartTime(s) + 60000) + STOPS_UTC_OFFSET_MS;
        return st < minuteEnd && et > minuteStart;
      });

      let type: MinuteSlot['type'] = 'ok';
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
  }, [filterDate, stops, filterShop, filterLine]);

  // Filtered stops for list
  const filteredStops = React.useMemo(() => {
    return stops
      .filter((s) => {
        if (filterShop && getField(s, 'shop') !== filterShop) return false;
        if (filterLine && getField(s, 'line') !== filterLine) return false;
        return true;
      })
      .sort((a, b) => getStartTime(b) - getStartTime(a));
  }, [stops, filterShop, filterLine]);

  const [page, setPage] = React.useState(0);
  const rowsPerPage = 100;
  const pagedStops = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filteredStops.slice(start, start + rowsPerPage);
  }, [filteredStops, page]);

  const [selection, setSelection] = React.useState<Stop | null>(null);

  React.useEffect(() => {
    setPage(0);
  }, [filterDate, filterShop, filterLine]);

  const MetricCard = MetricValue;

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppHeader />

      <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3, mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              OEE
            </Typography>
            {/* Regra 3: Feedback - Status de tempo real */}
            {isToday && hasValidWebSocketOee && (
              <Tooltip title="Dados em tempo real via WebSocket" arrow>
                <Chip label="Tempo Real" color="success" size="small" variant="outlined" />
              </Tooltip>
            )}
            {isToday && !hasValidWebSocketOee && usingApiFallback && (
              <Tooltip title="WebSocket indisponível. Usando dados da API. Tentando reconectar..." arrow>
                <Chip label="API (Reconectando...)" color="warning" size="small" variant="outlined" />
              </Tooltip>
            )}
            {isToday && !hasValidWebSocketOee && !usingApiFallback && (
              <Tooltip title="Aguardando conexão WebSocket..." arrow>
                <Chip label="Conectando..." color="default" size="small" variant="outlined" />
              </Tooltip>
            )}
            {!isToday && filterDate && (
              <Tooltip title="Dados históricos" arrow>
                <Chip label="Histórico" color="info" size="small" variant="outlined" />
              </Tooltip>
            )}
          </Stack>
          {/* Regra 1: Consistência - Contador de paradas */}
          <ResultsCount total={stops.length} filtered={filteredStops.length} label="paradas" />
        </Stack>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Filtros
          </Typography>
          <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Date</InputLabel>
              <Select label="Date" value={filterDate} onChange={(e) => setFilterDate(String(e.target.value))}>
                {/* Generate last 365 days */}
                {(simNowMs
                  ? Array.from({ length: 365 }, (_, i) => {
                    const d = new Date(simNowMs);
                    d.setDate(d.getDate() - i);
                    const val = todayStr(d.getTime());
                    return (
                      <MenuItem key={val} value={val}>
                        {val}
                      </MenuItem>
                    );
                  })
                  : [])}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Shop</InputLabel>
              <Select label="Shop" value={filterShop} onChange={(e) => setFilterShop(String(e.target.value))}>
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {shopOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Line</InputLabel>
              <Select label="Line" value={filterLine} onChange={(e) => setFilterLine(String(e.target.value))}>
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {lineOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {isToday && hasValidWebSocketOee && (
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                ● Tempo real
              </Typography>
            )}
            {isToday && !hasValidWebSocketOee && usingApiFallback && (
              <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
                ⟳ Reconectando...
              </Typography>
            )}
          </Stack>
        </Paper>

        {/* Dashboard Grid */}
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr' } }}>
          {/* Row 1: OEE Pie + Bar Chart */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  OEE Atual
                </Typography>
                {oeeLoading ? <CircularProgress size={80} /> : <PieChart value={currentOee} />}
              </Box>
              <Box sx={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 4, marginRight: 4 }}>
                <MetricCard label="JPH Real" value={jphReal} unit="carros/h" />
              </Box>
              <Box sx={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 4, marginRight: 4 }}>
                <MetricCard label="Tempo de Justiicativa" value={difftime} unit="minutos" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 280 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  OEE Últimos 7 Dias
                </Typography>
                <BarChart data={last7Days} />
              </Box>
            </Box>
          </Paper>


          {/* Row 2: Hour Timeline */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Hora a Hora (07:00 - 00:00)
            </Typography>
            {stopsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <HourTimeline slots={hourSlots} />
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 2, mb: 1 }}>
              Minuto a Minuto (07:00 - 00:00)
            </Typography>
            {stopsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <MinuteTimeline slots={minuteSlots} />
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.success.main, borderRadius: 0.5 }} />
                <Typography variant="caption">OK</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.error.main, borderRadius: 0.5 }} />
                <Typography variant="caption">Random</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: theme.palette.info.main, borderRadius: 0.5 }} />
                <Typography variant="caption">Propagation/Planned</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Row 3: Stops List */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Paradas do Dia
            </Typography>

            {stopsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: '50vh' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Shop</TableCell>
                        <TableCell>Line</TableCell>
                        <TableCell>Station</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Start</TableCell>
                        <TableCell>End</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedStops.map((s, idx) => (
                        <TableRow
                          hover
                          key={`${s.id ?? idx}-${getStartTime(s)}`}
                          onClick={() => setSelection(s)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{getField(s, 'shop') || '--'}</TableCell>
                          <TableCell>{getField(s, 'line') || '--'}</TableCell>
                          <TableCell>{getField(s, 'station') || '--'}</TableCell>
                          <TableCell>{getField(s, 'type') || '--'}</TableCell>
                          <TableCell>{getField(s, 'reason') || '--'}</TableCell>
                          <TableCell>{getStartTime(s) ? formatEpochMs(getStartTime(s)) : '--'}</TableCell>
                          <TableCell>{getEndTime(s) ? formatEpochMs(getEndTime(s)) : '--'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  rowsPerPageOptions={[rowsPerPage]}
                  rowsPerPage={rowsPerPage}
                  count={filteredStops.length}
                  page={page}
                  onPageChange={(_, next) => setPage(next)}
                />
              </>
            )}
          </Paper>
        </Box>
      </Box>

      <DetailsDrawer
        open={Boolean(selection)}
        title={selection ? `Stop ${selection.id ?? ''}` : ''}
        sections={selection ? [{ title: 'Stop', value: selection }] : []}
        onClose={() => setSelection(null)}
      />
    </Box>
  );
}
