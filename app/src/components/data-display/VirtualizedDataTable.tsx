'use client';

import * as React from 'react';
import { List, type RowComponentProps } from 'react-window';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Input } from '@/src/components/ui/input';
import { Skeleton } from '@/src/components/ui/skeleton';

interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: number | string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
}

interface VirtualizedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  rowHeight?: number;
  height?: number;
  className?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  getRowKey?: (row: T, index: number) => string | number;
}

type SortDirection = 'asc' | 'desc' | null;

interface RowData<T> {
  items: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

// Row component for react-window v2
function TableRow<T>({
  index,
  style,
  items,
  columns,
  onRowClick,
}: RowComponentProps<RowData<T>> & RowData<T>) {
  const row = items[index];

  if (!row) return null;

  return (
    <div
      style={style}
      className={cn(
        'flex items-center border-b border-border hover:bg-muted/50 transition-colors',
        onRowClick && 'cursor-pointer'
      )}
      onClick={() => onRowClick?.(row)}
    >
      {columns.map((column: Column<T>) => (
        <div
          key={String(column.key)}
          className={cn(
            'flex-shrink-0 px-4 py-2 text-sm truncate',
            column.className
          )}
          style={{
            width: column.width ?? `${100 / columns.length}%`,
            minWidth: 80,
          }}
        >
          {column.render
            ? column.render(row[column.key as keyof T], row)
            : String(row[column.key as keyof T] ?? '')}
        </div>
      ))}
    </div>
  );
}

export function VirtualizedDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  rowHeight = 48,
  height = 400,
  className,
  onRowClick,
  emptyMessage = 'Nenhum registro encontrado',
  getRowKey,
}: VirtualizedDataTableProps<T>) {
  const [search, setSearch] = React.useState('');
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  // Measure container width for responsive columns
  React.useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!search) return data;
    const searchLower = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key as keyof T];
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [data, search, columns]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey as keyof T];
      const bVal = b[sortKey as keyof T];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  const handleSort = React.useCallback((key: string) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDirection((prevDir) => {
          if (prevDir === 'asc') return 'desc';
          if (prevDir === 'desc') return null;
          return 'asc';
        });
        // If previous direction was 'desc', clear sortKey, else keep key
        return sortDirection === 'desc' ? null : key;
      } else {
        setSortDirection('asc');
        return key;
      }
    });
  }, [sortDirection]);

  const handleSortClick = React.useCallback((key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey, sortDirection]);

  const getSortIcon = React.useCallback(
    (key: string) => {
      if (sortKey !== key) return <ArrowUpDown className="h-4 w-4" />;
      if (sortDirection === 'asc') return <ArrowUp className="h-4 w-4" />;
      return <ArrowDown className="h-4 w-4" />;
    },
    [sortKey, sortDirection]
  );

  // Row props for react-window v2
  const rowProps = React.useMemo(
    () => ({
      items: sortedData,
      columns,
      onRowClick,
    }),
    [sortedData, columns, onRowClick]
  );

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {searchable && <Skeleton className="h-10 w-full max-w-sm" />}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center px-4 py-3 border-b border-border">
              {columns.map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1 mx-2" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)} ref={containerRef}>
      {/* Search */}
      {searchable && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {sortedData.length} registros
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center border-b border-border bg-muted/30">
          {columns.map((column) => (
            <div
              key={String(column.key)}
              className={cn(
                'flex-shrink-0 px-4 py-3 text-sm font-semibold text-muted-foreground',
                column.sortable && 'cursor-pointer select-none hover:text-foreground',
                column.className
              )}
              style={{
                width: column.width ?? `${100 / columns.length}%`,
                minWidth: 80,
              }}
              onClick={() => column.sortable && handleSortClick(String(column.key))}
            >
              <div className="flex items-center gap-2">
                {column.header}
                {column.sortable && getSortIcon(String(column.key))}
              </div>
            </div>
          ))}
        </div>

        {/* Virtualized Body */}
        {sortedData.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <List
            rowComponent={TableRow<T>}
            rowProps={rowProps}
            rowCount={sortedData.length}
            rowHeight={rowHeight}
            overscanCount={5}
            style={{ height: Math.min(height, sortedData.length * rowHeight) }}
          />
        )}
      </div>
    </div>
  );
}
