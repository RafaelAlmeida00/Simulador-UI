'use client';

import * as React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/src/lib/utils';

interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface LineConfig {
  dataKey: string;
  color?: string;
  label?: string;
  dashed?: boolean;
}

interface LineChartProps {
  data: LineChartData[];
  lines: LineConfig[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showDots?: boolean;
  className?: string;
}

export function LineChart({
  data,
  lines,
  height = 300,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  showDots = true,
  className,
}: LineChartProps) {
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
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
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
          {lines.map((line, index) => {
            const color = line.color || defaultColors[index % defaultColors.length];
            return (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.label || line.dataKey}
                stroke={color}
                strokeWidth={2}
                strokeDasharray={line.dashed ? '5 5' : undefined}
                dot={showDots ? { fill: color, r: 4 } : false}
                activeDot={showDots ? { r: 6 } : false}
              />
            );
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
