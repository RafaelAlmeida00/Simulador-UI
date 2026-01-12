"use client";

import * as React from 'react';
import { useEffect } from 'react';
import { getSocket, reconnectSocket } from './src/utils/socket';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { AppHeader } from './src/components/AppHeader';
import { DetailsDrawer } from './src/components/DetailsDrawer';
import { VirtualizedStationCards } from './src/components/VirtualizedStationCards';
import { BufferCard } from './src/components/BufferCard';
import { ShopLineSelector } from './src/components/ShopLineSelector';
import { SimulatorTimeDisplay } from './src/components/SimulatorTimeDisplay';
import { ConnectionStatus, EmptyState, LoadingState } from './src/components/FeedbackStates';
import { stopForStationByStartTime } from './src/stores/simulatorStore';
import type { IStopLine, IBuffer, ICar } from './src/types/socket';
import type { NormalizedStation } from './src/utils/plantNormalize';
import { useSimulatorSelector } from './src/hooks/useSimulatorStore';

type DetailSelection =
  | { kind: 'line'; title: string; data: unknown }
  | {
    kind: 'station';
    title: string;
    data: unknown;
    stationKey: { shop?: string; line?: string; station?: string; startTime?: number | string | null };
    isStopped?: boolean;
    matchedStop?: IStopLine;
  }
  | { kind: 'buffer'; title: string; data: unknown }
  | { kind: 'car'; title: string; carId: string; data: unknown };

function clampIndex(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTakt(v?: number): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '--';
  return v.toFixed(2);
}

export default function HomePage() {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const theme = useTheme();
  const buffersState = useSimulatorSelector(s => s.buffersState);
  const simHealth = useSimulatorSelector(s => s.health);
  const simConnect = useSimulatorSelector(s => s.connected);
  const stopsState = useSimulatorSelector(s => s.stopsState);
  const shops = useSimulatorSelector(s => s.getNormalizedPlant()?.shops ?? []);

  const [rawShopIndex, setShopIndex] = React.useState(0);
  const [rawLineIndex, setLineIndex] = React.useState(0);
  const [selection, setSelection] = React.useState<DetailSelection | null>(null);

  const shopIndex = shops.length > 0 ? clampIndex(rawShopIndex, 0, shops.length - 1) : 0;
  const currentShop = shops[shopIndex];
  const lines = currentShop?.lines ?? [];
  const lineIndex = lines.length > 0 ? clampIndex(rawLineIndex, 0, lines.length - 1) : 0;
  const currentLine = lines[lineIndex];
  const currentShopName = currentShop?.name ?? 'SHOP';

  const nowSimMs = mounted ? (simHealth?.data?.simulatorTimestamp ?? null) : null;

  const buffers = buffersState;

  useEffect(() => {
    getSocket();
  }, []);

  const isLastLineOfShop = Boolean(
    currentShop && currentShop.lines && lineIndex === currentShop.lines.length - 1
  );

  const shopBuffers = React.useMemo(() => {
    if (!buffers.length) return { normal: [] as IBuffer[], rework: [] as IBuffer[] };

    const lineName = currentLine?.name;
    const lineId = currentLine?.id;
    const shopName = currentShopName;

    const normalBuffers = buffers.filter(
      (b) => b.type !== 'REWORK_BUFFER' && (b.from === lineName || b.from === lineId)
    );

    const reworkBuffers = buffers.filter(
      (b) => b.type === 'REWORK_BUFFER' && (b.from === shopName || b.from === currentShop?.name)
    );

    return { normal: normalBuffers, rework: reworkBuffers };
  }, [buffers, currentLine?.name, currentLine?.id, currentShopName, currentShop?.name]);

  const handleShopChange = React.useCallback((newShopIndex: number) => {
    setShopIndex(newShopIndex);
    setLineIndex(0);
  }, []);

  const handleLineChange = React.useCallback((newLineIndex: number) => {
    setLineIndex(newLineIndex);
  }, []);

  const selectionWithStop = React.useMemo(() => {
    if (!selection || selection.kind !== 'station') return selection;
    if (!selection.isStopped) return selection;
    if (selection.matchedStop) return selection;

    const stop = stopForStationByStartTime(stopsState, selection.stationKey);
    if (!stop) return selection;

    return { ...selection, matchedStop: stop };
  }, [selection, stopsState]);

  const handleStationClick = React.useCallback(
    (station: NormalizedStation) => {
      const stationName = station.name.split('-').pop() ?? station.name;
      const stationKey = {
        shop: currentShopName,
        line: currentLine?.name,
        station: stationName,
        startTime: station.startStop ?? null,
      };
      const matchedStop = station.isStopped
        ? stopForStationByStartTime(stopsState, stationKey) ?? undefined
        : undefined;

      setSelection({
        kind: 'station',
        title: `Station ${stationName}`,
        data: station.raw,
        stationKey,
        isStopped: station.isStopped,
        matchedStop,
      });
    },
    [currentShopName, currentLine?.name, stopsState]
  );

  const handleCarClick = React.useCallback(
    (car: ICar | Record<string, unknown>, carId: string) => {
      setSelection({
        kind: 'car',
        title: `Car ${carId}`,
        carId,
        data: car,
      });
    },
    []
  );

  const handleBufferClick = React.useCallback((buffer: IBuffer) => {
    setSelection({
      kind: 'buffer',
      title: `Buffer ${buffer.id}`,
      data: buffer,
    });
  }, []);

  const handleBufferCarClick = React.useCallback((car: ICar, carId: string) => {
    setSelection({
      kind: 'car',
      title: `Car ${carId}`,
      carId,
      data: car,
    });
  }, []);

  const details = React.useMemo(() => {
    const sel = selectionWithStop;
    if (!sel) return { open: false, title: '', sections: [] as { title: string; value: unknown }[] };

    if (sel.kind === 'car') {
      return {
        open: true,
        title: sel.title,
        sections: [{ title: 'Car', value: sel.data }],
      };
    }

    if (sel.kind === 'station') {
      const sections: { title: string; value: unknown }[] = [{ title: 'Station', value: sel.data }];
      if (sel.isStopped && sel.matchedStop) {
        sections.push({ title: 'Parada (ultima)', value: sel.matchedStop });
      }
      return { open: true, title: sel.title, sections };
    }

    return {
      open: true,
      title: sel.title,
      sections: [{ title: sel.kind === 'buffer' ? 'Buffer' : 'Line', value: sel.data }],
    };
  }, [selectionWithStop]);

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
        {/* Header with navigation and status */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <ShopLineSelector
              shops={shops}
              shopIndex={shopIndex}
              lineIndex={lineIndex}
              onShopChange={handleShopChange}
              onLineChange={handleLineChange}
            />

            <SimulatorTimeDisplay timestamp={simHealth?.data?.simulatorTimestamp} />

            <ConnectionStatus
              connected={simConnect}
              connectedLabel="Online"
              disconnectedLabel="Offline"
            />

            {!simConnect && (
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

          {/* Buffers section */}
          <Stack
            direction="column"
            spacing={1}
            sx={{ alignItems: { xs: 'stretch', md: 'flex-end' }, width: { xs: '100%', md: 'auto' } }}
          >
            {shopBuffers.normal.map((buffer) => (
              <BufferCard
                key={buffer.id}
                buffer={buffer}
                variant={buffer.type}
                onBufferClick={handleBufferClick}
                onCarClick={handleBufferCarClick}
              />
            ))}

            {isLastLineOfShop &&
              shopBuffers.rework.map((buffer) => (
                <BufferCard
                  key={buffer.id}
                  buffer={buffer}
                  variant={buffer.type}
                  onBufferClick={handleBufferClick}
                  onCarClick={handleBufferCarClick}
                />
              ))}
          </Stack>
        </Box>

        {/* Main line visualization */}
        <Box sx={{ position: 'relative' }}>
          <Paper
            onClick={() =>
              currentLine &&
              setSelection({ kind: 'line', title: `Line ${currentLine.name}`, data: currentLine.raw })
            }
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

            {/* Stations row */}
            <VirtualizedStationCards
              stations={currentLine?.stations ?? []}
              shopName={currentShopName}
              lineName={currentLine?.name ?? ''}
              nowSimMs={nowSimMs}
              onStationClick={handleStationClick}
              onCarClick={handleCarClick}
            />
          </Paper>
        </Box>

        {/* Empty state */}
        {shops.length === 0 && (
          <EmptyState
            message="Aguardando dados do simulador. Verifique se a simulacao esta em execucao."
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
