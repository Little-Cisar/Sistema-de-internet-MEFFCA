import api from './api';

export const salesService = {
  createSale: (payload) => api.post('/ventas', payload),
  getMySales: () => api.get('/ventas/mias'),
  getMyPurchases: () => api.get('/ventas/compras'),
  getAllSales: () => api.get('/ventas'),
  getSalesReport: () => api.get('/reportes/ventas'),
  getSale: (id) => api.get(`/ventas/${encodeURIComponent(id)}`),
  cancelSale: (id) => api.patch(`/ventas/${encodeURIComponent(id)}/anular`)
};
