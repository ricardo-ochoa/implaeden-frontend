// src/theme.js
import { createTheme } from "@mui/material/styles";

export default function buildMuiTheme(mode = "light") {
  return createTheme({
    palette: {
      mode,
      primary: { main: "#1976d2" },
      secondary: { main: "#f700ff" },

      // ✅ sincroniza con shadcn tokens
      background: {
        default: "hsl(var(--background))",
        paper: "hsl(var(--card))",
      },
      text: {
        primary: "hsl(var(--foreground))",
        secondary: "hsl(var(--muted-foreground))",
      },
      divider: "hsl(var(--border))",
    },

    typography: {
      fontFamily: "Roboto, Arial, sans-serif",
    },

    shape: {
      borderRadius: 12,
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            // ayuda a que el fondo sea consistente
            backgroundColor: "hsl(var(--background))",
          },
          body: {
            backgroundColor: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            minHeight: "100vh",
          },
        },
      },

      // Opcional: inputs/bordes alineados con tokens
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: "hsl(var(--background))",
          },
          notchedOutline: {
            borderColor: "hsl(var(--border))",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}
