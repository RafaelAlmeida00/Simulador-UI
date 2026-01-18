'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, CheckCircle2, XCircle, Clock, Zap, Settings } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Slider } from '@/src/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useCreateSession } from '@/src/hooks/useSessionsQuery';
import { useConfigs } from '@/src/hooks/useConfigsQuery';
import type { SessionLimits } from '@/src/types/session';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ModalState = 'idle' | 'loading' | 'success' | 'error';

interface CreateSessionDialogProps {
  limits: SessionLimits | null;
  onSuccess?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const DURATION_MIN = 1;
const DURATION_MAX = 30;
const DURATION_DEFAULT = 7;

const SPEED_MIN = 1;
const SPEED_MAX = 120;
const SPEED_DEFAULT = 1;

const SPEED_PRESETS = [1, 10, 30, 60, 120] as const;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function CreateSessionDialog({ limits, onSuccess }: CreateSessionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [modalState, setModalState] = React.useState<ModalState>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  // Form state
  const [name, setName] = React.useState('');
  const [configId, setConfigId] = React.useState<string | null>(null);
  const [durationDays, setDurationDays] = React.useState(DURATION_DEFAULT);
  const [speedFactor, setSpeedFactor] = React.useState(SPEED_DEFAULT);

  // Fetch available configs
  const { data: configs = [], isLoading: configsLoading } = useConfigs({
    enabled: open, // Only fetch when dialog is open
  });

  // Find default config
  const defaultConfig = React.useMemo(
    () => configs.find((c) => c.isDefault),
    [configs]
  );

  const createSession = useCreateSession();

  // Check if user can create more sessions
  const canCreate = limits
    ? limits.currentUser < limits.maxPerUser && limits.currentGlobal < limits.maxGlobal
    : true;

  const resetForm = React.useCallback(() => {
    setName('');
    setConfigId(null);
    setDurationDays(DURATION_DEFAULT);
    setSpeedFactor(SPEED_DEFAULT);
    setModalState('idle');
    setErrorMessage('');
  }, []);

  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form when closing
      setTimeout(resetForm, 200);
    }
  }, [resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreate) {
      setErrorMessage('Limite de sessoes atingido');
      setModalState('error');
      return;
    }

    setModalState('loading');

    try {
      // Use selected config, or default config, or undefined
      const selectedConfigId = configId || defaultConfig?.id || undefined;

      await createSession.mutateAsync({
        name: name.trim() || undefined,
        configId: selectedConfigId,
        durationDays,
        speedFactor,
      });

      setModalState('success');

      // Close dialog after success animation
      setTimeout(() => {
        setOpen(false);
        onSuccess?.();
        setTimeout(resetForm, 200);
      }, 1500);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Erro ao criar sessao'
      );
      setModalState('error');
    }
  };

  const formatDuration = (days: number) => {
    if (days === 1) return '1 dia';
    return `${days} dias`;
  };

  const formatSpeed = (speed: number) => {
    if (speed === 1) return 'Tempo real';
    return `${speed}x mais rapido`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={!canCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Sessao
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-lg">Criar Nova Sessao</DialogTitle>
          <DialogDescription>
            Configure os parametros da simulacao
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {modalState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12 gap-4 px-6"
            >
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Criando sessao...</p>
            </motion.div>
          )}

          {modalState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12 gap-4 px-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="h-12 w-12 text-success" />
              </motion.div>
              <p className="text-success font-medium">Sessao criada com sucesso!</p>
            </motion.div>
          )}

          {modalState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12 gap-4 px-6"
            >
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-destructive font-medium text-center">{errorMessage}</p>
              <Button
                variant="outline"
                onClick={() => setModalState('idle')}
              >
                Tentar novamente
              </Button>
            </motion.div>
          )}

          {modalState === 'idle' && (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
            >
              {/* Scrollable content area with fixed max height */}
              <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-5">
                {/* Session Name */}
                <div className="space-y-2">
                  <Label htmlFor="session-name">Nome (opcional)</Label>
                  <Input
                    id="session-name"
                    placeholder="Ex: Teste de producao"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                  />
                </div>

                {/* Config Selector */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Configuracao da Planta
                  </Label>
                  {configsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : configs.length === 0 ? (
                    <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/50">
                      Nenhuma configuracao disponivel. Sera usada a configuracao padrao.
                    </div>
                  ) : (
                    <Select
                      value={configId || '__default__'}
                      onValueChange={(value) =>
                        setConfigId(value === '__default__' ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma configuracao" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__default__">
                          {defaultConfig
                            ? `${defaultConfig.name} (Padrao)`
                            : 'Configuracao Padrao'}
                        </SelectItem>
                        {configs
                          .filter((c) => !c.isDefault)
                          .map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Duration Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Duracao
                    </Label>
                    <span className="text-sm font-semibold text-primary tabular-nums">
                      {formatDuration(durationDays)}
                    </span>
                  </div>
                  <Slider
                    value={[durationDays]}
                    onValueChange={([value]) => setDurationDays(value)}
                    min={DURATION_MIN}
                    max={DURATION_MAX}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{DURATION_MIN} dia</span>
                    <span>{DURATION_MAX} dias</span>
                  </div>
                </div>

                {/* Speed Factor Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      Velocidade
                    </Label>
                    <span className="text-sm font-semibold text-primary tabular-nums">
                      {formatSpeed(speedFactor)}
                    </span>
                  </div>
                  <Slider
                    value={[speedFactor]}
                    onValueChange={([value]) => setSpeedFactor(value)}
                    min={SPEED_MIN}
                    max={SPEED_MAX}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{SPEED_MIN}x</span>
                    <span>{SPEED_MAX}x</span>
                  </div>
                  {/* Speed Presets */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SPEED_PRESETS.map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant={speedFactor === preset ? 'default' : 'outline'}
                        size="sm"
                        className="min-w-[3rem]"
                        onClick={() => setSpeedFactor(preset)}
                      >
                        {preset}x
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Limits Info */}
                {limits && (
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border/50 space-y-1">
                    <p className="flex justify-between">
                      <span>Suas sessoes:</span>
                      <span className="font-medium tabular-nums">
                        {limits.currentUser}/{limits.maxPerUser}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Sessoes globais:</span>
                      <span className="font-medium tabular-nums">
                        {limits.currentGlobal}/{limits.maxGlobal}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Footer with buttons - always visible */}
              <DialogFooter className="px-6 py-4 border-t border-border/50 bg-card">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={!canCreate}>
                  Criar Sessao
                </Button>
              </DialogFooter>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
