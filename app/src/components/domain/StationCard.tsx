'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Car, Wrench, AlertTriangle, Clock } from 'lucide-react';
import { Card } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/components/ui/tooltip';
import { cn } from '@/src/lib/utils';
import type { NormalizedStation } from '../../utils/plantNormalize';
import type { ICar, ICarTrace } from '../../types/socket';
import { formatEpochMs } from '../../utils/timeFormat';

// Helper to extract ICar data from unknown
function extractCar(raw: unknown): ICar | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string') return null;
  return raw as ICar;
}

function formatTakt(v?: number): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '--';
  return v.toFixed(2);
}

export interface StationCardProps {
  station: NormalizedStation;
  shopName: string;
  lineName: string;
  nowSimMs: number | null;
  onStationClick?: (station: NormalizedStation) => void;
  onCarClick?: (car: ICar | Record<string, unknown>, carId: string) => void;
}

export const StationCard = React.memo(function StationCard({
  station,
  shopName,
  lineName,
  nowSimMs,
  onStationClick,
  onCarClick,
}: StationCardProps) {
  const isStopped = station.isStopped;
  const isOccupied = station.occupied;
  const car = extractCar(station.currentCar);
  const carId = station.currentCarId ?? car?.id ?? '';

  // Determine status styling
  const statusConfig = isStopped
    ? {
        bg: 'bg-destructive/20',
        border: 'border-destructive/50',
        badge: 'destructive' as const,
        text: station.stopReason ?? 'PARADO',
      }
    : isOccupied
    ? {
        bg: 'bg-warning/20',
        border: 'border-warning/50',
        badge: 'warning' as const,
        text: 'Operando',
      }
    : {
        bg: 'bg-success/20',
        border: 'border-success/50',
        badge: 'success' as const,
        text: 'Livre',
      };

  // Calculate elapsed time from car trace
  const elapsedSec = React.useMemo(() => {
    if (!car || !nowSimMs) return 0;
    const trace = car.trace;
    if (!Array.isArray(trace)) return 0;

    const stationName = station.name ?? station.id;
    const enterTs = trace.find((t: ICarTrace) => {
      return (
        (t.line === lineName || t.line === station.id) &&
        (t.station === stationName || t.station === station.id)
      );
    });

    const enterMs = enterTs?.enter;
    if (typeof enterMs !== 'number' || !Number.isFinite(enterMs)) return 0;

    return Math.max(0, Math.floor((nowSimMs - enterMs) / 1000));
  }, [car, nowSimMs, lineName, station.name, station.id]);

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onStationClick?.(station);
    },
    [station, onStationClick]
  );

  const handleCarClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const carData = car ?? (station.currentCar as Record<string, unknown>) ?? { id: carId };
      onCarClick?.(carData, carId);
    },
    [car, station.currentCar, carId, onCarClick]
  );

  // Extract station name from ID (e.g., "Paint-Line1-ST01" -> "ST01")
  const displayName = React.useMemo(() => {
    const parts = station.name.split('-');
    return parts.length > 2 ? parts[parts.length - 1] : station.name;
  }, [station.name]);

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        onClick={handleClick}
        className={cn(
          'w-[240px] sm:w-[280px] md:w-[300px] min-h-[140px] p-3 cursor-pointer',
          'flex flex-col gap-2 transition-shadow hover:shadow-lg',
          statusConfig.bg,
          statusConfig.border
        )}
      >
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold truncate">{displayName}</span>
            <Badge variant={statusConfig.badge} className="text-xs">
              {formatTakt(station.taktSg)}s
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {statusConfig.text}
            </Badge>
            {isStopped && station.startStop && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {typeof station.startStop === 'number'
                      ? formatEpochMs(station.startStop)
                      : String(station.startStop)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Inicio da parada</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Car section */}
        <div className="flex-1 flex items-center justify-center">
          {carId ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1 text-xs font-semibold">
                <span>{carId}</span>
              </div>

              <div className="flex items-center gap-2">
                {isOccupied && (
                  <motion.div
                    animate={{ rotate: [0, 15, 0, -15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Wrench className="h-4 w-4 text-warning" />
                  </motion.div>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCarClick}
                      className={cn(
                        'p-2 rounded-full transition-colors',
                        'bg-secondary/50 hover:bg-secondary',
                        car?.hasDefect && 'text-destructive',
                        car?.inRework && !car?.hasDefect && 'text-warning'
                      )}
                    >
                      <motion.div
                        animate={{ x: [0, -1, 1, -1, 1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                      >
                        <Car className="h-8 w-8" />
                      </motion.div>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Carro {carId}</p>
                    {car?.model && (
                      <p className="text-xs text-muted-foreground">{car.model}</p>
                    )}
                  </TooltipContent>
                </Tooltip>

                {isOccupied && (
                  <motion.div
                    animate={{ rotate: [0, -15, 0, 15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Wrench className="h-4 w-4 text-warning" />
                  </motion.div>
                )}
              </div>

              {car?.hasDefect && (
                <div className="flex items-center gap-1 text-xs text-destructive font-semibold">
                  <AlertTriangle className="h-3 w-3" />
                  <span>DEFEITO</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Sem carro</span>
          )}
        </div>
      </Card>
    </motion.div>
  );
});

export default StationCard;
