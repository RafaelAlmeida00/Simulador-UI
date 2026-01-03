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
import { formatEpochMs } from '../src/utils/timeFormat';
import { parseDateTimeLocal } from '../src/utils/date';
import { asArrayFromPayload, uniqStrings } from '../src/utils/safe';

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

export default function EventsPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<EventRow[]>([]);

  const [filters, setFilters] = React.useState<Filters>({
    carId: '',
    eventType: '',
    shop: '',
    line: '',
    station: '',
    timeFrom: '',
    timeTo: '',
  });

  const [page, setPage] = React.useState(0);
  const rowsPerPage = 100;

  const [selection, setSelection] = React.useState<EventRow | null>(null);

  // Regra 6: Permitir refetch
  const fetchEvents = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await http.get('/events');
      setEvents(asArrayFromPayload<EventRow>(res.data));
    } catch (e) {
      setError('Falha ao carregar os eventos. Verifique a conexão com a API.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Regra 6: Limpar todos os filtros
  const clearFilters = React.useCallback(() => {
    setFilters({
      carId: '',
      eventType: '',
      shop: '',
      line: '',
      station: '',
      timeFrom: '',
      timeTo: '',
    });
  }, []);

  // Regra 8: Verificar se há filtros ativos
  const hasActiveFilters = React.useMemo(() => {
    return Object.values(filters).some((v) => v !== '');
  }, [filters]);

  const options = React.useMemo(() => {
    return {
      carId: uniq(events.map(getCarId)),
      eventType: uniq(events.map(getEventType)),
      shop: uniq(events.map((e) => (typeof e.shop === 'string' ? e.shop : null))),
      line: uniq(events.map((e) => (typeof e.line === 'string' ? e.line : null))),
      station: uniq(events.map((e) => (typeof e.station === 'string' ? e.station : null))),
    };
  }, [events]);

  const filtered = React.useMemo(() => {
    const from = parseDateTimeLocal(filters.timeFrom);
    const to = parseDateTimeLocal(filters.timeTo);

    const matches = (e: EventRow) => {
      if (filters.carId && getCarId(e) !== filters.carId) return false;
      if (filters.eventType && getEventType(e) !== filters.eventType) return false;
      if (filters.shop && String(e.shop ?? '') !== filters.shop) return false;
      if (filters.line && String(e.line ?? '') !== filters.line) return false;
      if (filters.station && String(e.station ?? '') !== filters.station) return false;

      const ts = getTimestamp(e);
      if (from !== null && ts < from) return false;
      if (to !== null && ts > to) return false;

      return true;
    };

    const next = events.filter(matches);
    next.sort((a, b) => getTimestamp(b) - getTimestamp(a));
    return next;
  }, [events, filters]);

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
            Events
          </Typography>
          {/* Regra 1: Consistência - Contador de resultados */}
          <ResultsCount total={events.length} filtered={filtered.length} label="eventos" />
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
                  onClick={fetchEvents}
                  disabled={loading}
                >
                  Atualizar
                </Button>
              </Tooltip>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ alignItems: 'center' }}>
            {([
              { key: 'carId', label: 'Car' },
              { key: 'eventType', label: 'Event Type' },
              { key: 'shop', label: 'Shop' },
              { key: 'line', label: 'Line' },
              { key: 'station', label: 'Station' },
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
              label="Timestamp (de)"
              type="datetime-local"
              value={filters.timeFrom}
              onChange={(e) => setFilters((p) => ({ ...p, timeFrom: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
            />
            <TextField
              size="small"
              label="Timestamp (até)"
              type="datetime-local"
              value={filters.timeTo}
              onChange={(e) => setFilters((p) => ({ ...p, timeTo: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 220 }}
            />
          </Stack>
        </Paper>

        {/* Regra 3: Feedback - Estados de loading/error/empty */}
        {loading ? (
          <LoadingState message="Carregando eventos..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEvents} />
        ) : filtered.length === 0 ? (
          <EmptyState 
            message={hasActiveFilters ? "Nenhum evento encontrado com os filtros selecionados." : "Nenhum evento registrado."}
            action={hasActiveFilters ? clearFilters : fetchEvents}
            actionLabel={hasActiveFilters ? "Limpar filtros" : "Atualizar"}
          />
        ) : (
          <Paper>
            <TableContainer sx={{ maxHeight: '70vh' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Car</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Shop</TableCell>
                    <TableCell>Line</TableCell>
                    <TableCell>Station</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((e, idx) => {
                    const ts = getTimestamp(e);
                    return (
                      <Tooltip key={`${String(e.id ?? idx)}-${ts}`} title="Clique para ver detalhes" arrow>
                        <TableRow
                          hover
                          onClick={() => setSelection(e)}
                          sx={{ cursor: 'pointer' }}
                          aria-label={`Evento ${getEventType(e)} do carro ${getCarId(e)}`}
                        >
                          <TableCell>{getCarId(e) || '--'}</TableCell>
                          <TableCell>{getEventType(e) || '--'}</TableCell>
                          <TableCell>{String(e.shop ?? '--')}</TableCell>
                          <TableCell>{String(e.line ?? '--')}</TableCell>
                          <TableCell>{String(e.station ?? '--')}</TableCell>
                          <TableCell>{ts ? formatEpochMs(ts) : '--'}</TableCell>
                        </TableRow>
                      </Tooltip>
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
        title={selection ? `Event ${String(selection.id ?? '')}` : ''}
        sections={selection ? [{ title: 'Event', value: selection }] : []}
        onClose={() => setSelection(null)}
      />
    </Box>
  );
}
