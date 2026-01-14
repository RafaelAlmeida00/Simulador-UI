'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/src/lib/utils';

type StatusType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'planned'
  | 'online'
  | 'offline'
  | 'idle';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  pulse?: boolean;
  className?: string;
}

const statusConfig: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  success: {
    bg: 'bg-success/20',
    text: 'text-success',
    dot: 'bg-success',
    label: 'Sucesso',
  },
  error: {
    bg: 'bg-destructive/20',
    text: 'text-destructive',
    dot: 'bg-destructive',
    label: 'Erro',
  },
  warning: {
    bg: 'bg-warning/20',
    text: 'text-warning',
    dot: 'bg-warning',
    label: 'Aviso',
  },
  info: {
    bg: 'bg-info/20',
    text: 'text-info',
    dot: 'bg-info',
    label: 'Info',
  },
  pending: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
    label: 'Pendente',
  },
  in_progress: {
    bg: 'bg-info/20',
    text: 'text-info',
    dot: 'bg-info',
    label: 'Em Progresso',
  },
  completed: {
    bg: 'bg-success/20',
    text: 'text-success',
    dot: 'bg-success',
    label: 'Concluido',
  },
  planned: {
    bg: 'bg-info/20',
    text: 'text-info',
    dot: 'bg-info',
    label: 'Planejado',
  },
  online: {
    bg: 'bg-success/20',
    text: 'text-success',
    dot: 'bg-success',
    label: 'Online',
  },
  offline: {
    bg: 'bg-destructive/20',
    text: 'text-destructive',
    dot: 'bg-destructive',
    label: 'Offline',
  },
  idle: {
    bg: 'bg-warning/20',
    text: 'text-warning',
    dot: 'bg-warning',
    label: 'Inativo',
  },
  // Severity mappings
  low: {
    bg: 'bg-success/20',
    text: 'text-success',
    dot: 'bg-success',
    label: 'Baixa',
  },
  medium: {
    bg: 'bg-warning/20',
    text: 'text-warning',
    dot: 'bg-warning',
    label: 'Media',
  },
  high: {
    bg: 'bg-destructive/20',
    text: 'text-destructive',
    dot: 'bg-destructive',
    label: 'Alta',
  },
};

export function StatusBadge({
  status,
  label,
  pulse = false,
  className,
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/ /g, '_');
  const config = statusConfig[normalizedStatus] || statusConfig.info;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
        config.bg,
        config.text,
        className
      )}
    >
      <motion.span
        className={cn('h-1.5 w-1.5 rounded-full', config.dot)}
        animate={pulse ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : undefined}
        transition={pulse ? { duration: 1.5, repeat: Infinity } : undefined}
      />
      <span className="text-xs font-medium">{label || config.label}</span>
    </div>
  );
}

// Event type badge
interface EventTypeBadgeProps {
  type: string;
  className?: string;
}

const eventTypeConfig: Record<string, { bg: string; text: string }> = {
  create: { bg: 'bg-success/20', text: 'text-success' },
  created: { bg: 'bg-success/20', text: 'text-success' },
  moved: { bg: 'bg-info/20', text: 'text-info' },
  completed: { bg: 'bg-primary/20', text: 'text-primary' },
  buffer_in: { bg: 'bg-warning/20', text: 'text-warning' },
  buffer_out: { bg: 'bg-warning/20', text: 'text-warning' },
  rework_in: { bg: 'bg-destructive/20', text: 'text-destructive' },
  rework_out: { bg: 'bg-destructive/20', text: 'text-destructive' },
};

export function EventTypeBadge({ type, className }: EventTypeBadgeProps) {
  const normalizedType = type.toLowerCase().replace(/ /g, '_');
  const config = eventTypeConfig[normalizedType] || {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      {type}
    </span>
  );
}
