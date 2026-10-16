import api from './api';

export const authService = {
  register: (payload) => api.post('/auth/registro', payload),
  login: (payload) => api.post('/auth/login', payload),
  profile: () => api.get('/auth/perfil'),
  health: () => api.get('/health')
};
