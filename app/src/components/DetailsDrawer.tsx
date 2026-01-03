'use client';

import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';

export type DetailsSection = {
  title: string;
  value: unknown;
};

export type DetailsDrawerProps = {
  open: boolean;
  title: string;
  sections: DetailsSection[];
  onClose: () => void;
};

function JsonBlock({ value }: { value: unknown }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1,
        bgcolor: 'background.default',
        borderRadius: 1,
        overflow: 'auto',
        fontSize: 12,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </Box>
  );
}

export function DetailsDrawer({ open, title, sections, onClose }: DetailsDrawerProps) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 320, sm: 420 }, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="h6" noWrap>
            {title}
          </Typography>
          <IconButton aria-label="Fechar detalhes" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {sections.map((s) => (
          <Box key={s.title} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {s.title}
            </Typography>
            <JsonBlock value={s.value} />
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
