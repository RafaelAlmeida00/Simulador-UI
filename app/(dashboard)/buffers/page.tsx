'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Car, Factory, Percent } from 'lucide-react';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';
import { StatsCard } from '@/src/components/data-display';
import { BufferCard, ConnectionStatus, DetailsDrawer } from '@/src/components/domain';
import { EmptyState } from '@/src/components/feedback';
import { getSocket, reconnectSocket } from '@/src/utils/socket';
import { useSimulatorSelector } from '@/src/hooks/useSimulatorStore';
import type { IBuffer, ICar } from '@/src/types/socket';

type DetailSelection =
  | { kind: 'buffer'; title: string; data: unknown }
  | { kind: 'car'; title: string; carId: string; data: unknown };

export default function BuffersPage() {
  const buffers = useSimulatorSelector((s) => s.buffersState);
  const connected = useSimulatorSelector((s) => s.connected);
  const [mounted, setMounted] = React.useState(false);
  const [selection, setSelection] = React.useState<DetailSelection | null>(null);

  React.useEffect(() => {
    setMounted(true);
    getSocket();
  }, []);

  const handleBufferClick = React.useCallback((buffer: IBuffer) => {
    setSelection({
      kind: 'buffer',
      title: `Buffer ${buffer.id}`,
      data: buffer,
    });
  }, []);

  const handleCarClick = React.useCallback((car: ICar, carId: string) => {
    setSelection({
      kind: 'car',
      title: `Carro ${carId}`,
      carId,
      data: car,
    });
  }, []);

  // Stats calculation
  const stats = React.useMemo(() => {
    if (buffers.length === 0) {
      return {
        totalBuffers: 0,
        totalCars: 0,
        totalCapacity: 0,
        avgFillRate: 0,
        fullBuffers: 0,
        emptyBuffers: 0,
      };
    }

    const totalCars = buffers.reduce((sum, b) => sum + (b.currentCount ?? 0), 0);
    const totalCapacity = buffers.reduce((sum, b) => sum + (b.capacity ?? 0), 0);
    const avgFillRate = totalCapacity > 0 ? (totalCars / totalCapacity) * 100 : 0;
    const fullBuffers = buffers.filter((b) => b.status === 'FULL').length;
    const emptyBuffers = buffers.filter((b) => b.status === 'EMPTY').length;

    return {
      totalBuffers: buffers.length,
      totalCars,
      totalCapacity,
      avgFillRate,
      fullBuffers,
      emptyBuffers,
    };
  }, [buffers]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[60px] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
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
          <h1 className="text-2xl font-bold">Buffers</h1>
          <Badge variant="outline">{buffers.length} buffers</Badge>
        </div>
        <ConnectionStatus
          connected={connected}
          connectedLabel="Online"
          disconnectedLabel="Offline"
          onReconnect={reconnectSocket}
        />
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatsCard
          title="Total de Buffers"
          value={stats.totalBuffers}
          subtitle="buffers ativos"
          icon={Package}
          iconColor="var(--color-primary)"
        />
        <StatsCard
          title="Carros em Buffer"
          value={stats.totalCars}
          subtitle={`de ${stats.totalCapacity} capacidade`}
          icon={Car}
          iconColor="var(--color-info)"
        />
        <StatsCard
          title="Taxa de Ocupacao"
          value={`${stats.avgFillRate.toFixed(1)}%`}
          subtitle="media de ocupacao"
          icon={Percent}
          iconColor="var(--color-warning)"
        />
        <StatsCard
          title="Buffers Cheios"
          value={stats.fullBuffers}
          subtitle={`${stats.emptyBuffers} vazios`}
          icon={Factory}
          iconColor={stats.fullBuffers > 0 ? 'var(--color-destructive)' : 'var(--color-success)'}
        />
      </motion.div>

      {/* Loading / Empty / Content */}
      {!connected && buffers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-8">
            <EmptyState
              type="offline"
              title="Conectando ao simulador"
              description="Aguardando conexao com o servidor de simulacao..."
              action={{ label: 'Reconectar', onClick: reconnectSocket }}
            />
          </Card>
        </motion.div>
      ) : connected && buffers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-8">
            <EmptyState
              type="no-data"
              title="Nenhum buffer disponivel"
              description="Nao ha buffers disponiveis no momento. Aguarde o simulador iniciar ou verifique a configuracao."
            />
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-4">Lista de Buffers</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {buffers.map((buffer, index) => (
                  <motion.div
                    key={buffer.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BufferCard
                      buffer={buffer}
                      onBufferClick={handleBufferClick}
                      onCarClick={handleCarClick}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Details Drawer */}
      <DetailsDrawer
        open={Boolean(selection)}
        title={selection?.title ?? ''}
        sections={
          selection
            ? [{ title: selection.kind === 'car' ? 'Detalhes do Carro' : 'Detalhes do Buffer', value: selection.data }]
            : []
        }
        onClose={() => setSelection(null)}
      />
    </div>
  );
}
