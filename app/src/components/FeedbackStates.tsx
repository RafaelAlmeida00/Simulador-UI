'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Fade from '@mui/material/Fade';

import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InboxIcon from '@mui/icons-material/Inbox';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

// ─────────────────────────────────────────────────────────────
// 8 Regras de Ouro - Componentes de Feedback
// ─────────────────────────────────────────────────────────────

/**
 * Regra 3: Feedback informativo
 * Loading state com mensagem customizável
 */
export function LoadingState({
  message = 'Carregando dados...',
  size = 40,
}: {
  message?: string;
  size?: number;
}) {
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          gap: 2,
        }}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <CircularProgress size={size} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Fade>
  );
}

/**
 * Regra 3 & 5: Feedback informativo + Prevenção de erros
 * Error state com opção de retry
 */
export function ErrorState({
  message = 'Ocorreu um erro ao carregar os dados.',
  onRetry,
  retryLabel = 'Tentar novamente',
}: {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <Fade in timeout={300}>
      <Paper
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'error.50',
          border: 1,
          borderColor: 'error.light',
        }}
        role="alert"
        aria-live="assertive"
      >
        <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
        <Typography variant="body1" color="error.main" textAlign="center">
          {message}
        </Typography>
        {onRetry && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            aria-label={retryLabel}
          >
            {retryLabel}
          </Button>
        )}
      </Paper>
    </Fade>
  );
}

/**
 * Regra 8: Redução da carga de memória
 * Empty state com ação sugerida
 */
export function EmptyState({
  message = 'Nenhum dado disponível.',
  icon: IconComponent = InboxIcon,
  action,
  actionLabel,
}: {
  message?: string;
  icon?: React.ElementType;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <Fade in timeout={300}>
      <Paper
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'grey.50',
        }}
        role="status"
      >
        <IconComponent sx={{ fontSize: 48, color: 'text.secondary' }} />
        <Typography variant="body1" color="text.secondary" textAlign="center">
          {message}
        </Typography>
        {action && actionLabel && (
          <Button variant="contained" onClick={action}>
            {actionLabel}
          </Button>
        )}
      </Paper>
    </Fade>
  );
}

/**
 * Regra 4: Fechar o diálogo - Informar conclusão de processos
 * Success feedback temporário
 */
export function SuccessFeedback({
  message = 'Operação realizada com sucesso!',
  open,
  onClose,
  duration = 4000,
}: {
  message?: string;
  open: boolean;
  onClose: () => void;
  duration?: number;
}) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity="success"
        onClose={onClose}
        icon={<CheckCircleIcon />}
        sx={{ boxShadow: 6 }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

/**
 * Regra 3: Feedback informativo - Snackbar genérico
 */
export type FeedbackSnackbarProps = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
};

export function FeedbackSnackbar({
  open,
  message,
  severity,
  onClose,
  duration = 4000,
}: FeedbackSnackbarProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert severity={severity} onClose={onClose} sx={{ boxShadow: 6 }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

/**
 * Regra 8: Redução da carga de memória
 * Tooltip informativo para campos/botões
 */
export function InfoTooltip({
  title,
  children,
}: {
  title: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip title={title} arrow placement="top">
      {children}
    </Tooltip>
  );
}

/**
 * Regra 4: Fechar o diálogo - Indicador de progresso/status
 */
export function ConnectionStatus({
  connected,
  connectedLabel = 'Conectado',
  disconnectedLabel = 'Desconectado',
}: {
  connected: boolean;
  connectedLabel?: string;
  disconnectedLabel?: string;
}) {
  return (
    <Tooltip title={connected ? connectedLabel : disconnectedLabel}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: connected ? 'success.light' : 'error.light',
        }}
        role="status"
        aria-live="polite"
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: connected ? 'success.main' : 'error.main',
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: connected ? 'success.dark' : 'error.dark',
          }}
        >
          {connected ? connectedLabel : disconnectedLabel}
        </Typography>
      </Box>
    </Tooltip>
  );
}

/**
 * Regra 1: Consistência - Contador de resultados
 */
export function ResultsCount({
  total,
  filtered,
  label = 'registros',
}: {
  total: number;
  filtered?: number;
  label?: string;
}) {
  const showFiltered = typeof filtered === 'number' && filtered !== total;

  return (
    <Typography variant="body2" color="text.secondary" role="status">
      {showFiltered ? (
        <>
          Mostrando <strong>{filtered}</strong> de <strong>{total}</strong> {label}
        </>
      ) : (
        <>
          <strong>{total}</strong> {label}
        </>
      )}
    </Typography>
  );
}

/**
 * Regra 3: Feedback informativo - Indicador de última atualização
 */
export function LastUpdated({
  timestamp,
  prefix = 'Última atualização:',
}: {
  timestamp: number | Date | null;
  prefix?: string;
}) {
  const formatted = React.useMemo(() => {
    if (!timestamp) return null;
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString('pt-BR');
  }, [timestamp]);

  if (!formatted) return null;

  return (
    <Tooltip title={`${prefix} ${formatted}`}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <InfoIcon fontSize="inherit" />
        {formatted}
      </Typography>
    </Tooltip>
  );
}

/**
 * Regra 5: Prevenção de erros - Diálogo de confirmação
 */
export function useConfirmDialog() {
  const [state, setState] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirm = React.useCallback(
    (title: string, message: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          open: true,
          title,
          message,
          onConfirm: () => {
            setState((s) => ({ ...s, open: false }));
            resolve(true);
          },
        });
      });
    },
    []
  );

  const close = React.useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  return { state, confirm, close };
}

/**
 * Regra 2: Atalhos para usuários experientes - Hook para keyboard shortcuts
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: { ctrl?: boolean; shift?: boolean; alt?: boolean }
) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (options?.ctrl && !e.ctrlKey) return;
      if (options?.shift && !e.shiftKey) return;
      if (options?.alt && !e.altKey) return;
      if (e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, options]);
}
