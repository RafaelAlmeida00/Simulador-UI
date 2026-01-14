'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/components/ui/tooltip';
import { cn } from '@/src/lib/utils';

export interface ConnectionStatusProps {
  connected: boolean;
  connectedLabel?: string;
  disconnectedLabel?: string;
  onReconnect?: () => void;
  showReconnectButton?: boolean;
  className?: string;
}

export const ConnectionStatus = React.memo(function ConnectionStatus({
  connected,
  connectedLabel = 'Conectado',
  disconnectedLabel = 'Desconectado',
  onReconnect,
  showReconnectButton = true,
  className,
}: ConnectionStatusProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
              connected
                ? 'bg-success/20 border border-success/35'
                : 'bg-destructive/20 border border-destructive/35'
            )}
          >
            {connected ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Wifi className="h-4 w-4 text-success" />
                </motion.div>
                <span className="text-xs font-semibold text-success">{connectedLabel}</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="text-xs font-semibold text-destructive">{disconnectedLabel}</span>
              </>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {connected
              ? 'Conectado ao servidor de simulacao'
              : 'Desconectado do servidor de simulacao'}
          </p>
        </TooltipContent>
      </Tooltip>

      {!connected && showReconnectButton && onReconnect && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onReconnect}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reconectar</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
});

export default ConnectionStatus;
