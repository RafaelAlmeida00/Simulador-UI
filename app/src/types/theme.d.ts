import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    textStation: string;
    icon: string;
  }

  interface PaletteOptions {
    textStation?: string;
    icon?: string;
  }
}
