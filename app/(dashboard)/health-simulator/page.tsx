'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Server,
  Database,
  Clock,
  HardDrive,
  Wifi,
  Play,
  Pause,
  RotateCcw,
  Square,
} from 'lucide-react';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Progress } from '@/src/components/ui/progress';
import { ScrollArea } from '@/src/components/ui/scroll-area';
import { Separator } from '@/src/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/components/ui/tooltip';
import { StatsCard, StatusBadge } from '@/src/components/data-display';
import { EmptyState } from '@/src/components/feedback';
import http from '@/src/utils/http';
import {
  getSubscribedRooms,
  getSubscribedRoomsCount,
  sendSimulatorControl,
  type SimulatorAction,
  type ControlSimulatorResponse,
} from '@/src/utils/socket';
import { isDatabaseConnected } from '@/src/utils/databaseStatus';
import { useSimulatorSelector } from '@/src/hooks/useSimulatorStore';
import { cn } from '@/src/lib/utils';

// Memory constants
const TOTAL_RAM_MB = 16384; // 16GB
const TARGET_RAM_MB = 8192; // 8GB target

type MemoryData = {
  heapUsed?: string;
  heapTotal?: string;
  external?: string;
  rss?: string;
};

type HealthData = {
  status?: string;
  simulatorTimestamp?: number;
  uptime?: number;
  memory?: MemoryData;
  connections?: {
    websocket?: number;
    database?: boolean;
  };
  version?: string;
  [key: string]: unknown;
};

type HealthResponse = {
  data?: HealthData;
  [key: string]: unknown;
};

export default function HealthSimulatorPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<HealthResponse | null>(null);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const [controlLoading, setControlLoading] = React.useState(false);
  const [controlFeedback, setControlFeedback] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Get real-time status from store
  const health = useSimulatorSelector((s) => s.health);
  const connected = useSimulatorSelector((s) => s.connected);

  // Get simulator status from real-time health data
  const simulatorStatus = health?.data?.simulatorStatus ?? 'stopped';

  const fetchHealth = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await http.get('/health/detailed');
      setData(res.data);
      setLastUpdate(new Date());
    } catch {
      setError('Falha ao carregar os dados de saude do simulador. Verifique a conexao com a API.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Keyboard shortcut to refresh
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !loading) {
        e.preventDefault();
        fetchHealth();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loading, fetchHealth]);

  // Handle simulator control
  const handleSimulatorControl = React.useCallback((action: SimulatorAction) => {
    setControlLoading(true);
    setControlFeedback(null);

    sendSimulatorControl(action, (response: ControlSimulatorResponse) => {
      setControlLoading(false);
      if (response.success) {
        setControlFeedback({ message: `Comando "${action}" executado com sucesso`, type: 'success' });
        // Refresh health data after control action
        setTimeout(() => fetchHealth(), 500);
      } else {
        setControlFeedback({ message: response.error ?? 'Erro ao executar comando', type: 'error' });
      }
      // Clear feedback after 3 seconds
      setTimeout(() => setControlFeedback(null), 3000);
    });
  }, [fetchHealth]);

  // Determine overall status
  const healthData = React.useMemo((): HealthData | null => {
    if (!data) return null;
    if (data.data && typeof data.data === 'object') {
      return data.data as HealthData;
    }
    return data as unknown as HealthData;
  }, [data]);

  const isHealthy = React.useMemo(() => {
    return healthData?.status === 'healthy' || healthData?.status === 'ok';
  }, [healthData]);

  // Format uptime (input is in milliseconds)
  const formatUptime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Parse memory string to MB number
  const parseMemoryMB = (str: string | undefined): number => {
    if (!str) return 0;
    const match = str.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Format timestamp
  const formatTimestamp = (date: Date | null): string => {
    if (!date) return '--';
    return date.toLocaleString('pt-BR');
  };

  // Get WebSocket rooms info
  const wsRoomsCount = getSubscribedRoomsCount();
  const wsRoomsList = getSubscribedRooms().join(', ');

  // Get database status from global state
  const dbConnected = isDatabaseConnected();

  // Calculate memory usage
  const memoryInfo = React.useMemo(() => {
    const memory = healthData?.memory;
    if (!memory) return null;

    const rss = parseMemoryMB(memory.rss);
    const heapUsed = parseMemoryMB(memory.heapUsed);
    const heapTotal = parseMemoryMB(memory.heapTotal);
    const external = parseMemoryMB(memory.external);

    const percentOfTarget = (rss / TARGET_RAM_MB) * 100;
    const percentOfSystem = (rss / TOTAL_RAM_MB) * 100;

    return {
      rss,
      heapUsed,
      heapTotal,
      external,
      percentOfTarget: Math.min(percentOfTarget, 100),
      percentOfSystem,
    };
  }, [healthData?.memory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Health Simulator</h1>
          {!loading && !error && (
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant={isHealthy ? 'success' : 'destructive'}
                  className="gap-1"
                >
                  {isHealthy ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {isHealthy ? 'Saudavel' : 'Atencao'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {isHealthy ? 'Simulador funcionando normalmente' : 'Simulador com problemas'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Ultima atualizacao: {formatTimestamp(lastUpdate)}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealth}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar (R)
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pressione R para atualizar</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      ) : error ? (
        <Card className="p-8">
          <EmptyState
            type="error"
            title="Erro ao carregar"
            description={error}
            action={{ label: 'Tentar novamente', onClick: fetchHealth }}
          />
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <StatsCard
              title="Status"
              value={healthData?.status ?? '--'}
              subtitle={isHealthy ? 'Operacional' : 'Verificar'}
              icon={Activity}
              iconColor={isHealthy ? 'var(--color-success)' : 'var(--color-destructive)'}
            />
            <StatsCard
              title="Uptime"
              value={healthData?.uptime ? formatUptime(healthData.uptime) : '--'}
              subtitle="tempo ativo"
              icon={Clock}
              iconColor="var(--color-info)"
            />
            <StatsCard
              title="WebSocket"
              value={wsRoomsCount}
              subtitle={'Salas inscritas'}
              icon={Wifi}
              iconColor={connected ? 'var(--color-success)' : 'var(--color-destructive)'}
            />
            <StatsCard
              title="Database"
              value={dbConnected ? 'Ativo' : 'Error'}
              subtitle={dbConnected ? 'operacional' : 'verificar conexao'}
              icon={Database}
              iconColor={dbConnected ? 'var(--color-success)' : 'var(--color-destructive)'}
            />
          </motion.div>

          {/* Simulator Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Server className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Controles da Simulacao</h3>
                <div className={cn(
                  'ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1',
                  simulatorStatus === 'running' && 'bg-success/20 text-success',
                  simulatorStatus === 'paused' && 'bg-warning/20 text-warning',
                  simulatorStatus === 'stopped' && 'bg-destructive/20 text-destructive'
                )}>
                  {simulatorStatus === 'running' && <Play className="h-3 w-3" />}
                  {simulatorStatus === 'paused' && <Pause className="h-3 w-3" />}
                  {simulatorStatus === 'stopped' && <Square className="h-3 w-3" />}
                  <span className="text-xs font-medium capitalize">
                    {simulatorStatus}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={simulatorStatus === 'running' ? 'success' : 'outline'}
                      size="sm"
                      onClick={() => handleSimulatorControl('start')}
                      disabled={controlLoading || simulatorStatus === 'running'}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Iniciar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Iniciar simulacao</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={simulatorStatus === 'paused' ? 'warning' : 'outline'}
                      size="sm"
                      onClick={() => handleSimulatorControl('pause')}
                      disabled={controlLoading || simulatorStatus !== 'running'}
                      className="gap-2"
                    >
                      <Pause className="h-4 w-4" />
                      Pausar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Pausar simulacao</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimulatorControl('restart')}
                      disabled={controlLoading}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reiniciar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reiniciar simulacao do zero</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimulatorControl('stop')}
                      disabled={controlLoading || simulatorStatus === 'stopped'}
                      className="gap-2 hover:text-destructive hover:border-destructive"
                    >
                      <Square className="h-4 w-4" />
                      Parar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Parar simulacao</TooltipContent>
                </Tooltip>
              </div>

              {controlFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'mt-3 text-sm px-3 py-2 rounded-lg',
                    controlFeedback.type === 'success' && 'bg-success/20 text-success',
                    controlFeedback.type === 'error' && 'bg-destructive/20 text-destructive'
                  )}
                >
                  {controlFeedback.message}
                </motion.div>
              )}
            </Card>
          </motion.div>

          {/* Memory Card */}
          {memoryInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Memoria</h3>
                </div>
                <div className="space-y-4">
                  {/* RSS - Resident Set Size (real physical memory) */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">RSS (Memoria Fisica)</span>
                      <span className="font-medium">
                        {memoryInfo.rss.toFixed(0)} MB / {(TARGET_RAM_MB / 1024).toFixed(0)} GB (target) / {(TOTAL_RAM_MB / 1024).toFixed(0)} GB (total)
                      </span>
                    </div>
                    <Progress
                      value={memoryInfo.percentOfTarget}
                      className="h-3"
                      indicatorClassName={
                        memoryInfo.percentOfTarget < 50
                          ? 'bg-success'
                          : memoryInfo.percentOfTarget < 75
                          ? 'bg-warning'
                          : 'bg-destructive'
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{memoryInfo.percentOfTarget.toFixed(1)}% do target (8GB)</span>
                      <span>{memoryInfo.percentOfSystem.toFixed(2)}% do sistema (16GB)</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Heap Details */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Heap Usado</span>
                      <span className="font-medium">{memoryInfo.heapUsed.toFixed(0)} MB</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Heap Total</span>
                      <span className="font-medium">{memoryInfo.heapTotal.toFixed(0)} MB</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">External</span>
                      <span className="font-medium">{memoryInfo.external.toFixed(0)} MB</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-end">
                    <StatusBadge
                      status={
                        memoryInfo.percentOfTarget < 50
                          ? 'success'
                          : memoryInfo.percentOfTarget < 75
                          ? 'warning'
                          : 'error'
                      }
                      label={
                        memoryInfo.percentOfTarget < 50
                          ? 'Normal'
                          : memoryInfo.percentOfTarget < 75
                          ? 'Elevado'
                          : 'Critico'
                      }
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Server className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Informacoes do Sistema</h3>
              </div>

              {healthData?.version && (
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">Versao: {healthData.version}</Badge>
                </div>
              )}

              {healthData?.simulatorTimestamp && (
                <div className="text-sm text-muted-foreground mb-4">
                  Timestamp do Simulador: {new Date(healthData.simulatorTimestamp).toLocaleString('pt-BR')}
                </div>
              )}

              <Separator className="my-4" />

              <h4 className="text-sm font-semibold mb-3">Dados Completos (JSON)</h4>
              <ScrollArea className="h-[300px] rounded-lg bg-muted">
                <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </ScrollArea>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
