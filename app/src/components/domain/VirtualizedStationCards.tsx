'use client';

import * as React from 'react';
import type { NormalizedStation } from '../../utils/plantNormalize';
import type { ICar } from '../../types/socket';
import { StationCard } from './StationCard';

export interface VirtualizedStationCardsProps {
  stations: NormalizedStation[];
  shopName: string;
  lineName: string;
  nowSimMs: number | null;
  onStationClick?: (station: NormalizedStation) => void;
  onCarClick?: (car: ICar | Record<string, unknown>, carId: string) => void;
}

export const VirtualizedStationCards = React.memo(function VirtualizedStationCards({
  stations,
  shopName,
  lineName,
  nowSimMs,
  onStationClick,
  onCarClick,
}: VirtualizedStationCardsProps) {
  return (
    <div className="flex flex-wrap gap-3">
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
    </div>
  );
});

export default VirtualizedStationCards;
