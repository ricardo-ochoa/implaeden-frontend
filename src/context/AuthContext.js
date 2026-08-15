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
  // Distingue "se te venció la sesión" de "nunca entraste": sin esto, quien
  // llega directo a una ruta privada vería un aviso de expiración que no aplica.
  const tuvoSesionRef = useRef(false);

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
      const userData = jwtDecode(token);

      // La cookie caduca CUANDO caduca el token, no a los 7 días. Antes vivía
      // más que el JWT, así que el middleware y el render en servidor veían una
      // cookie válida y dejaban entrar a una app que ya no podía pedir datos.
      const expMs = typeof userData?.exp === 'number' ? userData.exp * 1000 : null;
      Cookies.set('token', token, {
        path: '/',
        ...(expMs ? { expires: new Date(expMs) } : { expires: 7 }),
      });

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

  useEffect(() => {
    if (user) tuvoSesionRef.current = true;
  }, [user]);

  // Arma la URL de login, avisando de la expiración solo si de verdad hubo sesión.
  const urlDeLogin = useCallback((desde) => {
    const params = new URLSearchParams();
    if (tuvoSesionRef.current) params.set('sesion', 'expirada');
    if (desde && desde !== '/') params.set('volver', desde);
    const qs = params.toString();
    return qs ? `/login?${qs}` : '/login';
  }, []);

  // 2) Redirect sin recargar cuando se pierde sesión (pero solo después de boot)
  useEffect(() => {
    if (!booted) return;

    if (!user && !isPublicRoute(pathname)) {
      router.replace(urlDeLogin(pathname));
    }
  }, [booted, user, pathname, router, urlDeLogin]);

  // 3) Cierre de sesión por 401 del API (lo dispara el interceptor de lib/api).
  useEffect(() => {
    const onUnauthorized = () => {
      logout();
      // evita loop si ya estás en login, y no expulsa al paciente de una
      // página pública (el link de la constancia no lleva sesión).
      if (!isPublicRoute(pathname)) router.replace(urlDeLogin(pathname));
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [logout, router, pathname, urlDeLogin]);

  // 4) Revisar la caducidad al volver a la pestaña.
  //
  // El setTimeout de arriba no basta: si la laptop se suspende, el navegador
  // congela o retrasa los temporizadores, y justo ése es el caso que reportaba
  // el usuario (dejar la sesión abierta horas y encontrarse la app "cargada"
  // pero sin datos). Al recuperar el foco se vuelve a mirar el reloj del token.
  useEffect(() => {
    if (!booted) return;

    const revisarVigencia = () => {
      if (document.visibilityState === 'hidden') return;

      const token = Cookies.get('token');

      // Sin cookie pero con user en memoria: caducó o la borraron en otra pestaña.
      if (!token) {
        if (user) logout();
        return;
      }

      try {
        const { exp } = jwtDecode(token);
        if (typeof exp === 'number' && Date.now() >= exp * 1000) logout();
      } catch {
        logout();
      }
    };

    document.addEventListener('visibilitychange', revisarVigencia);
    window.addEventListener('focus', revisarVigencia);
    // Respaldo por si la pestaña queda visible pero quieta durante horas.
    const intervalo = setInterval(revisarVigencia, 60_000);

    return () => {
      document.removeEventListener('visibilitychange', revisarVigencia);
      window.removeEventListener('focus', revisarVigencia);
      clearInterval(intervalo);
    };
  }, [booted, user, logout]);

  const value = { user, login, logout, isAuthenticated: !!user, booted };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};
