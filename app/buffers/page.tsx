'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SyncIcon from '@mui/icons-material/Sync';
import SyncDisabledIcon from '@mui/icons-material/SyncDisabled';
import RefreshIcon from '@mui/icons-material/Refresh';

import { AppHeader } from '../src/components/AppHeader';
import { DetailsDrawer } from '../src/components/DetailsDrawer';
import { LoadingState, EmptyState, ErrorState, ConnectionStatus } from '../src/components/FeedbackStates';
import http from '../src/utils/http';
import { getSocket, subscribeTo } from '../src/utils/socket';
import { useSimulatorStore } from '../src/hooks/useSimulatorStore';
import { carsById } from '../src/stores/simulatorStore';
import type { BufferItem } from '../src/stores/simulatorStore';

type DetailSelection =
  | { kind: 'buffer'; title: string; data: unknown }
  | { kind: 'car'; title: string; carId: string; data: unknown };

type BufferItemUi = BufferItem & {
  /** Identificador do registro vindo do HTTP (para key estável) */
  __rowId?: string | number;
};

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
      // ignore
    }
  }
  return [];
}

function normalizeBufferItem(raw: unknown): BufferItemUi | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  // Socket/UI shape (já normalizado)
  if (typeof r.id === 'string') {
    return {
      id: r.id,
      bufferId: r.id,
      from: typeof r.from === 'string' ? r.from : undefined,
      to: typeof r.to === 'string' ? r.to : undefined,
      capacity: typeof r.capacity === 'number' ? r.capacity : undefined,
      currentCount: typeof r.currentCount === 'number' ? r.currentCount : undefined,
      status: typeof r.status === 'string' ? r.status : undefined,
      type: typeof r.type === 'string' ? r.type : undefined,
      carIds: asStringArray(r.carIds),
    };
  }

  // HTTP API shape (snake_case)
  const apiId = r.buffer_id;
  if (typeof apiId !== 'string' || !apiId.trim()) return null;

  const rowId = typeof r.id === 'number' || typeof r.id === 'string' ? r.id : undefined;
  const currentCount = typeof r.current_count === 'number' ? r.current_count : undefined;
  return {
    id: apiId,
    bufferId: apiId,
    __rowId: rowId,
    from: typeof r.from_location === 'string' ? r.from_location : undefined,
    to: typeof r.to_location === 'string' ? r.to_location : undefined,
    capacity: typeof r.capacity === 'number' ? r.capacity : undefined,
    currentCount,
    status: typeof r.status === 'string' ? r.status : undefined,
    type: typeof r.type === 'string' ? r.type : undefined,
    carIds: asStringArray(r.car_ids),
  };
}

function asBufferArray(payload: unknown): BufferItemUi[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as Record<string, unknown>).data)
      ? ((payload as Record<string, unknown>).data as unknown[])
      : [];

  // Pega o created_at do primeiro item para filtrar apenas o snapshot mais recente
  if (list.length === 0) return [];
  
  const firstItem = list[0] as Record<string, unknown> | undefined;
  const targetCreatedAt = firstItem?.created_at;

  // Filtra apenas os itens com o mesmo created_at (mesmo snapshot)
  const filteredList = targetCreatedAt
    ? list.filter((item) => {
        const r = item as Record<string, unknown>;
        return r.created_at === targetCreatedAt;
      })
    : list;

  const normalized: BufferItemUi[] = [];
  for (const item of filteredList) {
    const b = normalizeBufferItem(item);
    if (b) normalized.push(b);
  }
  return normalized;
}

export default function BuffersPage() {
  const theme = useTheme();
  const sim = useSimulatorStore();

  const [synced, setSynced] = React.useState(false);
  const [loadingHttp, setLoadingHttp] = React.useState(false);
  const [httpBuffers, setHttpBuffers] = React.useState<BufferItemUi[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const [selection, setSelection] = React.useState<DetailSelection | null>(null);

  const carsMap = React.useMemo(() => carsById(sim.cars), [sim.cars]);

  const fetchHttp = React.useCallback(async () => {
    try {
      setLoadingHttp(true);
      setError(null);
      const res = await http.get('/buffers');
      setHttpBuffers(asBufferArray(res.data));
      // Regra 4: Fechar o diálogo - Feedback de conclusão
      setSnackbar({ open: true, message: 'Dados atualizados com sucesso', severity: 'success' });
    } catch (e) {
      setError('Falha ao carregar os buffers. Verifique a conexão com a API.');
    } finally {
      setLoadingHttp(false);
    }
  }, []);

  React.useEffect(() => {
    // inicia desincronizado, mas já carrega via HTTP
    fetchHttp();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buffers: BufferItemUi[] = synced ? (sim.buffersState as BufferItemUi[]) : httpBuffers;

  // Regra 2: Atalhos - Tecla R para atualizar
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !synced && !loadingHttp) {
        e.preventDefault();
        fetchHttp();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [synced, loadingHttp, fetchHttp]);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppHeader />

      <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3, mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Buffers
          </Typography>
          {/* Regra 3: Feedback - Status de sincronização */}
          <ConnectionStatus 
            connected={synced} 
            connectedLabel="Sincronizado" 
            disconnectedLabel="Manual" 
          />
        </Stack>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          {/* Regra 7: Controle do usuário - Botão de sincronização */}
          <Tooltip title={synced ? 'Desativar atualização automática' : 'Ativar atualização em tempo real'} arrow>
            <Button
              variant="contained"
              color={synced ? 'success' : 'primary'}
              startIcon={synced ? <SyncIcon /> : <SyncDisabledIcon />}
              onClick={() => {
                if (!synced) {
                  getSocket();
                  subscribeTo('buffers');
                  setSynced(true);
                  setSnackbar({ open: true, message: 'Sincronização ativada - dados em tempo real', severity: 'info' });
                } else {
                  setSynced(false);
                  setSnackbar({ open: true, message: 'Sincronização desativada', severity: 'info' });
                }
              }}
            >
              {synced ? 'Sincronizado' : 'Sincronizar'}
            </Button>
          </Tooltip>

          {/* Regra 2: Atalhos - Dica de atalho no tooltip */}
          {!synced && (
            <Tooltip title="Atualizar dados (Atalho: R)" arrow>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />}
                onClick={fetchHttp} 
                disabled={loadingHttp}
              >
                Atualizar
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* Regra 3: Feedback - Estados de loading/error/empty */}
        {loadingHttp && !synced && (
          <LoadingState message="Carregando buffers..." />
        )}

        {error && !loadingHttp && (
          <ErrorState message={error} onRetry={fetchHttp} />
        )}

        {!loadingHttp && !error && buffers.length === 0 && (
          <EmptyState 
            message="Nenhum buffer disponível no momento." 
            action={fetchHttp}
            actionLabel="Atualizar"
          />
        )}

        {!loadingHttp && !error && buffers.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            {/* Regra 1: Consistência - Contador de resultados */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {buffers.length} buffer{buffers.length !== 1 ? 's' : ''} disponíve{buffers.length !== 1 ? 'is' : 'l'}
            </Typography>

            {buffers.map((b, idx) => {
              const count = b?.currentCount ?? (Array.isArray(b?.carIds) ? b.carIds.length : 0);
              const cap = b?.capacity ?? 0;
              const isAvailable = String(b?.status) === 'AVAILABLE' || String(b?.status) === 'EMPTY';

              return (
                <Tooltip 
                  key={String(b?.__rowId ?? `${String(b?.id ?? '')}::${String(b?.from ?? '')}::${String(b?.to ?? '')}::${idx}`)}
                  title={`Clique para ver detalhes. Status: ${b?.status ?? 'N/A'}`}
                  arrow
                >
                  <Paper
                    onClick={() => setSelection({ kind: 'buffer', title: `Buffer ${b?.id ?? ''}`, data: b })}
                    role="button"
                    tabIndex={0}
                    aria-label={`Buffer de ${b?.from ?? '--'} para ${b?.to ?? '--'}, ${count} de ${cap} ocupados`}
                    sx={{
                      p: 1.25,
                      width: { xs: '100%', sm: 520 },
                      cursor: 'pointer',
                      bgcolor: isAvailable ? theme.palette.success.light : theme.palette.error.light,
                      boxShadow: 6,
                      transition: 'transform 140ms ease, box-shadow 140ms ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 10 },
                      '&:focus': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.textStation }}>
                        {b?.from ?? '--'} → {b?.to ?? '--'}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.textStation }}>
                        {count}/{cap}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mt: 1 }}>
                      {(b?.carIds ?? []).map((carId: string) => (
                        <Tooltip key={carId} title={`Ver detalhes do carro ${carId}`} arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              const car = carsMap[String(carId)];
                              setSelection({
                                kind: 'car',
                                title: `Car ${carId}`,
                                carId: String(carId),
                                data: car ?? { id: carId },
                              });
                            }}
                            aria-label={`Ver carro ${carId}`}
                            sx={{ color: theme.palette.icon }}
                          >
                            <DirectionsCarIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ))}
                    </Stack>
                  </Paper>
                </Tooltip>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Regra 3: Feedback - Snackbar de notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <DetailsDrawer
        open={Boolean(selection)}
        title={selection?.title ?? ''}
        sections={selection ? [{ title: selection.kind === 'car' ? 'Car' : 'Buffer', value: selection.data }] : []}
        onClose={() => setSelection(null)}
      />
    </Box>
  );
}
