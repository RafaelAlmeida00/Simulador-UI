'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import type { NormalizedShop, NormalizedLine } from '../utils/plantNormalize';

export type ShopLineSelectorProps = {
  shops: NormalizedShop[];
  shopIndex: number;
  lineIndex: number;
  onShopChange: (index: number) => void;
  onLineChange: (index: number) => void;
};

export const ShopLineSelector = React.memo(function ShopLineSelector({
  shops,
  shopIndex,
  lineIndex,
  onShopChange,
  onLineChange,
}: ShopLineSelectorProps) {
  const currentShop = shops[shopIndex];
  const lines = currentShop?.lines ?? [];

  const handleShopChange = React.useCallback(
    (e: { target: { value: unknown } }) => {
      onShopChange(Number(e.target.value));
    },
    [onShopChange]
  );

  const handleLineChange = React.useCallback(
    (e: { target: { value: unknown } }) => {
      onLineChange(Number(e.target.value));
    },
    [onLineChange]
  );

  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
      {/* Shop Dropdown */}
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <Select
          value={shops.length > 0 ? shopIndex : ''}
          onChange={handleShopChange}
          displayEmpty
          sx={{ fontWeight: 700 }}
        >
          {shops.length === 0 ? (
            <MenuItem value="" disabled>
              Sem shops
            </MenuItem>
          ) : (
            shops.map((shop, idx) => (
              <MenuItem key={shop.id} value={idx}>
                {shop.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Line Dropdown */}
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <Select
          value={lines.length > 0 ? lineIndex : ''}
          onChange={handleLineChange}
          displayEmpty
          sx={{ fontWeight: 700 }}
        >
          {lines.length === 0 ? (
            <MenuItem value="" disabled>
              Sem linhas
            </MenuItem>
          ) : (
            lines.map((line, idx) => (
              <MenuItem key={line.id} value={idx}>
                {line.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
    </Box>
  );
});

export default ShopLineSelector;
