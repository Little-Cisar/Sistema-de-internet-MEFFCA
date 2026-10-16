import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('mefcca_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && sessionStorage.getItem('mefcca_token')) {
      sessionStorage.removeItem('mefcca_token');
      window.dispatchEvent(new CustomEvent('mefcca:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
