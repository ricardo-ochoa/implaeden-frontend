"use client";

import { createContext, useContext } from "react";

export const ThemeModeContext = createContext({
  mode: "light",
  toggleMode: () => {},
  setMode: (_mode) => {},
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
