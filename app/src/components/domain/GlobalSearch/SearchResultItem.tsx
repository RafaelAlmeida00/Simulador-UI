'use client';

import * as React from 'react';
import {
  Factory,
  GitBranch,
  Square,
  Box,
  Car,
  Gauge,
  AlertTriangle,
  Clock,
  LucideIcon,
} from 'lucide-react';
import { CommandItem } from '@/src/components/ui/command';
import { Badge } from '@/src/components/ui/badge';
import type { SearchResult, SearchCategory } from '@/src/types/search';
import { cn } from '@/src/lib/utils';

interface SearchResultItemProps {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
}

const CATEGORY_ICONS: Record<SearchCategory, LucideIcon> = {
  shop: Factory,
  line: GitBranch,
  station: Square,
  buffer: Box,
  car: Car,
  oee: Gauge,
  stop: AlertTriangle,
  mttr: Clock,
};

const CATEGORY_COLORS: Record<SearchCategory, string> = {
  shop: 'bg-info/20 text-info border-info/30',
  line: 'bg-info/20 text-info border-info/30',
  station: 'bg-secondary text-secondary-foreground',
  buffer: 'bg-warning/20 text-warning border-warning/30',
  car: 'bg-primary/20 text-primary border-primary/30',
  oee: 'bg-success/20 text-success border-success/30',
  stop: 'bg-destructive/20 text-destructive border-destructive/30',
  mttr: 'bg-muted text-muted-foreground',
};

const CATEGORY_LABELS: Record<SearchCategory, string> = {
  shop: 'Shop',
  line: 'Linha',
  station: 'Estacao',
  buffer: 'Buffer',
  car: 'Carro',
  oee: 'OEE',
  stop: 'Parada',
  mttr: 'MTTR',
};

export function SearchResultItem({ result, onSelect }: SearchResultItemProps) {
  const Icon = CATEGORY_ICONS[result.category];

  return (
    <CommandItem
      value={`${result.category}-${result.id}-${result.title}`}
      onSelect={() => onSelect(result)}
      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
    >
      <div
        className={cn(
          'flex items-center justify-center h-8 w-8 rounded-lg border',
          CATEGORY_COLORS[result.category]
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{result.title}</span>
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0 h-4', CATEGORY_COLORS[result.category])}
          >
            {CATEGORY_LABELS[result.category]}
          </Badge>
        </div>
        {result.subtitle && (
          <div className="text-xs text-muted-foreground truncate">
            {result.subtitle}
          </div>
        )}
        {result.description && (
          <div className="text-xs text-muted-foreground/80 truncate mt-0.5">
            {result.description}
          </div>
        )}
      </div>
    </CommandItem>
  );
}
