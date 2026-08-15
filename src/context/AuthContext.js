// src/contexts/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

// Rutas a las que se entra sin sesión. `/constancia/<token>` la abre el propio
// paciente desde el link privado: si el guardia lo mandara a /login, el feature
// no serviría de nada. El matcher de middleware.js tampoco las cubre.
const PUBLIC_ROUTES = ['/login', '/constancia'];

const isPublicRoute = (pathname) =>
  PUBLIC_ROUTES.some((base) => pathname === base || pathname?.startsWith(`${base}/`));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booted, setBooted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const logout = useCallback(() => {
    clearLogoutTimer();
    Cookies.remove('token', { path: '/' });
    setUser(null);
  }, []);

  const login = useCallback((token) => {
    try {
      Cookies.set('token', token, { path: '/', expires: 7 });
      const userData = jwtDecode(token);
      setUser(userData);
    } catch (error) {
      console.error("Fallo al procesar el token en login:", error);
      Cookies.remove('token', { path: '/' });
      setUser(null);
    }
  }, []);

  // 1) Cargar usuario + programar auto-logout cuando expira
  useEffect(() => {
    const token = Cookies.get('token');

    clearLogoutTimer();

    if (!token) {
      setUser(null);
      setBooted(true);
      return;
    }

    try {
      const userData = jwtDecode(token);

      // exp viene en segundos (JWT standard)
      const expMs = typeof userData?.exp === 'number' ? userData.exp * 1000 : null;

      // Si no hay exp, igual seteamos user; si hay exp y ya expiró => logout
      if (expMs && Date.now() >= expMs) {
        logout();
        setBooted(true);
        return;
      }

      setUser(userData);

      // Programar logout justo cuando expire
      if (expMs) {
        const msLeft = expMs - Date.now();
        logoutTimerRef.current = setTimeout(() => {
          logout();
        }, Math.max(msLeft, 0));
      }
    } catch (e) {
      Cookies.remove('token', { path: '/' });
      setUser(null);
    } finally {
      setBooted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logout]);

  // 2) Redirect sin recargar cuando se pierde sesión (pero solo después de boot)
  useEffect(() => {
    if (!booted) return;

    if (!user && !isPublicRoute(pathname)) {
      router.replace('/login');
    }
  }, [booted, user, pathname, router]);

  // 3) Escuchar evento global (lo usaremos con Axios/fetch para 401)
  useEffect(() => {
    const onUnauthorized = () => {
      logout();
      // evita loop si ya estás en login, y no expulsa al paciente de una
      // página pública (el link de la constancia no lleva sesión).
      if (!isPublicRoute(pathname)) router.replace('/login');
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [logout, router, pathname]);

  const value = { user, login, logout, isAuthenticated: !!user, booted };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};
