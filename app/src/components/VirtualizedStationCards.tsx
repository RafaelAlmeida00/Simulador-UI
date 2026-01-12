'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

import type { NormalizedStation } from '../utils/plantNormalize';
import type { ICar } from '../types/socket';
import { StationCard } from './StationCard';

export type VirtualizedStationCardsProps = {
  stations: NormalizedStation[];
  shopName: string;
  lineName: string;
  nowSimMs: number | null;
  onStationClick?: (station: NormalizedStation) => void;
  onCarClick?: (car: ICar | Record<string, unknown>, carId: string) => void;
};


export const VirtualizedStationCards = React.memo(function VirtualizedStationCards({
  stations,
  shopName,
  lineName,
  nowSimMs,
  onStationClick,
  onCarClick,
}: VirtualizedStationCardsProps) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Stack direction="row" spacing={1.5} sx={{ minWidth: 'max-content', pb: 0.5 }}>
        {stations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            shopName={shopName}
            lineName={lineName}
            nowSimMs={nowSimMs}
            onStationClick={onStationClick}
            onCarClick={onCarClick}
          />
        ))}
      </Stack>
    </Box>
  );
});

export default VirtualizedStationCards;
