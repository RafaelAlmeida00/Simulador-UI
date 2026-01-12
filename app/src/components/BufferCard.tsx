'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import type { IBuffer, ICar } from '../types/socket';
import { useSimulatorSelector } from '../hooks/useSimulatorStore';

export type BufferCardProps = {
  buffer: IBuffer;
  variant?: string;
  onBufferClick?: (buffer: IBuffer) => void;
  onCarClick?: (car: ICar, carId: string) => void;
};

export const BufferCard = React.memo(function BufferCard({
  buffer,
  variant,
  onBufferClick,
  onCarClick,
}: BufferCardProps) {
  const theme = useTheme();
  const sim = useSimulatorSelector(s => s.carsById);

  const count = buffer.currentCount;
  const capacity = buffer.capacity;
  const cars = buffer.carIds ?? [];
  const isAvailable = buffer.status === 'AVAILABLE' || buffer.status === 'EMPTY';

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

  const tooltipTitle = `Buffer: ${buffer.from} -> ${buffer.to} (${count}/${capacity})`;
  const label = variant;

  return (
    <Tooltip title={tooltipTitle} arrow>
      <Paper
        onClick={handleClick}
        role="button"
        tabIndex={0}
        sx={{
          p: 1,
          minWidth: { xs: '100%', md: variant === 'rework' ? 340 : 320 },
          cursor: 'pointer',
          bgcolor: isAvailable ? theme.palette.success.light : theme.palette.error.light,
          boxShadow: 6,
          transition: 'transform 140ms ease, box-shadow 140ms ease',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: 10 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, p: 1 }}>
          <Typography variant="subtitle2" sx={{ color: theme.palette.textStation }}>
            {buffer.from} - {buffer.to}
          </Typography>
          <Typography variant="subtitle2" sx={{ color: theme.palette.textStation }}>
            {count} / {capacity}
          </Typography>
        </Box>

        {/* Render car icons from the cars array */}
        {cars.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {cars.map((carId) => {
              const car = sim[carId];
              if (!car) return null;
              return (
              <Tooltip key={car.id} title={`Car ${car.id} - ${car.model}`} arrow>
                <IconButton
                size="small"
                onClick={(e) => handleCarClick(e, car)}
                aria-label={`Carro ${car.id}`}
                sx={{ color: theme.palette.icon }}
                >
                <DirectionsCarIcon
                  fontSize="small"
                  sx={{
                  color: car.hasDefect
                    ? theme.palette.error.main
                    : car.inRework
                    ? theme.palette.warning.main
                    : theme.palette.icon,
                  }}
                />
                </IconButton>
              </Tooltip>
              );
            })}
            </Box>
        )}

        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography
            variant="caption"
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: isAvailable ? theme.palette.success.main : theme.palette.error.main,
              color: theme.palette.icon,
              fontWeight: 700,
              fontSize: 10,
            }}
          >
            {label ?? 'UNKNOWN'}
          </Typography>
        </Box>

        {/* Status badge */}
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography
            variant="caption"
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: isAvailable ? theme.palette.success.main : theme.palette.error.main,
              color: theme.palette.icon,
              fontWeight: 700,
              fontSize: 10,
            }}
          >
            {buffer.status ?? 'UNKNOWN'}
          </Typography>
        </Box>


      </Paper>
    </Tooltip>
  );
});

export default BufferCard;
