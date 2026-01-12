'use client';

import * as React from 'react';
import { List } from 'react-window';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AppHeader } from '../src/components/AppHeader';
import { BufferCardVirtual } from '../src/components/BufferCardVirtual';
import { DetailsDrawer } from '../src/components/DetailsDrawer';
import { LoadingState, EmptyState, ConnectionStatus } from '../src/components/FeedbackStates';
import { getSocket, reconnectSocket } from '../src/utils/socket';
import { useSimulatorSelector } from '../src/hooks/useSimulatorStore';
import { useDynamicBufferList } from '../src/hooks/useDynamicBufferList';
import type { IBuffer, ICar } from '../src/types/socket';

type DetailSelection =
  | { kind: 'buffer'; title: string; data: unknown }
  | { kind: 'car'; title: string; carId: string; data: unknown };

export default function BuffersPage() {
  const buffers = useSimulatorSelector(s => s.buffersState);
  const sim = useSimulatorSelector(s => s.connected);

  const [selection, setSelection] = React.useState<DetailSelection | null>(null);
  const rowHeight = useDynamicBufferList();

  React.useEffect(() => {
    getSocket();
  }, []);

  const handleBufferClick = React.useCallback((buffer: IBuffer) => {
    setSelection({
      kind: 'buffer',
      title: `Buffer ${buffer.id}`,
      data: buffer,
    });
  }, []);

  const handleCarClick = React.useCallback((car: ICar, carId: string) => {
    setSelection({
      kind: 'car',
      title: `Car ${carId}`,
      carId,
      data: car,
    });
  }, []);


  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppHeader />

      <Box sx={{ px: { xs: 1.5, sm: 3 }, pb: 3, mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Buffers
          </Typography>
          <Stack direction="row" alignItems="center" gap={1}>
            <ConnectionStatus
              connected={sim}
              connectedLabel="Online"
              disconnectedLabel="Offline"
            />
            {!sim && (
              <Tooltip title="Reconectar" arrow>
                <IconButton size="small" onClick={() => reconnectSocket()}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        {/* Loading state when no data yet */}
        {!sim && buffers.length === 0 && (
          <LoadingState message="Conectando ao simulador..." />
        )}

        {/* Empty state */}
        {sim && buffers.length === 0 && (
          <EmptyState message="Nenhum buffer disponivel no momento." />
        )}

        {/* Buffer list */}
        {buffers.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {buffers.length} buffer{buffers.length !== 1 ? 's' : ''} disponive{buffers.length !== 1 ? 'is' : 'l'}
            </Typography>

            <Box sx={{ width: '100%', maxWidth: 700, display: 'flex', justifyContent: 'center' }}>
              <List
                rowCount={buffers.length}
                rowHeight={rowHeight}
                rowComponent={(props) => <BufferCardVirtual {...props} />}
                rowProps={{
                  buffers,
                  onBufferClick: handleBufferClick,
                  onCarClick: handleCarClick,
                }}
                style={{ height: 600, width: '100%' }}
              />
            </Box>
          </Box>
        )}
      </Box>

      <DetailsDrawer
        open={Boolean(selection)}
        title={selection?.title ?? ''}
        sections={selection ? [{ title: selection.kind === 'car' ? 'Car' : 'Buffer', value: selection.data }] : []}
        onClose={() => setSelection(null)}
      />
    </Box>
  );
}
