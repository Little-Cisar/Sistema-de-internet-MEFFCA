const sql = require('mssql');

let poolPromise;

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'si', 'sí'].includes(String(value).toLowerCase());
}

function createDatabaseConfig() {
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  if (!user || !password || password === 'CAMBIAR_POR_LA_CLAVE_DEL_LOGIN_SQL') {
    throw new Error('Configura DB_USER y DB_PASSWORD en el archivo .env.');
  }

  const options = {
    encrypt: parseBoolean(process.env.DB_ENCRYPT, false),
    trustServerCertificate: parseBoolean(process.env.DB_TRUST_SERVER_CERTIFICATE, true)
  };
  if (process.env.DB_INSTANCE && process.env.DB_INSTANCE.trim()) {
    options.instanceName = process.env.DB_INSTANCE.trim();
  }

  const config = {
    user,
    password,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'MEFCCA_DB',
    options,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    connectionTimeout: 15000,
    requestTimeout: 15000
  };

  // No se establece puerto si se usa una instancia con nombre (por ejemplo SQLEXPRESS).
  if (!options.instanceName) config.port = Number(process.env.DB_PORT || 1433);
  return config;
}

async function getPool() {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(createDatabaseConfig());
    poolPromise = pool.connect().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }
  return poolPromise;
}

async function connectToDatabase() {
  const pool = await getPool();
  await pool.request().query('SELECT 1 AS conexion_correcta;');
  console.log(`Conexión a SQL Server establecida: ${process.env.DB_NAME || 'MEFCCA_DB'}`);
  return pool;
}

async function closePool() {
  if (!poolPromise) return;
  try {
    const pool = await poolPromise;
    await pool.close();
  } finally {
    poolPromise = null;
  }
}

module.exports = { sql, getPool, connectToDatabase, closePool };
