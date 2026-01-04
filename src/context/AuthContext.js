// src/contexts/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

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

    const publicRoutes = ['/login']; // agrega aquí otras públicas si quieres
    const isPublic = publicRoutes.includes(pathname);

    if (!user && !isPublic) {
      router.replace('/login');
    }
  }, [booted, user, pathname, router]);

  // 3) Escuchar evento global (lo usaremos con Axios/fetch para 401)
  useEffect(() => {
    const onUnauthorized = () => {
      logout();
      // evita loop si ya estás en login
      if (pathname !== '/login') router.replace('/login');
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
