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

export const fetcher = url => api.get(url).then(res => res.data);

export default api;