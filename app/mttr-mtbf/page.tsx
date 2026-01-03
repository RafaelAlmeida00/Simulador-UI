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
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

import { AppHeader } from '../src/components/AppHeader';
import { DetailsDrawer } from '../src/components/DetailsDrawer';
import { LoadingState, EmptyState, ErrorState, ResultsCount } from '../src/components/FeedbackStates';
import http from '../src/utils/http';
import { useSimulatorStore } from '../src/hooks/useSimulatorStore';
import { getSocket } from '../src/utils/socket';
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

function getEndTime(stop: Stop): number {
  const rec = stop as unknown as Record<string, unknown>;
  return toNumber(rec.endTime) ?? toNumber(rec.end_time) ?? 0;
}

function getField(obj: unknown, key: string): string {
  return getStringField(obj, key);
}

type MttrMtbfRecord = {
  id?: number;
  date?: string;
  shop?: string;
  line?: string;
  station?: string;
  mttr?: number;
  mtbf?: number;
  total_failures?: number;
  total_repair_time?: number;
  total_uptime?: number;
};

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: 3,
        flex: 1,
        minWidth: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
      }}
    >
      <MetricValue label={label} value={value} unit={unit} valueVariant="h3" valueFontWeight={800} />
    </Paper>
  );
}

function MtbfStatusIcon({ percentage }: { percentage: number }) {
  const theme = useTheme();

  if (percentage <= 20) {
    return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
  }
  if (percentage <= 50) {
    return <RemoveCircleIcon sx={{ color: theme.palette.grey[500] }} />;
  }
  if (percentage <= 70) {
    return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
  }
  return <CancelIcon sx={{ color: theme.palette.error.main }} />;
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function MttrMtbfPage() {
  const theme = useTheme();
  const sim = useSimulatorStore();

  React.useEffect(() => {
    // Ensure we have /health (simulatorTimestamp) even on direct navigation.
    getSocket();
  }, []);

  // Avoid hydration mismatch: do not use Date.now()/new Date() during SSR render.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const healthSimMs = sim.health?.data?.simulatorTimestamp;
  const simNowMs = mounted ? (healthSimMs ?? Date.now()) : null;
  const simToday = React.useMemo(() => (typeof simNowMs === 'number' ? todayStr(simNowMs) : ''), [simNowMs]);

  // Filters
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

  // MTTR-MTBF data
  const [loading, setLoading] = React.useState(false);
  const [mttrMtbfData, setMttrMtbfData] = React.useState<MttrMtbfRecord[]>([]);

  // Stops data
  const [stopsLoading, setStopsLoading] = React.useState(false);
  const [stops, setStops] = React.useState<Stop[]>([]);

  // Simulator timestamp
  const simTimestamp = sim.health?.data?.simulatorTimestamp ?? Date.now();

  // Fetch MTTR-MTBF data
  React.useEffect(() => {
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
  }, [filterShop, filterLine, filterStation]);

  // Calculate aggregate MTTR and MTBF
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

  // Station list with last stop and % until MTBF
  type StationRow = {
    shop: string;
    line: string;
    station: string;
    lastStopEndTime: number | null;
    mtbf: number;
    percentUntilMtbf: number;
  };

  const stationRows = React.useMemo((): StationRow[] => {
    // Group stops by station
    const stationMap = new Map<string, { shop: string; line: string; station: string; lastEnd: number }>();

    for (const s of stops) {
      const shop = getField(s, 'shop');
      const line = getField(s, 'line');
      const station = getField(s, 'station');
      const status = getField(s, 'status');
      const type = getField(s, 'type');
      const endTime = getEndTime(s);

      if (!station || status !== 'COMPLETED' || type !== 'RANDOM_GENERATE') continue;

      const key = `${shop}::${line}::${station}`;
      const existing = stationMap.get(key);

      if (!existing || endTime > existing.lastEnd) {
        stationMap.set(key, { shop, line, station, lastEnd: endTime });
      }
    }

    // Build rows with MTBF data
    const rows: StationRow[] = [];

    for (const [, data] of stationMap) {
      // Find MTBF for this station
      const mtbfRecord = mttrMtbfData.find(
        (r) => r.shop === data.shop && r.line === data.line && r.station === data.station
      );

      const mtbfMinutes = mtbfRecord?.mtbf ?? 0;
      const mtbfMs = mtbfMinutes * 60 * 1000;

      // Calculate % until MTBF
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

    // Sort by % until MTBF descending (highest risk first)
    rows.sort((a, b) => b.percentUntilMtbf - a.percentUntilMtbf);

    return rows;
  }, [stops, mttrMtbfData, simTimestamp]);

  const [page, setPage] = React.useState(0);
  const rowsPerPage = 100;
  const pagedRows = React.useMemo(() => {
    const start = page * rowsPerPage;
    return stationRows.slice(start, start + rowsPerPage);
  }, [stationRows, page]);

  const [selection, setSelection] = React.useState<StationRow | null>(null);

  React.useEffect(() => {
    setPage(0);
  }, [filterDate, filterShop, filterLine, filterStation]);

  // Regra 6: Verificar se há filtros ativos
  const hasActiveFilters = React.useMemo(() => {
    return filterShop !== '' || filterLine !== '' || filterStation !== '';
  }, [filterShop, filterLine, filterStation]);

  // Regra 6: Limpar filtros
  const clearFilters = React.useCallback(() => {
    setFilterShop('');
    setFilterLine('');
    setFilterStation('');
  }, []);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppHeader />

      <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3, mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            MTTR / MTBF
          </Typography>
          {/* Regra 1: Consistência - Contador de estações */}
          <ResultsCount total={stationRows.length} label="estações" />
        </Stack>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <FilterListIcon color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Filtros
              </Typography>
              {hasActiveFilters && (
                <Chip label="Filtros ativos" size="small" color="primary" variant="outlined" />
              )}
            </Stack>
            {/* Regra 6: Desfazer - Limpar filtros */}
            {hasActiveFilters && (
              <Tooltip title="Limpar todos os filtros" arrow>
                <Button size="small" variant="outlined" startIcon={<ClearIcon />} onClick={clearFilters}>
                  Limpar
                </Button>
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Date</InputLabel>
              <Select label="Date" value={filterDate} onChange={(e) => setFilterDate(String(e.target.value))}>
                {(simNowMs
                  ? Array.from({ length: 30 }, (_, i) => {
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

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Station</InputLabel>
              <Select label="Station" value={filterStation} onChange={(e) => setFilterStation(String(e.target.value))}>
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {stationOptions.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Dashboard Grid */}
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr' } }}>
          {/* Row 1: MTTR and MTBF Cards */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {loading ? (
              <LoadingState message="Carregando métricas MTTR/MTBF..." />
            ) : (
              <>
                <Tooltip title="Tempo médio necessário para reparar uma falha" arrow>
                  <Box sx={{ flex: 1 }}>
                    <MetricCard label="MTTR (Mean Time To Repair)" value={avgMttr} unit="minutos" />
                  </Box>
                </Tooltip>
                <Tooltip title="Tempo médio entre falhas consecutivas" arrow>
                  <Box sx={{ flex: 1 }}>
                    <MetricCard label="MTBF (Mean Time Between Failures)" value={avgMtbf} unit="minutos" />
                  </Box>
                </Tooltip>
              </>
            )}
          </Box>

          {/* Row 2: Stations List */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Estações - % até MTBF
            </Typography>

            {stopsLoading || loading ? (
              <LoadingState message="Carregando estações..." />
            ) : stationRows.length === 0 ? (
              <EmptyState
                message={hasActiveFilters 
                  ? "Nenhuma estação corresponde aos filtros selecionados." 
                  : "Nenhuma estação com parada COMPLETED encontrada."
                }
                actionLabel={hasActiveFilters ? "Limpar Filtros" : undefined}
                action={hasActiveFilters ? clearFilters : undefined}
              />
            ) : (
              <>
                <TableContainer sx={{ maxHeight: '60vh' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Shop</TableCell>
                        <TableCell>Line</TableCell>
                        <TableCell>Station</TableCell>
                        <TableCell>Última Parada</TableCell>
                        <TableCell>MTBF (min)</TableCell>
                        <TableCell align="center">% até MTBF</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedRows.map((row, idx) => (
                        <Tooltip
                          key={`tooltip-${row.shop}-${row.line}-${row.station}-${idx}`}
                          title="Clique para ver detalhes"
                          arrow
                          placement="left"
                        >
                          <TableRow
                            hover
                            key={`${row.shop}-${row.line}-${row.station}-${idx}`}
                            onClick={() => setSelection(row)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>{row.shop || '--'}</TableCell>
                            <TableCell>{row.line || '--'}</TableCell>
                            <TableCell>{row.station || '--'}</TableCell>
                            <TableCell>
                              {row.lastStopEndTime ? formatEpochMs(row.lastStopEndTime) : '--'}
                            </TableCell>
                            <TableCell>{row.mtbf > 0 ? row.mtbf.toFixed(1) : '--'}</TableCell>
                            <TableCell align="center">{row.percentUntilMtbf.toFixed(1)}%</TableCell>
                            <TableCell align="center">
                              <MtbfStatusIcon percentage={row.percentUntilMtbf} />
                            </TableCell>
                          </TableRow>
                        </Tooltip>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  rowsPerPageOptions={[rowsPerPage]}
                  rowsPerPage={rowsPerPage}
                  count={stationRows.length}
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
        title={selection ? `Station ${selection.station}` : ''}
        sections={selection ? [{ title: 'Station Info', value: selection }] : []}
        onClose={() => setSelection(null)}
      />
    </Box>
  );
}
