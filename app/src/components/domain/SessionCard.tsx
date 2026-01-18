'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Trash2,
  Clock,
  Calendar,
  Zap,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';
import type { Session, SessionStatus } from '@/src/types/session';
import { SESSION_STATUS_CONFIG } from '@/src/types/session';

// ─────────────────────────────────────────────────────────────
// Status Badge Component
// ─────────────────────────────────────────────────────────────

interface SessionStatusBadgeProps {
  status: SessionStatus;
}

function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  const config = SESSION_STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className="font-medium">
      {status === 'interrupted' && <AlertTriangle className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────
// Session Card Component
// ─────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: Session;
  onOpen: () => void;
  onControl: (action: 'start' | 'pause' | 'resume') => void;
  onDelete: () => void;
  onRecover: () => void;
  onDiscard: () => void;
  disabled?: boolean;
}

export function SessionCard({
  session,
  onOpen,
  onControl,
  onDelete,
  onRecover,
  onDiscard,
  disabled = false,
}: SessionCardProps) {
  const isActive = session.status === 'running' || session.status === 'paused';
  const isInterrupted = session.status === 'interrupted';
  const canStart = session.status === 'idle';
  const canPause = session.status === 'running';
  const canResume = session.status === 'paused';
  const canDelete = session.status !== 'running' && session.status !== 'interrupted';
  const canOpen =
    session.status !== 'interrupted' &&
    session.status !== 'stopped' &&
    session.status !== 'expired';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate time remaining for recovery (24h since interruption)
  const getTimeToRecover = React.useCallback(() => {
    if (!session.interruptedAt) return null;
    const interruptedTime = new Date(session.interruptedAt).getTime();
    const deadline = interruptedTime + 24 * 60 * 60 * 1000; // 24h
    const remaining = deadline - Date.now();

    if (remaining <= 0) return 'Expirado';

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}min`;
  }, [session.interruptedAt]);

  const handleCardClick = () => {
    if (canOpen && !disabled) {
      onOpen();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={canOpen && !disabled ? { y: -3, scale: 1.02 } : undefined}
      whileTap={canOpen && !disabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={cn(
          'transition-all',
          canOpen && !disabled && 'cursor-pointer hover:border-primary/50 hover:shadow-lg',
          isActive && 'border-primary/30 bg-primary/5',
          isInterrupted && 'border-warning/50 bg-warning/5',
          disabled && 'opacity-50 pointer-events-none'
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {session.name || `Sessao ${session.id.slice(0, 8)}`}
              </CardTitle>
              <CardDescription className="mt-1">
                Criada em {formatDate(session.createdAt)}
              </CardDescription>
            </div>
            <SessionStatusBadge status={session.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{session.durationDays} dias</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 flex-shrink-0" />
              <span>{session.speedFactor}x velocidade</span>
            </div>
            {session.startedAt && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Iniciada: {formatDate(session.startedAt)}</span>
              </div>
            )}
            {session.expiresAt && !isInterrupted && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Expira: {formatDate(session.expiresAt)}</span>
              </div>
            )}
          </div>

          {/* Interrupted Session Warning */}
          {isInterrupted && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 space-y-2">
              <div className="flex items-center gap-2 text-warning font-medium text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Sessao interrompida por reinicio do servidor</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Interrompida em: {formatDate(session.interruptedAt)}</p>
                <p className="font-medium text-foreground">
                  Tempo para retomar: {getTimeToRecover()}
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div
            className="flex flex-wrap items-center gap-2 pt-3 border-t border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Actions for INTERRUPTED sessions */}
            {isInterrupted && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={onRecover}
                  disabled={disabled}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Retomar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDiscard}
                  disabled={disabled}
                  className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Descartar
                </Button>
              </>
            )}

            {/* Actions for normal sessions */}
            {!isInterrupted && (
              <>
                {canStart && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onControl('start')}
                    disabled={disabled}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Iniciar
                  </Button>
                )}
                {canPause && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onControl('pause')}
                    disabled={disabled}
                    className="flex-1"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pausar
                  </Button>
                )}
                {canResume && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={onOpen}
                      disabled={disabled}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onControl('resume')}
                      disabled={disabled}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Continuar
                    </Button>
                  </>
                )}
                {isActive && !canResume && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onOpen}
                    disabled={disabled}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDelete}
                    disabled={disabled}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
