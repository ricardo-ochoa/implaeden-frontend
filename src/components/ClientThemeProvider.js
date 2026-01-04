// src/components/ClientThemeProvider.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme, StyledEngineProvider } from "@mui/material";
import { ThemeModeContext } from "@/context/ThemeModeContext";

const STORAGE_KEY = "implaeden.muiThemeMode"; // "light" | "dark"

export default function ClientThemeProvider({ children }) {
  const [mode, setModeState] = useState("light"); 

  const applyMode = (nextMode) => {
    localStorage.setItem(STORAGE_KEY, nextMode);
    document.documentElement.classList.toggle("dark", mode === "dark");
    setModeState(nextMode);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") applyMode(saved);
    else applyMode("light");
  }, []);

  const setMode = (next) => {
    const nextMode = typeof next === "function" ? next(mode) : next;
    if (nextMode === "dark" || nextMode === "light") applyMode(nextMode);
  };

  const toggleMode = () => applyMode(mode === "dark" ? "light" : "dark");

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        primary: { main: "#1976d2" },
        secondary: { main: "#f700ff" },
        background: {
          default: "hsl(var(--background))",
          paper: "hsl(var(--card))",
        },
        text: {
          primary: "hsl(var(--foreground))",
        },
      },
      shape: { borderRadius: 12 },
      typography: {
        fontFamily: "Roboto, Arial, sans-serif",
      },
    });
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, toggleMode }}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </ThemeModeContext.Provider>
  );
}
