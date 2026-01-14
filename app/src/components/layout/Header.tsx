'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Play,
  Pause,
  RotateCcw,
  Square,
  Clock,
  Calendar,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/src/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { useTheme } from './ThemeProvider';

// Page titles mapping
const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/oee': 'OEE - Overall Equipment Effectiveness',
  '/mttr-mtbf': 'MTTR / MTBF',
  '/stoppages': 'Paradas',
  '/events': 'Eventos',
  '/buffers': 'Buffers',
  '/settings': 'Configuracoes',
  '/health-simulator': 'Saude do Simulador',
};

interface HeaderProps {
  connected?: boolean;
  simulatorTime?: number | null;
  simulatorStatus?: 'running' | 'paused' | 'stopped';
  onSimulatorControl?: (action: 'start' | 'pause' | 'restart' | 'stop') => void;
}

export function Header({
  connected = false,
  simulatorTime,
  simulatorStatus = 'stopped',
  onSimulatorControl,
}: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Don't render header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  const pageTitle = pageTitles[pathname || '/'] || 'Simulador';

  const formatSimTime = (timestamp: number | null | undefined) => {
    if (!timestamp) return '--:--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC',
    });
  };

  const formatSimDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return '--/--/----';
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
        {/* Left: Page Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        </div>

        {/* Center: Simulator Date, Time & Controls */}
        <div className="flex items-center gap-4">
          {/* Simulator Date */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm font-medium">
                  {formatSimDate(simulatorTime)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Data da simulacao</TooltipContent>
          </Tooltip>

          {/* Simulator Time */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm font-medium">
                  {formatSimTime(simulatorTime)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Hora da simulacao</TooltipContent>
          </Tooltip>

          {/* Simulator Controls */}
          {onSimulatorControl && (
            <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={simulatorStatus === 'running' ? 'success' : 'ghost'}
                    size="icon-sm"
                    onClick={() => onSimulatorControl('start')}
                    disabled={simulatorStatus === 'running'}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Iniciar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={simulatorStatus === 'paused' ? 'warning' : 'ghost'}
                    size="icon-sm"
                    onClick={() => onSimulatorControl('pause')}
                    disabled={simulatorStatus !== 'running'}
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pausar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onSimulatorControl('restart')}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reiniciar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onSimulatorControl('stop')}
                    disabled={simulatorStatus === 'stopped'}
                    className="hover:text-destructive"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Parar</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
              >
                <Input
                  placeholder="Buscar..."
                  className="h-9 w-[200px]"
                  autoFocus
                  onBlur={() => setSearchOpen(false)}
                />
              </motion.div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Buscar</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Connection Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2.5 py-1',
                  connected
                    ? 'bg-success/20 text-success'
                    : 'bg-destructive/20 text-destructive'
                )}
              >
                {connected ? (
                  <Wifi className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                <span className="text-xs font-medium">
                  {connected ? 'Online' : 'Offline'}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {connected ? 'Conectado ao servidor' : 'Desconectado do servidor'}
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center p-0 text-[10px]"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificacoes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <span className="font-medium">Parada iniciada</span>
                <span className="text-xs text-muted-foreground">
                  Linha Body-01 - Manutencao preventiva
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <span className="font-medium">OEE baixo</span>
                <span className="text-xs text-muted-foreground">
                  Shop Paint - OEE abaixo de 60%
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <span className="font-medium">Buffer cheio</span>
                <span className="text-xs text-muted-foreground">
                  Buffer Body-Paint atingiu capacidade maxima
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
