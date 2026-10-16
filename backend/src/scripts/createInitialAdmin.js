require('dotenv').config();
const bcrypt = require('bcrypt');
const { sql, getPool, closePool } = require('../config/database');

async function main() {
  const email = String(process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.INITIAL_ADMIN_PASSWORD || '');

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Configure temporalmente INITIAL_ADMIN_EMAIL con un correo válido en .env.');
  }
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('INITIAL_ADMIN_PASSWORD debe tener entre 12 y 72 bytes para esta configuración inicial.');
  }

  const pool = await getPool();
  const existing = await pool.request()
    .input('email', sql.NVarChar(254), email)
    .query('SELECT id_usuario, rol FROM dbo.USUARIOS WHERE email = @email;');

  if (existing.recordset.length) {
    if (existing.recordset[0].rol === 'Admin') {
      console.log('La cuenta administradora indicada ya existe. No se realizó ningún cambio.');
      return;
    }
    throw new Error('El correo ya pertenece a otra cuenta. No se modificó su rol automáticamente. Utilice un correo nuevo para el administrador inicial.');
  }

  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12));
  const created = await pool.request()
    .input('email', sql.NVarChar(254), email)
    .input('password_hash', sql.NVarChar(255), passwordHash)
    .input('rol', sql.NVarChar(20), 'Admin')
    .query(`
      INSERT INTO dbo.USUARIOS (email, password_hash, rol)
      OUTPUT INSERTED.id_usuario, INSERTED.email, INSERTED.rol
      VALUES (@email, @password_hash, @rol);
    `);

  console.log('Cuenta administradora inicial creada:');
  console.log(`  ID: ${created.recordset[0].id_usuario}`);
  console.log(`  Correo: ${created.recordset[0].email}`);
  console.log('No se muestra ni se almacena en texto plano la contraseña. Retire INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD del .env después de este proceso.');
}

main()
  .catch((error) => {
    console.error('No se pudo crear el administrador inicial:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await closePool(); } catch (error) { console.error('No se pudo cerrar la conexión SQL:', error.message); }
  });
