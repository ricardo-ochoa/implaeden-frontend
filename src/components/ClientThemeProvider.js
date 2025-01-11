// src/components/ClientThemeProvider.js
'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '@/theme';

export default function ClientThemeProvider({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
