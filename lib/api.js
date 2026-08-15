// src/lib/api.js
import axios from 'axios';
import { getCookie } from './cookieHelper'; // 1. Importa la función para leer cookies

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// El interceptor se encargará de añadir el token en cada petición
api.interceptors.request.use(
  (config) => {
    // 2. Lee el token desde las COOKIES, no desde localStorage
    const token = getCookie('token'); 
    
    if (token) {
      // Si el token existe, lo añade al encabezado
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Maneja errores de la petición
    return Promise.reject(error);
  }
);

// Rutas cuyo 401 es una respuesta legítima y NO significa "tu sesión murió":
// el login con credenciales malas, y la subida pública de la constancia (que ni
// siquiera lleva sesión).
const RUTAS_SIN_SESION = ['/auth/login', '/auth/token', '/constancia-fiscal'];

const esRutaSinSesion = (url = '') => RUTAS_SIN_SESION.some((r) => String(url).includes(r));

// Interceptor de RESPUESTA: sin esto, cuando el access token caduca (8 h) la app
// se queda pintada como si siguiera logueada, pero cada petición devuelve 401 y
// no carga ningún dato. El evento lo escucha AuthContext, que cierra sesión y
// manda a /login con un aviso.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 && typeof window !== 'undefined' && !esRutaSinSesion(error?.config?.url)) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { motivo: 'expirado' } }));
    }

    return Promise.reject(error);
  }
);

export const fetcher = url => api.get(url).then(res => res.data);

export default api;