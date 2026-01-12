'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EngineeringIcon from '@mui/icons-material/Engineering';

import type { NormalizedStation } from '../utils/plantNormalize';
import type { ICar, ICarTrace } from '../types/socket';
import { formatEpochMs } from '../utils/timeFormat';

// Helper to extract ICar data from unknown
function extractCar(raw: unknown): ICar | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string') return null;
  return raw as ICar;
}

export type StationCardProps = {
  station: NormalizedStation;
  shopName: string;
  lineName: string;
  nowSimMs: number | null;
  onStationClick?: (station: NormalizedStation) => void;
  onCarClick?: (car: ICar | Record<string, unknown>, carId: string) => void;
};

function formatTakt(v?: number): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '--';
  return v.toFixed(2);
}

export const StationCard = React.memo(function StationCard({
  station,
  shopName,
  lineName,
  nowSimMs,
  onStationClick,
  onCarClick,
}: StationCardProps) {
  const theme = useTheme();

  const isStopped = station.isStopped;
  const isOccupied = station.occupied;
  const car = extractCar(station.currentCar);
  const carId = station.currentCarId ?? car?.id ?? '';

  // Determine background color based on state
  const bg = isStopped
    ? theme.palette.error.light
    : isOccupied
      ? theme.palette.warning.light
      : theme.palette.success.light;

  const statusText = isStopped
    ? (station.stopReason ?? 'STOPPED')
    : isOccupied
      ? 'Operando'
      : 'Vazia';

  // Calculate elapsed time from car trace
  const elapsedSec = React.useMemo(() => {
    if (!car || !nowSimMs) return 0;
    const trace = car.trace;
    if (!Array.isArray(trace)) return 0;

    // Find the trace entry for this station
    const stationName = station.name ?? station.id;
    const enterTs = trace.find((t: ICarTrace) => {
      return (t.line === lineName || t.line === station.id) &&
             (t.station === stationName || t.station === station.id);
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
    <Paper
      onClick={handleClick}
      role="button"
      tabIndex={0}
      sx={{
        width: { xs: 240, sm: 280, md: 300 },
        minHeight: 140,
        p: 1.25,
        cursor: 'pointer',
        bgcolor: bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 1,
        transition: 'transform 100ms ease, box-shadow 100ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
    >
      <Box>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 800, color: theme.palette.textStation }}
          noWrap
        >
          {displayName} - {formatTakt(station.taktSg)}s
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ display: 'block', fontWeight: 800, color: theme.palette.textStation }}
          >
            {statusText}
          </Typography>
          {isStopped && station.startStop ? (
            <Typography
              variant="caption"
              sx={{ display: 'block', color: theme.palette.textStation }}
            >
              {typeof station.startStop === 'number'
                ? formatEpochMs(station.startStop)
                : String(station.startStop)}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {carId ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, color: theme.palette.textStation }}
            >
              {carId} - {elapsedSec}s
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isOccupied ? <EngineeringIcon sx={{ color: theme.palette.icon }} /> : null}
              <IconButton
                onClick={handleCarClick}
                aria-label={`Abrir carro ${carId}`}
                sx={{ color: theme.palette.icon }}
              >
                <DirectionsCarIcon fontSize="large" />
              </IconButton>
              {isOccupied ? <EngineeringIcon sx={{ color: theme.palette.icon }} /> : null}
            </Box>

            {car?.hasDefect && (
              <Typography
                variant="caption"
                sx={{ color: theme.palette.error.dark, fontWeight: 700 }}
              >
                DEFEITO
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: theme.palette.textStation }}>
            sem carro
          </Typography>
        )}
      </Box>
    </Paper>
  );
});

export default StationCard;
