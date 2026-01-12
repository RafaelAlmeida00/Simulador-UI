'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { useTheme, alpha } from '@mui/material/styles';

import { formatSimTime } from '../utils/timeFormat';

export type SimulatorTimeDisplayProps = {
  timestamp?: number | null;
  label?: string;
};

export const SimulatorTimeDisplay = React.memo(function SimulatorTimeDisplay({
  timestamp,
  label = 'Tempo atual da simulacao',
}: SimulatorTimeDisplayProps) {
  const theme = useTheme();
  const simTime = formatSimTime(timestamp ?? undefined);

  return (
    <Tooltip title={label} arrow>
      <Box
        sx={{
          px: 1.25,
          py: 0.5,
          borderRadius: 2,
          bgcolor: alpha(
            theme.palette.primary.main,
            theme.palette.mode === 'dark' ? 0.18 : 0.1
          ),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800 }}>
          {simTime}
        </Typography>
      </Box>
    </Tooltip>
  );
});

export default SimulatorTimeDisplay;
