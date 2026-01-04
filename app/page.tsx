"use client";

import * as React from 'react';
import { useEffect } from 'react';
import { getSocket } from './src/utils/socket';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EngineeringIcon from '@mui/icons-material/Engineering';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

import { AppHeader } from './src/components/AppHeader';
import { DetailsDrawer } from './src/components/DetailsDrawer';
import { useSimulatorStore } from './src/hooks/useSimulatorStore';
import { carsById, stopForStationByStartTime } from './src/stores/simulatorStore';
import type { Stop } from './src/stores/simulatorStore';
import type { BufferItem } from './src/stores/simulatorStore';
import { normalizePlantSnapshot } from './src/utils/plantNormalize';
import { formatEpochMs, formatSimTime } from './src/utils/timeFormat';
import { ConnectionStatus, EmptyState, LoadingState } from './src/components/FeedbackStates';
import { reconnectSocket } from './src/utils/socket';

type DetailSelection =
  | { kind: 'line'; title: string; data: unknown }
  | {
    kind: 'station';
    title: string;
    data: unknown;
    stationKey: { shop?: string; line?: string; station?: string; startTime?: number | string | null };
    isStopped?: boolean;
    matchedStop?: Stop;
  }
  | { kind: 'buffer'; title: string; data: unknown }
  | { kind: 'car'; title: string; carId: string; data: unknown };

function clampIndex(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function HomePage() {
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => setMounted(true), []);
  const theme = useTheme();
  const sim = useSimulatorStore();

  const plant = React.useMemo(() => normalizePlantSnapshot(sim.plantState), [sim.plantState]);
  const shops = plant.shops;

  const [shopIndex, setShopIndex] = React.useState(0);
  const [lineIndex, setLineIndex] = React.useState(0);
  const [selection, setSelection] = React.useState<DetailSelection | null>(null);

  const currentShop = shops[shopIndex];
  const currentLine = currentShop?.lines?.[lineIndex];

  const currentShopName = currentShop?.name ?? 'SHOP';
  const simTime = mounted ? formatSimTime(sim.health?.data?.simulatorTimestamp) : '--:--:--';

  const formatTakt = React.useCallback((v?: number) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return '--';
    return v.toFixed(2);
  }, []);

  const buffers = React.useMemo(() => sim.buffersState, [sim.buffersState]);
  const carsMap = React.useMemo(() => carsById(sim.cars), [sim.cars]);

  const nowSimMs = mounted ? (sim.health?.data?.simulatorTimestamp ?? null) : null;

  // manter índices válidos quando snapshot muda
  useEffect(() => {
    if (!shops.length) {
      setShopIndex(0);
      setLineIndex(0);
      return;
    }
    const sIdx = clampIndex(shopIndex, 0, shops.length - 1);
    const lines = shops[sIdx]?.lines ?? [];
    const lIdx = clampIndex(lineIndex, 0, Math.max(0, lines.length - 1));
    if (sIdx !== shopIndex) setShopIndex(sIdx);
    if (lIdx !== lineIndex) setLineIndex(lIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops.length]);

  useEffect(() => {
    // Mantém o socket vivo entre navegações.
    // Importante: chamar disconnect() aqui desabilita auto-reconnect e derruba as rooms.
    getSocket();
  }, []);

  const isLastLineOfShop = Boolean(currentShop && currentShop.lines && lineIndex === currentShop.lines.length - 1);

  const shopBuffers = React.useMemo(() => {
    if (!buffers.length) return { normal: [] as BufferItem[], rework: [] as BufferItem[] };

    const lineName = currentLine?.name;
    const lineId = currentLine?.id;
    const shopName = currentShopName;

    // Buffers normais: filtrar por origem (from) igual à linha atual
    const normalBuffers = buffers.filter(
      (b) => b.type !== 'REWORK_BUFFER' && (b.from === lineName || b.from === lineId)
    );

    // Buffers de rework: filtrar por origem (from) igual ao shop atual
    // REWORK_BUFFER tem from = "Paint" ou "Trim" (nome do shop, não da linha)
    const reworkBuffers = buffers.filter(
      (b) => b.type === 'REWORK_BUFFER' && (b.from === shopName || b.from === currentShop?.name)
    );

    return { normal: normalBuffers, rework: reworkBuffers };
  }, [buffers, currentLine?.name, currentLine?.id, currentShopName, currentShop?.name]);

  // Handlers para dropdowns de navegação
  const handleShopChange = React.useCallback((newShopIndex: number) => {
    setShopIndex(newShopIndex);
    setLineIndex(0); // Reset para primeira linha do novo shop
  }, []);

  const handleLineChange = React.useCallback((newLineIndex: number) => {
    setLineIndex(newLineIndex);
  }, []);

  // Resolve a stop por match exato (shop/line/station/startTime) sem ficar oscilando a cada update do socket.
  useEffect(() => {
    if (!selection || selection.kind !== 'station') return;
    if (!selection.isStopped) return;
    if (selection.matchedStop) return;
    const stop = stopForStationByStartTime(sim.stops, selection.stationKey);
    if (!stop) return;
    setSelection((prev) => {
      if (!prev || prev.kind !== 'station') return prev;
      // não sobrescreve caso já tenha sido resolvido por outro render
      if (prev.matchedStop) return prev;
      return { ...prev, matchedStop: stop };
    });
  }, [selection, sim.stops]);

  const details = React.useMemo(() => {
    if (!selection) return { open: false, title: '', sections: [] as { title: string; value: unknown }[] };

    if (selection.kind === 'car') {
      return {
        open: true,
        title: selection.title,
        sections: [{ title: 'Car', value: selection.data }],
      };
    }

    if (selection.kind === 'station') {
      const sections: { title: string; value: unknown }[] = [{ title: 'Station', value: selection.data }];
      if (selection.isStopped) {
        if (selection.matchedStop) sections.push({ title: 'Parada (última)', value: selection.matchedStop });
      }
      return { open: true, title: selection.title, sections };
    }

    return {
      open: true,
      title: selection.title,
      sections: [{ title: selection.kind === 'buffer' ? 'Buffer' : 'Line', value: selection.data }],
    };
  }, [selection]);

  // Regra 3: Feedback - Mostrar estado de carregamento inicial
  if (!mounted) {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <AppHeader />
        <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3, mt: 3 }}>
          <LoadingState message="Inicializando simulador..." />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppHeader />

      <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Dropdown de Shop */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={shops.length > 0 ? shopIndex : ''}
                onChange={(e) => handleShopChange(Number(e.target.value))}
                displayEmpty
                sx={{ fontWeight: 700 }}
              >
                {shops.length === 0 ? (
                  <MenuItem value="" disabled>Sem shops</MenuItem>
                ) : (
                  shops.map((shop, idx) => (
                    <MenuItem key={shop.id} value={idx}>
                      {shop.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Dropdown de Linha */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={currentShop?.lines?.length ? lineIndex : ''}
                onChange={(e) => handleLineChange(Number(e.target.value))}
                displayEmpty
                sx={{ fontWeight: 700 }}
              >
                {!currentShop?.lines?.length ? (
                  <MenuItem value="" disabled>Sem linhas</MenuItem>
                ) : (
                  currentShop.lines.map((line, idx) => (
                    <MenuItem key={line.id} value={idx}>
                      {line.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Regra 3: Feedback - Mostrar tempo da simulação */}
            <Tooltip title="Tempo atual da simulação" arrow>
              <Box
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.10),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                  {simTime}
                </Typography>
              </Box>
            </Tooltip>

            {/* Regra 3: Feedback - Status de conexão */}
            <ConnectionStatus 
              connected={sim.connected} 
              connectedLabel="Online" 
              disconnectedLabel="Offline" 
            />

            {!sim.connected && (
              <Tooltip title="Reconectar / reinscrever nas rooms" arrow>
                <IconButton
                  size="small"
                  onClick={() => reconnectSocket()}
                  aria-label="Reconectar"
                  sx={{ color: theme.palette.icon }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Stack
            direction="column"
            spacing={1}
            sx={{ alignItems: { xs: 'stretch', md: 'flex-end' }, width: { xs: '100%', md: 'auto' } }}
          >
            {shopBuffers.normal.map((b: BufferItem) => {
              const count = b?.currentCount ?? (Array.isArray(b?.carIds) ? b.carIds.length : 0);
              const cap = b?.capacity ?? 0;
              const isAvailable = String(b?.status) === 'AVAILABLE' || String(b?.status) === 'EMPTY';
              return (
                <Tooltip key={String(b?.id ?? b?.from ?? '')} title={`Buffer: ${b?.from ?? '--'} → ${b?.to ?? '--'} (${count}/${cap})`} arrow>
                  <Paper
                  onClick={() => setSelection({ kind: 'buffer', title: `Buffer ${b?.id ?? ''}`, data: b })}
                  role="button"
                  tabIndex={0}
                  sx={{
                    p: 1,
                    minWidth: { xs: '100%', md: 320 },
                    cursor: 'pointer',
                    bgcolor: isAvailable ? theme.palette.success.light : theme.palette.error.light,
                    boxShadow: 6,
                    transition: 'transform 140ms ease, box-shadow 140ms ease',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 10 },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, p: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.textStation }}>
                      {b?.from ?? '--'} - {b?.to ?? '--'}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: theme.palette.textStation }}>
                      {count} - {cap}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {(b?.carIds ?? []).map((carId: string) => (
                      <IconButton
                        key={carId}
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
                        aria-label={`Carro ${carId}`}
                        sx={{ color: theme.palette.icon }}
                      >
                        <DirectionsCarIcon fontSize="small" sx={{ color: theme.palette.icon }} />
                      </IconButton>
                    ))}
                  </Box>
                </Paper>
                </Tooltip>
              );
            })}

            {isLastLineOfShop &&
              shopBuffers.rework.map((b: BufferItem) => {
                const count = b?.currentCount ?? (Array.isArray(b?.carIds) ? b.carIds.length : 0);
                const cap = b?.capacity ?? 0;
                const isAvailable = String(b?.status) === 'AVAILABLE' || String(b?.status) === 'EMPTY';
                return (
                  <Paper
                    key={String(b?.id ?? 'rework')}
                    onClick={() => setSelection({ kind: 'buffer', title: `Rework ${b?.id ?? ''}`, data: b })}
                    role="button"
                    tabIndex={0}
                    sx={{
                      p: 1,
                      minWidth: { xs: '100%', md: 340 },
                      cursor: 'pointer',
                      bgcolor: isAvailable ? theme.palette.success.light : theme.palette.error.light,
                      boxShadow: 6,
                      transition: 'transform 140ms ease, box-shadow 140ms ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 10 },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: theme.palette.textStation, gap: 1 }}>
                      <Typography variant="subtitle2">
                        {b?.from ?? '--'} - {b?.to ?? '--'}
                      </Typography>
                      <Typography variant="subtitle2">
                        {count} - {cap}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {(b?.carIds ?? []).map((carId: string) => (
                        <IconButton
                          key={carId}
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
                          aria-label={`Carro ${carId}`}
                          sx={{ color: theme.palette.icon }}
                        >
                          <DirectionsCarIcon fontSize="small" />
                        </IconButton>
                      ))}
                    </Box>
                  </Paper>
                );
              })}
          </Stack>
        </Box>

        <Box sx={{ position: 'relative' }}>
          <Paper
            onClick={() => currentLine && setSelection({ kind: 'line', title: `Line ${currentLine.name}`, data: currentLine.raw })}
            role="button"
            tabIndex={0}
            sx={{
              width: '100%',
              p: { xs: 1.5, sm: 2 },
              cursor: currentLine ? 'pointer' : 'default',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1,
                mb: 1.5,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Takt Time: {formatTakt(currentLine?.taktMn)}
              </Typography>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
              <Stack direction="row" spacing={1.5} sx={{ minWidth: 'max-content', pb: 0.5 }}>
                {(currentLine?.stations ?? []).map((st) => {
                  const isStopped = Boolean(st.isStopped);
                  const isOccupied = Boolean(st.occupied);
                  const bg = isStopped
                    ? theme.palette.error.light
                    : isOccupied
                      ? theme.palette.warning.light
                      : theme.palette.success.light;

                  const statusText = isStopped ? (st.stopReason ?? 'STOPPED') : isOccupied ? 'Operando' : 'Vazia';
                  const carId = st.currentCarId ? String(st.currentCarId) : '';
                  const lineCandidates = [currentLine?.name, currentLine?.id].filter((v): v is string => Boolean(v));
                  const stationCandidates = [st.name, st.id].filter((v): v is string => Boolean(v));

                  const car = carId ? carsMap[carId] : undefined;
                  const trace = (car as { trace?: unknown } | undefined)?.trace;
                  const enterTs = Array.isArray(trace)
                    ? trace.find((t) => {
                      const tr = t as { line?: unknown; station?: unknown };
                      const line = typeof tr?.line === 'string' ? tr.line : String(tr?.line ?? '');
                      const station = typeof tr?.station === 'string' ? tr.station : String(tr?.station ?? '');
                      return lineCandidates.includes(line) && stationCandidates.includes(station);
                    })
                    : undefined;

                  const enterMs =
                    typeof (enterTs as { enter?: unknown } | undefined)?.enter === 'number' &&
                      Number.isFinite((enterTs as { enter?: unknown } | undefined)?.enter)
                      ? ((enterTs as { enter?: unknown } | undefined)?.enter as number)
                      : null;

                  const elapsedSec = enterMs && nowSimMs ? Math.max(0, Math.floor((nowSimMs - enterMs) / 1000)) : 0;
                  const [shopName, lineName, stName] = st.name.split('-');
                  return (
                    <Paper
                      key={st.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        const stationKey = {
                          shop: currentShopName,
                          line: currentLine?.name,
                          station: stName,
                          startTime: st.startStop ?? null,
                        };
                        const matchedStop = isStopped ? stopForStationByStartTime(sim.stops, stationKey) ?? undefined : undefined;
                        setSelection({
                          kind: 'station',
                          title: `Station ${stName}`,
                          data: st.raw,
                          stationKey,
                          isStopped,
                          matchedStop,
                        });
                      }}
                      role="button"
                      tabIndex={0}
                      sx={{
                        width: 300,
                        minHeight: 140,
                        p: 1.25,
                        cursor: 'pointer',
                        bgcolor: bg,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.textStation }} noWrap>
                          {stName} - {formatTakt(st.taktSg)}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: theme.palette.textStation }}>
                            {statusText}
                          </Typography>
                          {isStopped ? (
                            <Typography variant="caption" sx={{ display: 'block', color: theme.palette.textStation }}>
                              {typeof st.startStop === 'number'
                                ? formatEpochMs(st.startStop)
                                : String(st.startStop ?? '')}
                            </Typography>
                          ) : null}
                        </Box>
                      </Box>

                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {st.currentCarId ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.textStation }}>
                              {String(st.currentCarId)} - {elapsedSec}s
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isOccupied ? <EngineeringIcon sx={{ color: theme.palette.icon }} /> : null}
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const carId = String(st.currentCarId);
                                  const car = carsMap[carId];
                                  setSelection({ kind: 'car', title: `Car ${carId}`, carId, data: car ?? { id: carId } });
                                }}
                                aria-label={`Abrir carro ${st.currentCarId}`}
                                sx={{ color: theme.palette.icon }}
                              >
                                <DirectionsCarIcon fontSize="large" />
                              </IconButton>
                              {isOccupied ? <EngineeringIcon sx={{ color: theme.palette.icon }} /> : null}
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: theme.palette.textStation }}>
                            sem carro
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          </Paper>
        </Box>

        {/* Regra 8: Redução da carga de memória - Empty state informativo */}
        {shops.length === 0 && (
          <EmptyState 
            message="Aguardando dados do simulador. Verifique se a simulação está em execução." 
            icon={HelpOutlineIcon}
          />
        )}
      </Box>

      <DetailsDrawer
        open={details.open}
        title={details.title}
        sections={details.sections}
        onClose={() => setSelection(null)}
      />
    </Box>
  );
}
