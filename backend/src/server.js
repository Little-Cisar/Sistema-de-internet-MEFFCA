require('dotenv').config();
const app = require('./app');
const { connectToDatabase, closePool } = require('./config/database');

async function startServer() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || secret.startsWith('REEMPLAZAR_')) {
    throw new Error('JWT_SECRET debe ser un secreto aleatorio de al menos 32 caracteres configurado en .env.');
  }

  await connectToDatabase();
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, () => {
    console.log(`API MEFCCA disponible en http://localhost:${port}`);
    console.log(`Comprobación de salud: http://localhost:${port}/api/health`);
  });

  const shutdown = async (signal) => {
    console.log(`\nSe recibió ${signal}. Cerrando el servidor...`);
    server.close(async () => {
      try {
        await closePool();
        process.exit(0);
      } catch (error) {
        console.error('Error al cerrar la conexión SQL:', error.message);
        process.exit(1);
      }
    });
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error('No se pudo iniciar el backend:', error.message);
  process.exit(1);
});
