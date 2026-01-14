'use client';

import * as React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { cn } from '@/src/lib/utils';

interface BarChartData {
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}

interface BarChartProps {
  data: BarChartData[];
  dataKey?: string;
  xAxisKey?: string;
  height?: number;
  colorByValue?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

const getColorByValue = (value: number) => {
  if (value >= 85) return 'var(--color-success)';
  if (value >= 60) return 'var(--color-warning)';
  return 'var(--color-destructive)';
};

export function BarChart({
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  height = 300,
  colorByValue = false,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  layout = 'horizontal',
  className,
}: BarChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={layout === 'horizontal'}
              horizontal={layout === 'vertical'}
            />
          )}
          {layout === 'horizontal' ? (
            <>
              <XAxis
                dataKey={xAxisKey}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={{ stroke: 'var(--color-border)' }}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                type="category"
                dataKey={xAxisKey}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={{ stroke: 'var(--color-border)' }}
                width={80}
              />
            </>
          )}
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-foreground)',
              }}
              cursor={{ fill: 'var(--color-secondary)', opacity: 0.3 }}
            />
          )}
          {showLegend && <Legend />}
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  colorByValue
                    ? getColorByValue(entry[dataKey] as number)
                    : entry.color || 'var(--color-primary)'
                }
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
