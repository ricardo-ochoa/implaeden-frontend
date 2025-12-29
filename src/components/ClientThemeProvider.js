"use client";

import { useEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { ThemeModeContext } from "@/context/ThemeModeContext";

const STORAGE_KEY = "implaeden.muiThemeMode"; // "light" | "dark"

export default function ClientThemeProvider({ children }) {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") setMode(saved);
  }, []);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        // aquí puedes meter tus colores (primary/secondary) como ya los traías
      },
      shape: { borderRadius: 12 },
    });
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
