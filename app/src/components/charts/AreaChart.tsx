'use client';

import * as React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/src/lib/utils';

interface AreaChartData {
  name: string;
  [key: string]: string | number;
}

interface AreaConfig {
  dataKey: string;
  color?: string;
  label?: string;
  gradient?: boolean;
}

interface AreaChartProps {
  data: AreaChartData[];
  areas: AreaConfig[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  className?: string;
}

export function AreaChart({
  data,
  areas,
  height = 300,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  stacked = false,
  className,
}: AreaChartProps) {
  const defaultColors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
  ];

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          <defs>
            {areas.map((area, index) => {
              const color = area.color || defaultColors[index % defaultColors.length];
              return (
                <linearGradient
                  key={`gradient-${area.dataKey}`}
                  id={`gradient-${area.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
          )}
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-foreground)',
              }}
            />
          )}
          {showLegend && <Legend />}
          {areas.map((area, index) => {
            const color = area.color || defaultColors[index % defaultColors.length];
            return (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                name={area.label || area.dataKey}
                stackId={stacked ? '1' : undefined}
                stroke={color}
                fill={area.gradient !== false ? `url(#gradient-${area.dataKey})` : color}
                fillOpacity={area.gradient !== false ? 1 : 0.3}
                strokeWidth={2}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
