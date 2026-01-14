'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Server,
  Database,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
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

type HealthData = {
  status?: string;
  simulatorTimestamp?: number;
  uptime?: number;
  memory?: {
    used?: number;
    total?: number;
    percentage?: number;
  };
  cpu?: {
    usage?: number;
  };
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

  // Format uptime
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Format timestamp
  const formatTimestamp = (date: Date | null): string => {
    if (!date) return '--';
    return date.toLocaleString('pt-BR');
  };

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
              value={healthData?.connections?.websocket ?? 0}
              subtitle="conexoes ativas"
              icon={Wifi}
              iconColor="var(--color-primary)"
            />
            <StatsCard
              title="Database"
              value={healthData?.connections?.database ? 'Conectado' : 'Desconectado'}
              subtitle={healthData?.connections?.database ? 'operacional' : 'verificar conexao'}
              icon={Database}
              iconColor={healthData?.connections?.database ? 'var(--color-success)' : 'var(--color-destructive)'}
            />
          </motion.div>

          {/* System Resources */}
          {(healthData?.memory || healthData?.cpu) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Memory Card */}
              {healthData?.memory && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <HardDrive className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Memoria</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usado</span>
                      <span className="font-medium">
                        {formatBytes(healthData.memory.used ?? 0)} / {formatBytes(healthData.memory.total ?? 0)}
                      </span>
                    </div>
                    <Progress
                      value={healthData.memory.percentage ?? 0}
                      className="h-3"
                      indicatorClassName={
                        (healthData.memory.percentage ?? 0) < 70
                          ? 'bg-success'
                          : (healthData.memory.percentage ?? 0) < 90
                          ? 'bg-warning'
                          : 'bg-destructive'
                      }
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uso</span>
                      <span className="font-medium">{(healthData.memory.percentage ?? 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* CPU Card */}
              {healthData?.cpu && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Cpu className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">CPU</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uso atual</span>
                      <span className="font-medium">{(healthData.cpu.usage ?? 0).toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={healthData.cpu.usage ?? 0}
                      className="h-3"
                      indicatorClassName={
                        (healthData.cpu.usage ?? 0) < 70
                          ? 'bg-success'
                          : (healthData.cpu.usage ?? 0) < 90
                          ? 'bg-warning'
                          : 'bg-destructive'
                      }
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <StatusBadge
                        status={(healthData.cpu.usage ?? 0) < 70 ? 'success' : (healthData.cpu.usage ?? 0) < 90 ? 'warning' : 'error'}
                        label={(healthData.cpu.usage ?? 0) < 70 ? 'Normal' : (healthData.cpu.usage ?? 0) < 90 ? 'Elevado' : 'Critico'}
                      />
                    </div>
                  </div>
                </Card>
              )}
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
