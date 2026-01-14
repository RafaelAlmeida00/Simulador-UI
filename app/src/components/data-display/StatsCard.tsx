'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card } from '@/src/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'var(--color-primary)',
  trend,
  className,
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend.value < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-success';
    if (trend.value < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('p-6', className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
              {trend && (
                <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                  {getTrendIcon()}
                  <span>{Math.abs(trend.value)}%</span>
                  {trend.label && (
                    <span className="text-muted-foreground">{trend.label}</span>
                  )}
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {Icon && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"
              style={{ color: iconColor }}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Mini stats card for compact displays
interface MiniStatsProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
  className?: string;
}

export function MiniStats({ label, value, icon: Icon, color, className }: MiniStatsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg bg-secondary px-4 py-3',
        className
      )}
    >
      {Icon && (
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md bg-background"
          style={{ color: color || 'var(--color-primary)' }}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}
