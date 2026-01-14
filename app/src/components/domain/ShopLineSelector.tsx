'use client';

import * as React from 'react';
import { Factory, GitBranch } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { cn } from '@/src/lib/utils';

import type { NormalizedShop } from '../../utils/plantNormalize';

export interface ShopLineSelectorProps {
  shops: NormalizedShop[];
  shopIndex: number;
  lineIndex: number;
  onShopChange: (index: number) => void;
  onLineChange: (index: number) => void;
  className?: string;
}

export const ShopLineSelector = React.memo(function ShopLineSelector({
  shops,
  shopIndex,
  lineIndex,
  onShopChange,
  onLineChange,
  className,
}: ShopLineSelectorProps) {
  const currentShop = shops[shopIndex];
  const lines = currentShop?.lines ?? [];

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Shop Dropdown */}
      <Select
        value={shops.length > 0 ? String(shopIndex) : ''}
        onValueChange={(value) => onShopChange(Number(value))}
      >
        <SelectTrigger className="w-[160px] font-semibold">
          <Factory className="mr-2 h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Selecione shop" />
        </SelectTrigger>
        <SelectContent>
          {shops.length === 0 ? (
            <div className="py-2 px-2 text-sm text-muted-foreground">
              Sem shops disponíveis
            </div>
          ) : (
            shops.map((shop, idx) => (
              <SelectItem key={shop.id} value={String(idx)}>
                {shop.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Line Dropdown */}
      <Select
        value={lines.length > 0 ? String(lineIndex) : ''}
        onValueChange={(value) => onLineChange(Number(value))}
      >
        <SelectTrigger className="w-[160px] font-semibold">
          <GitBranch className="mr-2 h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Selecione linha" />
        </SelectTrigger>
        <SelectContent>
          {lines.length === 0 ? (
            <div className="py-2 px-2 text-sm text-muted-foreground">
              Sem linhas disponíveis
            </div>
          ) : (
            lines.map((line, idx) => (
              <SelectItem key={line.id} value={String(idx)}>
                {line.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
});

export default ShopLineSelector;
