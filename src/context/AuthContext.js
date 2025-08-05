// RUTA: src/contexts/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // AQUÍ SÍ EXISTE LA FUNCIÓN 'login'
  const login = useCallback((token) => {
    try {
      Cookies.set('token', token, { path: '/', expires: 7 });
      const userData = jwtDecode(token);
      setUser(userData); // <-- Notifica a toda la app que el usuario cambió
    } catch (error) {
      console.error("Fallo al procesar el token en login:", error);
      setUser(null);
    }
  }, []);

  // AQUÍ SÍ EXISTE LA FUNCIÓN 'logout'
  const logout = useCallback(() => {
    Cookies.remove('token', { path: '/' });
    setUser(null); // <-- Notifica a toda la app que el usuario cambió
  }, []);

  // Lógica para cargar el usuario al recargar la página
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const userData = jwtDecode(token);
        setUser(userData);
      } catch (e) {
        Cookies.remove('token', { path: '/' });
        setUser(null);
      }
    }
  }, []);

  // El valor que compartimos: el usuario Y las funciones para cambiarlo
  const value = { user, login, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// El hook que los componentes usarán para hablar con el "gerente"
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  // Devolvemos el objeto completo: { user, login, logout, ... }
  return context;
};