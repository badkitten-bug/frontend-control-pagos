import axios from 'axios';
import toast from 'react-hot-toast';

const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const baseURL = base.endsWith('/api') ? base : `${base.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 409) {
      toast.error(
        'Esta operación ya se estaba procesando o causó un conflicto. Por favor, intenta nuevamente si no ves el registro.',
        { duration: 5000 }
      );
    }
    return Promise.reject(error);
  }
);

export default api;
