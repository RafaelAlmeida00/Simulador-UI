'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Factory, Users, AlertTriangle, Gauge, HelpCircle } from 'lucide-react';
import { reconnectSocket } from '@/src/utils/socket';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';
import { StatsCard } from '@/src/components/data-display';
import { EmptyState } from '@/src/components/feedback';
import {
  ShopLineSelector,
  SimulatorTimeDisplay,
  ConnectionStatus,
  BufferCard,
  VirtualizedStationCards,
  DetailsDrawer,
} from '@/src/components/domain';
import { stopForStationByStartTime, simulatorStore, getOEEForLine } from '@/src/stores/simulatorStore';
import type { IStopLine, IBuffer, ICar } from '@/src/types/socket';
import { normalizePlantSnapshot } from '@/src/utils/plantNormalize';
import type { NormalizedStation } from '@/src/utils/plantNormalize';
import { useSimulatorSelector } from '@/src/hooks/useSimulatorStore';
import { useNavigationKeys, wrapIndex } from '@/src/hooks/useNavigationKeys';
import { NavigationArrows } from '@/src/components/ui/navigation-arrows';

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

  const buffersState = useSimulatorSelector((s) => s.buffersState);
  const simHealth = useSimulatorSelector((s) => s.health);
  const simConnect = useSimulatorSelector((s) => s.connected);
  const stopsState = useSimulatorSelector((s) => s.stopsState);
  const oeeState = useSimulatorSelector((s) => s.oeeState);
  const plantState = useSimulatorSelector((s) => s.plantState);
  
  // Normalize plantState locally to ensure re-render when plantState changes
  const shops = React.useMemo(() => {
    if (!plantState) return [];
    return normalizePlantSnapshot(plantState)?.shops ?? [];
  }, [plantState]);

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

  // Calculate stats
  const stats = React.useMemo(() => {
    const stations = currentLine?.stations ?? [];
    const totalStations = stations.length;
    const occupiedStations = stations.filter((s) => s.occupied).length;
    const stoppedStations = stations.filter((s) => s.isStopped).length;

    // Get OEE from socket
    const oeeData = getOEEForLine(oeeState, currentShopName, `${currentShopName}-${currentLine?.name}`);
    const oee = oeeData?.oee ?? 0;

    return {
      totalStations,
      occupiedStations,
      stoppedStations,
      oee: oee?.toFixed(1),
    };
  }, [currentLine?.stations, currentLine?.name, oeeState, currentShopName]);

  const handleShopChange = React.useCallback((newShopIndex: number) => {
    setShopIndex(newShopIndex);
    setLineIndex(0);
  }, []);

  const handleLineChange = React.useCallback((newLineIndex: number) => {
    setLineIndex(newLineIndex);
  }, []);

  // Keyboard navigation: A/D/arrows for lines, W/S/arrows for shops
  useNavigationKeys({
    horizontalCount: lines.length,
    verticalCount: shops.length,
    horizontalIndex: lineIndex,
    verticalIndex: shopIndex,
    onHorizontalChange: handleLineChange,
    onVerticalChange: handleShopChange,
    enabled: mounted && shops.length > 0,
  });

  // Arrow click handlers with wrap-around (using shared wrapIndex utility)
  const handlePreviousLine = React.useCallback(() => {
    if (lines.length <= 1) return;
    handleLineChange(wrapIndex(lineIndex, lines.length, 'prev'));
  }, [lineIndex, lines.length, handleLineChange]);

  const handleNextLine = React.useCallback(() => {
    if (lines.length <= 1) return;
    handleLineChange(wrapIndex(lineIndex, lines.length, 'next'));
  }, [lineIndex, lines.length, handleLineChange]);

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
      // Ler stopsState diretamente do store para evitar re-criação do callback
      const currentStops = simulatorStore.getSnapshot().stopsState;
      const matchedStop = station.isStopped
        ? stopForStationByStartTime(currentStops, stationKey) ?? undefined
        : undefined;

      setSelection({
        kind: 'station',
        title: `Estacao ${stationName}`,
        data: station.raw,
        stationKey,
        isStopped: station.isStopped,
        matchedStop,
      });
    },
    [currentShopName, currentLine?.name]
  );

  const handleCarClick = React.useCallback(
    (car: ICar | Record<string, unknown>, carId: string) => {
      setSelection({
        kind: 'car',
        title: `Carro ${carId}`,
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
      title: `Carro ${carId}`,
      carId,
      data: car,
    });
  }, []);

  const handleLineClick = React.useCallback(() => {
    if (currentLine) {
      setSelection({
        kind: 'line',
        title: `Linha ${currentLine.name}`,
        data: currentLine.raw,
      });
    }
  }, [currentLine]);

  const details = React.useMemo(() => {
    const sel = selectionWithStop;
    if (!sel) return { open: false, title: '', sections: [] as { title: string; value: unknown }[] };

    if (sel.kind === 'car') {
      return {
        open: true,
        title: sel.title,
        sections: [{ title: 'Carro', value: sel.data }],
      };
    }

    if (sel.kind === 'station') {
      const sections: { title: string; value: unknown }[] = [{ title: 'Estacao', value: sel.data }];
      if (sel.isStopped && sel.matchedStop) {
        sections.push({ title: 'Parada (ultima)', value: sel.matchedStop });
      }
      return { open: true, title: sel.title, sections };
    }

    return {
      open: true,
      title: sel.title,
      sections: [{ title: sel.kind === 'buffer' ? 'Buffer' : 'Linha', value: sel.data }],
    };
  }, [selectionWithStop]);

  // Loading state
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatsCard
          title="Total Estacoes"
          value={stats.totalStations}
          icon={Factory}
          iconColor="var(--color-primary)"
        />
        <StatsCard
          title="Ocupadas"
          value={stats.occupiedStations}
          icon={Users}
          iconColor="var(--color-warning)"
        />
        <StatsCard
          title="Paradas"
          value={stats.stoppedStations}
          icon={AlertTriangle}
          iconColor="var(--color-destructive)"
        />
        <StatsCard
          title="OEE Linha"
          value={`${stats.oee}%`}
          icon={Gauge}
          iconColor="var(--color-success)"
        />
      </motion.div>

      {/* Header with navigation and status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-3">
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
            onReconnect={reconnectSocket}
          />
        </div>

        {/* Buffers section */}
        <div className="flex flex-col gap-2 items-end w-full md:w-auto">
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
        </div>
      </motion.div>

      {/* Main line visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        {/* Navigation Arrows */}
        <NavigationArrows
          onPrevious={handlePreviousLine}
          onNext={handleNextLine}
          previousLabel="Linha anterior"
          nextLabel="Proxima linha"
          showPrevious={lines.length > 1}
          showNext={lines.length > 1}
        />

        <Card
          onClick={handleLineClick}
          className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">Linha {currentLine?.name ?? '--'}</h2>
              <Badge variant="outline">
                Takt: {formatTakt(currentLine?.taktMn)}
              </Badge>
            </div>
          </div>

          {/* Stations row */}
          <VirtualizedStationCards
            stations={currentLine?.stations ?? []}
            shopName={currentShopName}
            lineName={currentLine?.name ?? ''}
            nowSimMs={nowSimMs}
            onStationClick={handleStationClick}
            onCarClick={handleCarClick}
          />
        </Card>
      </motion.div>

      {/* Empty state */}
      {shops.length === 0 && (
        <EmptyState
          type="no-data"
          title="Aguardando dados"
          description="Aguardando dados do simulador. Verifique se a simulacao esta em execucao."
          icon={HelpCircle}
        />
      )}

      {/* Details drawer */}
      <DetailsDrawer
        open={details.open}
        title={details.title}
        sections={details.sections}
        onClose={() => setSelection(null)}
      />
    </div>
  );
}
