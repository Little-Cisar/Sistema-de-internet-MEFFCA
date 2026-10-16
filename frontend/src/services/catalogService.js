import api from './api';

export const catalogService = {
  getProducts: (params = {}) => api.get('/productos', { params }),
  getProduct: (id) => api.get(`/productos/${encodeURIComponent(id)}`),
  getMyProducts: () => api.get('/productos/mios'),
  createProduct: (payload) => api.post('/productos', payload),
  updateProduct: (id, payload) => api.put(`/productos/${encodeURIComponent(id)}`, payload),
  setProductStatus: (id, estado) => api.patch(`/productos/${encodeURIComponent(id)}/estado`, { estado }),
  getCategories: () => api.get('/categorias'),
  createCategory: (payload) => api.post('/categorias', payload),
  updateCategory: (id, payload) => api.put(`/categorias/${encodeURIComponent(id)}`, payload),
  getEntrepreneurs: () => api.get('/protagonistas'),
  getEntrepreneur: (id) => api.get(`/protagonistas/${encodeURIComponent(id)}`),
  getMyBusiness: () => api.get('/protagonistas/me'),
  updateBusiness: (id, payload) => api.put(`/protagonistas/${encodeURIComponent(id)}`, payload),
  recordInteraction: (payload) => api.post('/interacciones', payload),
  getMyInteractions: () => api.get('/interacciones/mis'),
  getInteractionReport: () => api.get('/reportes/interacciones'),
  getUsersForAdmin: () => api.get('/admin/usuarios'),
  getPendingEntrepreneurs: () => api.get('/admin/protagonistas/pendientes'),
  setEntrepreneurVerification: (id, estado_verificacion) => api.patch(`/admin/protagonistas/${encodeURIComponent(id)}/verificacion`, { estado_verificacion })
};
