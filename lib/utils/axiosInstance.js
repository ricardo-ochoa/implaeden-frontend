import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api', // Cambia la URL según tu entorno
});

export default axiosInstance;
