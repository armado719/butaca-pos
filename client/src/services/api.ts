import axios from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Error inesperado';

    if (status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    } else if (status === 403) {
      toast.error('No tienes permisos para realizar esta acción');
    } else if (status >= 500) {
      toast.error(`Error del servidor: ${message}`);
    } else if (!error.response) {
      toast.error('Error de conexión con el servidor');
    }
    
    return Promise.reject(error);
  }
);

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace('/api', '');
