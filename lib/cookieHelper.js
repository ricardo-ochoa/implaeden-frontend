//lib/cookieHelper.js
"use client"

export function getCookie(name) {
  // Solo se ejecuta en el navegador
  if (typeof document === 'undefined') {
    return null;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    // Extrae el valor de la cookie
    return parts.pop().split(';').shift();
  }
  return null;
}