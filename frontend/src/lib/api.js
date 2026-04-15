import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
});

// Injeta token JWT em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('telaplay_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para login em 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('telaplay_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;