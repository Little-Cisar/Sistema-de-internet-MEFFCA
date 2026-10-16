export function errorMessage(error, fallback = 'Ocurrió un problema al procesar la solicitud.') {
  if (error?.response?.status === 404) {
    const serverMessage = error?.response?.data?.mensaje || error?.response?.data?.message;
    if (serverMessage === 'Ruta no encontrada.' || !serverMessage) {
      return 'La ruta solicitada no existe en el backend que está respondiendo. Comprueba que ejecutaste la versión actualizada y que el endpoint esté registrado.';
    }
    return serverMessage;
  }
  if (error?.response?.data?.mensaje) return error.response.data.mensaje;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'La solicitud tardó demasiado. Comprueba que el backend esté activo.';
  if (!error?.response) return 'No se pudo conectar con la API. Verifica que el backend esté ejecutándose en http://localhost:3000.';
  return fallback;
}

export function extractList(responseData, possibleKeys = []) {
  if (Array.isArray(responseData)) return responseData;
  for (const key of possibleKeys) {
    if (Array.isArray(responseData?.[key])) return responseData[key];
  }
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
}

export function valueOf(object, keys, fallback = '') {
  for (const key of keys) {
    if (object?.[key] !== undefined && object?.[key] !== null && object?.[key] !== '') return object[key];
  }
  return fallback;
}

export function rolePath(role) {
  const normalized = String(role || '').toLocaleLowerCase('es');
  if (normalized === 'protagonista') return '/mi-negocio';
  if (normalized === 'admin' || normalized === 'administrador') return '/administracion';
  return '/catalogo';
}

export function currency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Consultar precio';
  return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO', maximumFractionDigits: 2 }).format(number);
}

export function formatDate(value) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium' }).format(date);
}

export function phoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}
