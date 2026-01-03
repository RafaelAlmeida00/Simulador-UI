'use client';

import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

type ColorMode = 'light' | 'dark';

type ColorModeContextValue = {
  mode: ColorMode;
  toggleMode: () => void;
};

const ColorModeContext = React.createContext<ColorModeContextValue | null>(null);

export function useColorMode(): ColorModeContextValue {
  const ctx = React.useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorMode must be used within ColorModeProvider');
  return ctx;
}

function getStoredMode(): ColorMode | null {
  try {
    const v = window.localStorage.getItem('ui-color-mode');
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

function storeMode(mode: ColorMode) {
  try {
    window.localStorage.setItem('ui-color-mode', mode);
  } catch {}
}

function buildTheme(mode: ColorMode) {
  const light = {
    background: '#FFFFFF',
    text: '#222222',
    textStation: '#222222',
    icon: '#222222',
    primary: '#1976D2',
    secondary: '#FFC107',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
  };

  const dark = {
    background: '#181818',
    text: '#FAFAFA',
    textStation: '#222222',
    icon: '#222222',
    primary: '#90CAF9',
    secondary: '#FFD54F',
    success: '#81C784',
    error: '#E57373',
    warning: '#FFB74D',
    info: '#64B5F6',
  };

  const c = mode === 'dark' ? dark : light;

  return createTheme({
    palette: {
      mode,
      background: {
        default: c.background,
        paper: mode === 'dark' ? '#1F1F1F' : '#FFFFFF',
      },
      text: {
        primary: c.text,
      },
      primary: { main: c.primary },
      secondary: { main: c.secondary },
      success: { main: c.success },
      error: { main: c.error },
      warning: { main: c.warning },
      info: { main: c.info },
      // Custom palette entries (strings): usados como `theme.palette.textStation` e `theme.palette.icon`.
      textStation: c.textStation,
      icon: c.icon,
    },
    shape: { borderRadius: 12 },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(8px)',
          },
        },
      },
    },
  });
}

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe default: light. Ajusta no client após mount.
  const [mode, setMode] = React.useState<ColorMode>('light');

  React.useEffect(() => {
    const stored = getStoredMode();
    if (stored) {
      setMode(stored);
      return;
    }

    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    setMode(prefersDark ? 'dark' : 'light');
  }, []);

  const toggleMode = React.useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      storeMode(next);
      return next;
    });
  }, []);

  const theme = React.useMemo(() => buildTheme(mode), [mode]);

  const value = React.useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
