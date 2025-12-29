"use client";

import { useAuth } from "@/context/AuthContext";
import { useThemeMode } from "@/context/ThemeModeContext";
import { AppBar, Toolbar, Button, Box, IconButton, Tooltip } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const { logout, loading, isAuthenticated } = useAuth();
  const { mode, toggleMode } = useThemeMode();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  const navLinkSx = (href) => ({
    textDecoration: "none",
    color: "text.primary",
    fontWeight: 500,
    px: 1,
    py: 0.5,
    borderBottom: "2px solid",
    borderColor: isActive(href) ? "primary.main" : "transparent",
    transition: "border-color 150ms ease, opacity 150ms ease",
    "&:hover": {
      color: "text.primary",
      opacity: 0.85,
      borderColor: isActive(href) ? "primary.main" : "divider",
    },
  });

  if (loading) {
    return (
      <AppBar
        position="static"
        elevation={0}
        sx={{
          mt: 2,
          bgcolor: "transparent",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar />
      </AppBar>
    );
  }

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        mt: 2,
        bgcolor: "transparent",
        color: "text.primary",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        {/* Left: Logo */}
        <Box
          onClick={() => router.push("/")}
          sx={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            userSelect: "none",
          }}
          aria-label="Ir al inicio"
        >
          <Image src="/logo.svg" alt="Implaedén Logo" width={150} height={40} priority />
        </Box>

        {/* Center: Nav links (menu style) */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box component={Link} href="/chat" sx={navLinkSx("/chat")}>
            Chat
          </Box>

          <Box component={Link} href="/pacientes" sx={navLinkSx("/pacientes")}>
            Pacientes
          </Box>
        </Box>

        {/* Right: Theme + Auth */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* <Tooltip title={mode === "dark" ? "Cambiar a Light" : "Cambiar a Dark"}>
            <IconButton
              onClick={toggleMode}
              size="small"
              aria-label="Cambiar modo de tema"
              sx={{ border: 1, borderColor: "divider" }}
            >
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip> */}

          {isAuthenticated ? (
            <Button variant="outlined" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          ) : (
            <Button variant="contained" onClick={() => router.push("/login")}>
              Iniciar sesión
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
