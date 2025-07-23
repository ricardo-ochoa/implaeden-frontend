// lib/hooks/useAuth.js
"use client";

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';         // 1. Importamos la librería para cookies
import { jwtDecode } from 'jwt-decode';  // 2. Importamos la librería para decodificar JWT

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 3. Leemos el token desde las cookies
    const token = Cookies.get('token'); 

    if (token) {
      try {
        // 4. Usamos jwt-decode para parsear el token de forma segura
        const decodedUser = jwtDecode(token); 
        setUser(decodedUser);
      } catch (error) {
        // Si el token es inválido, lo borramos de las cookies
        console.error("Token inválido, eliminando cookie.", error);
        Cookies.remove('token', { path: '/' }); 
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []); // Se ejecuta solo una vez al cargar el componente

  return user;
}