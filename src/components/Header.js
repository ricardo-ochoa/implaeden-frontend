"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import ThemeToggleButton from "@/components/ThemeToggleButton";

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
  const { logout, loading, isAuthenticated } = useAuth();

  // ✅ usa theme + resolvedTheme para manejar "system"
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

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
          </nav>
        ) : (
          <div />
        )}

        {/* Right: Theme + Auth */}
        <div className="flex items-center gap-2">
          <ThemeToggleButton />

          {isAuthenticated ? (
            <Button variant="outline" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          ) : (
            <Button variant="outline" onClick={() => router.push("/login")}>
              Iniciar sesión
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
