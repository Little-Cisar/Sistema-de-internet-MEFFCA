const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { getPool } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const protagonistRoutes = require('./routes/protagonistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const salesRoutes = require('./routes/salesRoutes');

const app = express();
app.disable('x-powered-by');
app.use(helmet());

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    // Permitir solicitudes sin Origin (p. ej., Postman/curl); el navegador sí valida CORS.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origen no permitido por la política CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({ nombre: 'API MEFCCA', estado: 'activa', version: '1.4.0' });
});

app.get('/api/health', async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok;');
    return res.status(200).json({ api: 'ok', base_de_datos: 'conectada' });
  } catch (_error) {
    return res.status(503).json({ api: 'ok', base_de_datos: 'no disponible' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/protagonistas', protagonistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/interacciones', interactionRoutes);
app.use('/api/reportes', reportRoutes);
app.use('/api/ventas', salesRoutes);

app.use((_req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));

// Manejo centralizado: evita enviar rutas, contraseñas o trazas al cliente.
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && Object.prototype.hasOwnProperty.call(error, 'body')) {
    return res.status(400).json({ mensaje: 'El cuerpo JSON no tiene un formato válido.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ mensaje: 'El cuerpo de la solicitud supera el tamaño permitido.' });
  }
  if (error.message === 'Origen no permitido por la política CORS.') {
    return res.status(403).json({ mensaje: error.message });
  }
  console.error('Error del servidor:', error.message);
  return res.status(500).json({ mensaje: 'Ocurrió un error interno. Revise la consola del backend.' });
});

module.exports = app;
