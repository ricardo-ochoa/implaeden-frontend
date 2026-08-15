"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Settings } from "lucide-react";

// Rutas que se comparten con gente de fuera de la clínica: no deben mostrar la
// navegación interna ni el botón de sesión. Son páginas de una sola tarea.
const RUTAS_SIN_HEADER = ["/constancia"];

const esRutaPublica = (pathname) =>
  RUTAS_SIN_HEADER.some((base) => pathname === base || pathname?.startsWith(`${base}/`));

function NavLink({ href, children, active }) {
  return (
    <Link
      href={href}
      className={[
        "text-sm font-medium transition-opacity",
        "border-b-2 pb-1",
        active ? "border-primary" : "border-transparent",
        "hover:opacity-85 hover:border-border",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, loading, isAuthenticated, user } = useAuth();

  // ✅ usa theme + resolvedTheme para manejar "system"
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false)

  const isAdmin =
    user?.role === 'admin' ||
    user?.rol === 'admin' ||
    user?.isAdmin === true ||
    user?.is_admin === true

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  // ✅ robusto: si theme = system, usa resolvedTheme; si no, usa theme
  const isDark =
    mounted &&
    (theme === "dark" || (theme === "system" && resolvedTheme === "dark"));

  const logoSrc = isDark ? "/logo_dark.svg" : "/logo.svg";

  // Va después de todos los hooks para no alterar su orden entre renders.
  if (esRutaPublica(pathname)) return null;

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-16 items-center justify-between" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-16 items-center justify-between gap-4 px-4">
        {/* Left: Logo */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center select-none"
          aria-label="Ir al inicio"
        >
          <Image
            src={logoSrc}
            alt="Implaedén Logo"
            width={150}
            height={40}
            priority
          />
        </button>

        {/* Center: Nav links (solo con sesión) */}
        {isAuthenticated ? (
          <nav className="flex items-center gap-6">
            <NavLink href="/chat" active={isActive("/chat")}>
              Chat
            </NavLink>
            <NavLink href="/pacientes" active={isActive("/pacientes")}>
              Pacientes
            </NavLink>
            <NavLink href="/agenda" active={isActive("/agenda")}>
              Agenda
            </NavLink>
            <NavLink href="/cobranza" active={isActive("/cobranza")}>
              Cobranza
            </NavLink>
          </nav>
        ) : (
          <div />
        )}

        {/* Right: Theme + Auth */}
        <div className="flex items-center gap-2">
          <ThemeToggleButton />

          {isAuthenticated ? (
            <Button className="rounded-full" variant="outline" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          ) : (
            <Button className="rounded-full" variant="outline" onClick={() => router.push("/login")}>
              Iniciar sesión
            </Button>
          )}
        {isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-full" variant="outline" size="sm">
                  <Settings />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-[220px]">
                <DropdownMenuItem asChild>
                  <Link href="/admin/servicios">Tratamientos / Servicios</Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/admin/medicos">Médicos</Link>
                </DropdownMenuItem>

                {/* Aquí luego metemos más secciones admin */}
                {/* <DropdownMenuItem asChild>
                  <Link href="/admin/usuarios">Usuarios</Link>
                </DropdownMenuItem> */}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

      </div>
    </header>
  );
}
