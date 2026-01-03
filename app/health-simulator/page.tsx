'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

import { AppHeader } from '../src/components/AppHeader';
import { LoadingState, ErrorState, LastUpdated } from '../src/components/FeedbackStates';
import http from '../src/utils/http';

export default function HealthSimulatorPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<unknown>(null);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);

  // Regra 6: Permitir refetch
  const fetchHealth = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await http.get('/health/detailed');
      setData(res.data);
      setLastUpdate(new Date());
    } catch {
      setError('Falha ao carregar os dados de saúde do simulador. Verifique a conexão com a API.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Regra 2: Atalho para atualizar
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !loading) {
        e.preventDefault();
        fetchHealth();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loading, fetchHealth]);

  // Determinar status geral
  const isHealthy = React.useMemo(() => {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return d.status === 'ok' || d.status === 'healthy' || d.healthy === true;
  }, [data]);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppHeader />

      <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3, mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Health Simulator
            </Typography>
            {/* Regra 3: Feedback visual do status */}
            {!loading && !error && (
              <Tooltip title={isHealthy ? 'Simulador saudável' : 'Simulador com problemas'} arrow>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: isHealthy ? 'success.light' : 'error.light',
                  }}
                >
                  {isHealthy ? (
                    <CheckCircleIcon sx={{ color: 'success.dark', fontSize: 18 }} />
                  ) : (
                    <ErrorIcon sx={{ color: 'error.dark', fontSize: 18 }} />
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: isHealthy ? 'success.dark' : 'error.dark' }}>
                    {isHealthy ? 'Saudável' : 'Atenção'}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" alignItems="center" gap={2}>
            {/* Regra 3: Última atualização */}
            <LastUpdated timestamp={lastUpdate} />
            {/* Regra 7: Controle do usuário */}
            <Tooltip title="Atualizar dados (Atalho: R)" arrow>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchHealth}
                disabled={loading}
                size="small"
              >
                Atualizar
              </Button>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Regra 3: Feedback - Estados de loading/error */}
        {loading ? (
          <LoadingState message="Verificando saúde do simulador..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchHealth} />
        ) : (
          <Paper sx={{ p: 2 }}>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 1,
                overflow: 'auto',
                fontSize: 12,
                fontFamily: 'monospace',
                maxHeight: '70vh',
              }}
            >
              {JSON.stringify(data, null, 2)}
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
