'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/components/ui/tooltip';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { formatSimTime } from '../../utils/timeFormat';

export interface SimulatorTimeDisplayProps {
  timestamp?: number | null;
  label?: string;
  showControls?: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
  className?: string;
}

export const SimulatorTimeDisplay = React.memo(function SimulatorTimeDisplay({
  timestamp,
  label = 'Tempo atual da simulacao',
  showControls = false,
  isPaused = false,
  onPause,
  onResume,
  onReset,
  className,
}: SimulatorTimeDisplayProps) {
  const simTime = formatSimTime(timestamp ?? undefined);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg',
              'bg-primary/20 border border-primary/35',
              'transition-colors duration-200'
            )}
          >
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold tracking-tight">{simTime}</span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>

      {showControls && (
        <div className="flex items-center gap-1">
          {isPaused ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onResume}
                  className="text-success hover:text-success"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Retomar simulacao</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onPause}
                  className="text-warning hover:text-warning"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pausar simulacao</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onReset}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reiniciar simulacao</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
});

export default SimulatorTimeDisplay;
