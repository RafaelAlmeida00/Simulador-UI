'use client';

import * as React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { cn } from '@/src/lib/utils';

interface OEEChartProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showLegend?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 100, innerRadius: 30, outerRadius: 40 },
  md: { width: 160, innerRadius: 50, outerRadius: 65 },
  lg: { width: 200, innerRadius: 65, outerRadius: 85 },
};

export function OEEChart({
  value,
  size = 'md',
  showLabel = true,
  showLegend = false,
  className,
}: OEEChartProps) {
  const config = sizeConfig[size];

  const data = [
    { name: 'OEE', value: value },
    { name: 'Perda', value: 100 - value },
  ];

  const getColor = () => {
    if (value >= 85) return 'var(--color-success)';
    if (value >= 60) return 'var(--color-warning)';
    return 'var(--color-destructive)';
  };

  const color = getColor();

  return (
    <div className={cn('relative', className)} style={{ width: config.width, height: config.width }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={config.innerRadius}
            outerRadius={config.outerRadius}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="var(--color-secondary)" />
          </Pie>
          {showLegend && <Legend />}
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            }}
            formatter={(val) => [`${Number(val ?? 0).toFixed(1)}%`, '']}
          />
        </RechartsPieChart>
      </ResponsiveContainer>

      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-sm font-bold"
            style={{ color }}
          >
            {value.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">OEE</span>
        </div>
      )}
    </div>
  );
}
