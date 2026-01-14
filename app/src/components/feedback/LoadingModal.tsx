'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Factory, Database, Shield, Zap } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Mensagens de engenharia social para diferentes contextos
const loadingMessages = {
  default: [
    'Processando requisicao...',
    'Carregando dados...',
    'Preparando visualizacao...',
    'Quase pronto...',
    'Finalizando...',
  ],
  auth: [
    'Validando credenciais...',
    'Verificando permissoes...',
    'Estabelecendo sessao segura...',
    'Autenticando usuario...',
    'Sincronizando dados...',
  ],
  data: [
    'Consultando banco de dados...',
    'Processando registros...',
    'Agregando metricas...',
    'Calculando estatisticas...',
    'Preparando relatorio...',
  ],
  simulator: [
    'Inicializando simulador...',
    'Carregando configuracao da planta...',
    'Preparando estacoes...',
    'Sincronizando buffers...',
    'Conectando ao servidor...',
  ],
  save: [
    'Validando campos...',
    'Preparando dados...',
    'Salvando alteracoes...',
    'Sincronizando com servidor...',
    'Confirmando gravacao...',
  ],
};

type LoadingContext = keyof typeof loadingMessages;

interface LoadingModalProps {
  open: boolean;
  context?: LoadingContext;
  customMessage?: string;
  showProgress?: boolean;
  progress?: number;
}

export function LoadingModal({
  open,
  context = 'default',
  customMessage,
  showProgress = false,
  progress = 0,
}: LoadingModalProps) {
  const [messageIndex, setMessageIndex] = React.useState(0);
  const messages = loadingMessages[context];

  React.useEffect(() => {
    if (!open) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [open, messages.length]);

  const getIcon = () => {
    switch (context) {
      case 'auth':
        return <Shield className="h-6 w-6" />;
      case 'data':
        return <Database className="h-6 w-6" />;
      case 'simulator':
        return <Factory className="h-6 w-6" />;
      case 'save':
        return <Zap className="h-6 w-6" />;
      default:
        return <Loader2 className="h-6 w-6" />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 shadow-2xl"
          >
            {/* Animated Icon */}
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                {getIcon()}
              </motion.div>

              {/* Pulsing ring */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-primary"
              />
            </div>

            {/* Message */}
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={customMessage || messageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-medium text-muted-foreground"
                >
                  {customMessage || messages[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            {showProgress && (
              <div className="w-48">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  {progress}%
                </p>
              </div>
            )}

            {/* Animated dots */}
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -6, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="h-2 w-2 rounded-full bg-primary"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Success/Error feedback modal
interface FeedbackModalProps {
  open: boolean;
  type: 'success' | 'error';
  title: string;
  message?: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function FeedbackModal({
  open,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000,
}: FeedbackModalProps) {
  React.useEffect(() => {
    if (open && autoClose && onClose) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [open, autoClose, autoCloseDelay, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 15, stiffness: 300 }}
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-full',
                type === 'success' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
              )}
            >
              {type === 'success' ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : (
                <XCircle className="h-8 w-8" />
              )}
            </motion.div>

            <div className="text-center">
              <h3 className="text-lg font-semibold">{title}</h3>
              {message && (
                <p className="mt-1 text-sm text-muted-foreground">{message}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for loading state management
export function useLoading() {
  const [loading, setLoading] = React.useState(false);
  const [context, setContext] = React.useState<LoadingContext>('default');
  const [customMessage, setCustomMessage] = React.useState<string | undefined>();

  const startLoading = React.useCallback(
    (ctx: LoadingContext = 'default', message?: string) => {
      setContext(ctx);
      setCustomMessage(message);
      setLoading(true);
    },
    []
  );

  const stopLoading = React.useCallback(() => {
    setLoading(false);
    setCustomMessage(undefined);
  }, []);

  const withLoading = React.useCallback(
    async <T,>(
      promise: Promise<T>,
      ctx: LoadingContext = 'default',
      message?: string
    ): Promise<T> => {
      startLoading(ctx, message);
      try {
        return await promise;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    loading,
    context,
    customMessage,
    startLoading,
    stopLoading,
    withLoading,
  };
}
