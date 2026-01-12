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
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';

import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

import { AppHeader } from '../src/components/AppHeader';
import { DetailsDrawer } from '../src/components/DetailsDrawer';
import { LoadingState, EmptyState, ErrorState, ResultsCount } from '../src/components/FeedbackStates';
import http from '../src/utils/http';
import type { IStopLine } from '../src/types/socket';
import { formatEpochMs } from '../src/utils/timeFormat';
import { parseDateTimeLocal } from '../src/utils/date';
import { asArrayFromPayload, uniqStrings } from '../src/utils/safe';
import { Stop } from '../src/stores/simulatorStore';

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

export default function StoppagesPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stops, setStops] = React.useState<Stop[]>([]);

  const [filters, setFilters] = React.useState<Filters>({
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
  });

  const [page, setPage] = React.useState(0);
  const rowsPerPage = 100;

  const [selection, setSelection] = React.useState<Stop | null>(null);

  // Regra 6: Permitir refetch
  const fetchStops = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await http.get('/stops');
      setStops(asArrayFromPayload<Stop>(res.data));
    } catch {
      setError('Falha ao carregar os dados de paradas. Verifique a conexão com a API.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStops();
  }, [fetchStops]);

  // Regra 6: Limpar todos os filtros
  const clearFilters = React.useCallback(() => {
    setFilters({
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
    });
  }, []);

  // Regra 8: Verificar se há filtros ativos
  const hasActiveFilters = React.useMemo(() => {
    return Object.values(filters).some((v) => v !== '');
  }, [filters]);

  const options = React.useMemo(() => {
    return {
      shop: uniq(stops.map((s) => s.shop)),
      line: uniq(stops.map((s) => s.line)),
      station: uniq(stops.map((s) => s.station)),
      reason: uniq(stops.map((s) => s.reason)),
      severity: uniq(stops.map((s) => s.severity as string)),
      status: uniq(stops.map((s) => s.status as string)),
      type: uniq(stops.map((s) => s.type)),
      category: uniq(stops.map((s) => s.category)),
    };
  }, [stops]);

  const filtered = React.useMemo(() => {
    const startFrom = parseDateTimeLocal(filters.startFrom);
    const startTo = parseDateTimeLocal(filters.startTo);
    const endFrom = parseDateTimeLocal(filters.endFrom);
    const endTo = parseDateTimeLocal(filters.endTo);

    const matches = (s: Stop) => {
      if (filters.shop && s.shop !== filters.shop) return false;
      if (filters.line && s.line !== filters.line) return false;
      if (filters.station && s.station !== filters.station) return false;
      if (filters.reason && s.reason !== filters.reason) return false;
      if (filters.severity && String(s.severity ?? '') !== filters.severity) return false;
      if (filters.status && String(s.status ?? '') !== filters.status) return false;
      if (filters.type && String(s.type ?? '') !== filters.type) return false;
      if (filters.category && String(s.category ?? '') !== filters.category) return false;

      const st = getStartTime(s);
      const et = getEndTime(s);

      if (startFrom !== null && st < startFrom) return false;
      if (startTo !== null && st > startTo) return false;
      if (endFrom !== null && et < endFrom) return false;
      if (endTo !== null && et > endTo) return false;

      return true;
    };

    const next = stops.filter(matches);
    next.sort((a, b) => getStartTime(b) - getStartTime(a));
    return next;
  }, [stops, filters]);

  const paged = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  React.useEffect(() => {
    setPage(0);
  }, [filters]);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppHeader />

      <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3, mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Stoppages
          </Typography>
          {/* Regra 1: Consistência - Contador de resultados */}
          <ResultsCount total={stops.length} filtered={filtered.length} label="paradas" />
        </Stack>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <FilterListIcon color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Filtros
              </Typography>
              {hasActiveFilters && (
                <Chip 
                  label="Filtros ativos" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              )}
            </Stack>
            <Stack direction="row" gap={1}>
              {/* Regra 6: Desfazer - Limpar filtros */}
              {hasActiveFilters && (
                <Tooltip title="Limpar todos os filtros" arrow>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                  >
                    Limpar
                  </Button>
                </Tooltip>
              )}
              {/* Regra 7: Controle do usuário - Atualizar dados */}
              <Tooltip title="Atualizar dados" arrow>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchStops}
                  disabled={loading}
                >
                  Atualizar
                </Button>
              </Tooltip>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ alignItems: 'center' }}>
            {([
              { key: 'shop', label: 'Shop' },
              { key: 'line', label: 'Line' },
              { key: 'station', label: 'Station' },
              { key: 'reason', label: 'Reason' },
              { key: 'severity', label: 'Severity' },
              { key: 'status', label: 'Status' },
              { key: 'type', label: 'Type' },
              { key: 'category', label: 'Category' },
            ] as const).map((f) => (
              <FormControl key={f.key} size="small" sx={{ minWidth: 180 }}>
                <InputLabel>{f.label}</InputLabel>
                <Select
                  label={f.label}
                  value={(filters as Record<string, string>)[f.key]}
                  onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: String(e.target.value) }))}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {(options as Record<string, string[]>)[f.key].map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}

            <TextField
              size="small"
              label="Start (de)"
              type="datetime-local"
              value={filters.startFrom}
              onChange={(e) => setFilters((p) => ({ ...p, startFrom: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
            />
            <TextField
              size="small"
              label="Start (até)"
              type="datetime-local"
              value={filters.startTo}
              onChange={(e) => setFilters((p) => ({ ...p, startTo: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
            />
            <TextField
              size="small"
              label="End (de)"
              type="datetime-local"
              value={filters.endFrom}
              onChange={(e) => setFilters((p) => ({ ...p, endFrom: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
            />
            <TextField
              size="small"
              label="End (até)"
              type="datetime-local"
              value={filters.endTo}
              onChange={(e) => setFilters((p) => ({ ...p, endTo: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
            />
          </Stack>
        </Paper>

        {/* Regra 3: Feedback - Estados de loading/error/empty */}
        {loading ? (
          <LoadingState message="Carregando paradas..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStops} />
        ) : filtered.length === 0 ? (
          <EmptyState 
            message={hasActiveFilters ? "Nenhuma parada encontrada com os filtros selecionados." : "Nenhuma parada registrada."}
            action={hasActiveFilters ? clearFilters : fetchStops}
            actionLabel={hasActiveFilters ? "Limpar filtros" : "Atualizar"}
          />
        ) : (
          <Paper>
            <TableContainer sx={{ maxHeight: '70vh' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Shop</TableCell>
                    <TableCell>Line</TableCell>
                    <TableCell>Station</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Start</TableCell>
                    <TableCell>End</TableCell>
                    <TableCell>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((s, idx) => {
                    const start = getStartTime(s);
                    const end = getEndTime(s);
                    return (
                      <TableRow
                        hover
                        key={`${s.id || idx}-${start}`}
                        onClick={() => setSelection(s)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{s.shop ?? '--'}</TableCell>
                        <TableCell>{s.line ?? '--'}</TableCell>
                        <TableCell>{s.station ?? '--'}</TableCell>
                        <TableCell>{s.reason ?? '--'}</TableCell>
                        <TableCell>{String(s.severity ?? '--')}</TableCell>
                        <TableCell>{String(s.status ?? '--')}</TableCell>
                        <TableCell>{String(s.type ?? '--')}</TableCell>
                        <TableCell>{String(s.category ?? '--')}</TableCell>
                        <TableCell>{start ? formatEpochMs(start) : '--'}</TableCell>
                        <TableCell>{end ? formatEpochMs(end) : '--'}</TableCell>
                        <TableCell>{String(s.durationMs ?? '--')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              rowsPerPageOptions={[rowsPerPage]}
              rowsPerPage={rowsPerPage}
              count={filtered.length}
              page={page}
              onPageChange={(_, next) => setPage(next)}
            />
          </Paper>
        )}
      </Box>

      <DetailsDrawer
        open={Boolean(selection)}
        title={selection ? `Stop ${String((selection as unknown as Record<string, unknown>).id ?? '')}` : ''}
        sections={selection ? [{ title: 'Stop', value: selection }] : []}
        onClose={() => setSelection(null)}
      />
    </Box>
  );
}
