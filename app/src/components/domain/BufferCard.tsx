'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Car, Package } from 'lucide-react';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Progress } from '@/src/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/components/ui/tooltip';
import { cn } from '@/src/lib/utils';
import type { IBuffer, ICar } from '../../types/socket';
import { useSimulatorSelector } from '../../hooks/useSimulatorStore';

export interface BufferCardProps {
  buffer: IBuffer;
  variant?: string;
  onBufferClick?: (buffer: IBuffer) => void;
  onCarClick?: (car: ICar, carId: string) => void;
  className?: string;
}

export const BufferCard = React.memo(function BufferCard({
  buffer,
  variant,
  onBufferClick,
  onCarClick,
  className,
}: BufferCardProps) {
  const carsById = useSimulatorSelector((s) => s.carsById);

  const count = buffer.currentCount;
  const capacity = buffer.capacity;
  const cars = buffer.carIds ?? [];
  const isAvailable = buffer.status === 'AVAILABLE' || buffer.status === 'EMPTY';
  const fillPercentage = capacity > 0 ? (count / capacity) * 100 : 0;

  const handleClick = React.useCallback(() => {
    onBufferClick?.(buffer);
  }, [buffer, onBufferClick]);

  const handleCarClick = React.useCallback(
    (e: React.MouseEvent, car: ICar) => {
      e.stopPropagation();
      onCarClick?.(car, car.id);
    },
    [onCarClick]
  );

  const getStatusColor = () => {
    if (isAvailable) return 'success';
    if (buffer.status === 'FULL') return 'warning';
    return 'destructive';
  };

  const getBufferTypeLabel = () => {
    if (variant === 'REWORK_BUFFER') return 'Rework';
    if (variant === 'LINE_BUFFER') return 'Linha';
    return variant || 'Buffer';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          <Card
            onClick={handleClick}
            className={cn(
              'p-3 cursor-pointer transition-shadow hover:shadow-lg',
              'min-w-[280px] md:min-w-[320px]',
              isAvailable ? 'border-success/50' : 'border-destructive/50',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {buffer.from} → {buffer.to}
                </span>
              </div>
              <Badge variant={getStatusColor() as 'success' | 'warning' | 'destructive'}>
                {buffer.status ?? 'UNKNOWN'}
              </Badge>
            </div>

            {/* Capacity bar */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Capacidade</span>
                <span className="font-medium">
                  {count} / {capacity}
                </span>
              </div>
              <Progress
                value={fillPercentage}
                className="h-2"
                indicatorClassName={cn(
                  fillPercentage < 50
                    ? 'bg-success'
                    : fillPercentage < 80
                    ? 'bg-warning'
                    : 'bg-destructive'
                )}
              />
            </div>

            {/* Cars list */}
            {cars.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cars.map((carId) => {
                  const car = carsById[carId];
                  if (!car) return null;

                  return (
                    <Tooltip key={car.id}>
                      <TooltipTrigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleCarClick(e, car)}
                          className={cn(
                            'p-1.5 rounded-md transition-colors',
                            'bg-secondary hover:bg-secondary/80',
                            car.hasDefect && 'text-destructive',
                            car.inRework && !car.hasDefect && 'text-warning'
                          )}
                        >
                          <Car className="h-4 w-4" />
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">Car {car.id}</p>
                        <p className="text-xs text-muted-foreground">{car.model}</p>
                        {car.hasDefect && (
                          <p className="text-xs text-destructive">Com defeito</p>
                        )}
                        {car.inRework && (
                          <p className="text-xs text-warning">Em retrabalho</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}

            {/* Buffer type badge */}
            <div className="flex justify-end mt-2">
              <Badge variant="outline" className="text-xs">
                {getBufferTypeLabel()}
              </Badge>
            </div>
          </Card>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>
          Buffer: {buffer.from} → {buffer.to}
        </p>
        <p className="text-xs text-muted-foreground">
          {count}/{capacity} ocupado
        </p>
      </TooltipContent>
    </Tooltip>
  );
});

export default BufferCard;
