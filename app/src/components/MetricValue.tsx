import * as React from 'react';
import Typography from '@mui/material/Typography';

export type MetricValueProps = {
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  valueVariant?: 'h3' | 'h4';
  valueFontWeight?: number;
};

export function MetricValue({
  label,
  value,
  unit,
  decimals = 1,
  valueVariant = 'h4',
  valueFontWeight = 600,
}: MetricValueProps) {
  return (
    <>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
        {label}
      </Typography>
      <Typography variant={valueVariant} sx={{ fontWeight: valueFontWeight }}>
        {Number.isFinite(value) ? value.toFixed(decimals) : '0.0'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {unit}
      </Typography>
    </>
  );
}
