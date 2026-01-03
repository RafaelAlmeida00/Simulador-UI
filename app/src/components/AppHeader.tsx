'use client';

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PauseIcon from '@mui/icons-material/Pause';
import { useTheme } from '@mui/material/styles';
import { animated, useSpring } from '@react-spring/web';
import { useRouter } from 'next/navigation';

import { useColorMode } from '../providers/ColorModeProvider';
import { useSimulatorStore } from '../hooks/useSimulatorStore';
import { getSocket } from '../utils/socket';

export function AppHeader() {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const { mode, toggleMode } = useColorMode();
  const router = useRouter();

  // Subscribe to health via WebSocket store
  const sim = useSimulatorStore();
  const simulatorStatus = sim.health?.data?.simulatorStatus ?? '';

  // Ensure socket is initialized (subscribes to health on connect)
  React.useEffect(() => {
    getSocket();
  }, []);

  // Control handlers
  const handleStart = () => {
    getSocket().emit('controlSimulator', { action: 'start' });
  };
  const handleStop = () => {
    getSocket().emit('controlSimulator', { action: 'stop' });
  };
  const handleRestart = () => {
    getSocket().emit('controlSimulator', { action: 'restart' });
  };
  const handlePause = () => {
    getSocket().emit('controlSimulator', { action: 'pause' });
  };

  const drawerAnim = useSpring({
    opacity: open ? 1 : 0,
    transform: open ? 'translateX(0px)' : 'translateX(-8px)',
    config: { tension: 260, friction: 24 },
  });

  return (
    <>
      <AppBar
        position="sticky"
        elevation={2}
        color="default"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between' }}>
          <IconButton aria-label="Abrir menu" edge="start" onClick={() => setOpen(true)}>
            <MenuIcon />
          </IconButton>

          <Stack direction="row" spacing={1} alignItems="center">
            {/* Start: appears if status != 'running' */}
            {simulatorStatus !== 'running' && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={handleStart}
              >
                Start
              </Button>
            )}

            {/* Pause: appears only if status == 'running' */}
            {simulatorStatus === 'running' && (
              <Button
                size="small"
                variant="contained"
                color="warning"
                startIcon={<PauseIcon />}
                onClick={handlePause}
              >
                Pause
              </Button>
            )}

            {/* Stop: appears if status != 'stopped' */}
            {simulatorStatus !== 'stopped' && (
              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleStop}
              >
                Stop
              </Button>
            )}

            {/* Restart: appears if status != 'stopped' */}
            {simulatorStatus !== 'stopped' && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleRestart}
              >
                Restart
              </Button>
            )}

            <IconButton aria-label="Alternar tema" onClick={toggleMode}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            bgcolor: 'background.paper',
            boxShadow: 12,
          },
        }}
      >
        <animated.div style={drawerAnim as unknown as React.CSSProperties}>
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Menu
            </Typography>
            <IconButton aria-label="Fechar" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          <List disablePadding>
            {[
              { label: 'Home', href: '/' },
              { label: 'OEE', href: '/oee' },
              { label: 'MTTR / MTBF', href: '/mttr-mtbf' },
              { label: 'Stoppages', href: '/stoppages' },
              { label: 'Events', href: '/events' },
              { label: 'Buffers', href: '/buffers' },
              { label: 'Settings', href: '/settings' },
              { label: 'Health Simulator', href: '/health-simulator' },
              

            ].map((item) => (
              <ListItemButton
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </animated.div>
      </Drawer>
    </>
  );
}
