const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../config/database');

const ROLES_PUBLICOS = new Set(['Cliente', 'Protagonista']);

function createToken(user) {
  const secret = process.env.JWT_SECRET;
  return jwt.sign(
    { rol: user.rol },
    secret,
    { subject: String(user.id_usuario), expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
}

function publicUser(user) {
  return {
    id_usuario: user.id_usuario,
    email: user.email,
    rol: user.rol,
    fecha_creacion: user.fecha_creacion
  };
}

async function register(req, res, next) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const rol = req.body.rol || 'Cliente';

  // bcrypt solo procesa hasta 72 bytes de contraseña; evitar truncamiento silencioso.
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ mensaje: 'La contraseña no puede superar 72 bytes en UTF-8.' });
  }
  // Nunca se permite crear una cuenta ADMIN mediante el registro público.
  if (!ROLES_PUBLICOS.has(rol)) {
    return res.status(400).json({ mensaje: 'El rol público debe ser Cliente o Protagonista.' });
  }

  const esProtagonista = rol === 'Protagonista';
  if (esProtagonista && (!req.body.nombre_negocio || !req.body.telefono_whatsapp || !req.body.departamento)) {
    return res.status(400).json({ mensaje: 'Para registrar un protagonista se requiere nombre_negocio, telefono_whatsapp y departamento.' });
  }

  let transaction;
  try {
    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12));
    const insertUser = await new sql.Request(transaction)
      .input('email', sql.NVarChar(254), email)
      .input('password_hash', sql.NVarChar(255), hash)
      .input('rol', sql.NVarChar(20), rol)
      .query(`
        INSERT INTO dbo.USUARIOS (email, password_hash, rol)
        OUTPUT INSERTED.id_usuario, INSERTED.email, INSERTED.rol, INSERTED.fecha_creacion
        VALUES (@email, @password_hash, @rol);
      `);

    const user = insertUser.recordset[0];
    let protagonista = null;

    if (esProtagonista) {
      const insertProtagonist = await new sql.Request(transaction)
        .input('id_usuario', sql.Int, user.id_usuario)
        .input('nombre_negocio', sql.NVarChar(100), String(req.body.nombre_negocio).trim())
        .input('telefono_whatsapp', sql.NVarChar(20), String(req.body.telefono_whatsapp).trim())
        .input('departamento', sql.NVarChar(50), String(req.body.departamento).trim())
        .input('descripcion_negocio', sql.NVarChar(sql.MAX), req.body.descripcion_negocio ? String(req.body.descripcion_negocio).trim() : null)
        .query(`
          INSERT INTO dbo.PROTAGONISTAS
            (id_usuario, nombre_negocio, telefono_whatsapp, departamento, descripcion_negocio)
          OUTPUT INSERTED.id_protagonista, INSERTED.nombre_negocio, INSERTED.estado_verificacion
          VALUES (@id_usuario, @nombre_negocio, @telefono_whatsapp, @departamento, @descripcion_negocio);
        `);
      protagonista = insertProtagonist.recordset[0];
    }

    await transaction.commit();
    return res.status(201).json({
      mensaje: esProtagonista
        ? 'Cuenta creada. El perfil de protagonista queda pendiente de verificación institucional.'
        : 'Cuenta creada correctamente. Ya puede iniciar sesión.',
      usuario: publicUser(user),
      ...(protagonista ? { protagonista } : {})
    });
  } catch (error) {
    if (transaction) {
      try { await transaction.rollback(); } catch (_rollbackError) { /* La transacción pudo cerrarse ya. */ }
    }
    // En SQL Server, 2627/2601 identifican duplicados de restricciones únicas/índices únicos.
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese correo electrónico.' });
    }
    return next(error);
  }
}

async function login(req, res, next) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(254), email)
      .query(`
        SELECT id_usuario, email, password_hash, rol, fecha_creacion
        FROM dbo.USUARIOS
        WHERE email = @email;
      `);

    const user = result.recordset[0];
    // El mismo mensaje evita revelar si un correo está registrado.
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ mensaje: 'Correo electrónico o contraseña incorrectos.' });
    }

    return res.status(200).json({
      mensaje: 'Inicio de sesión correcto.',
      token: createToken(user),
      tipo_token: 'Bearer',
      expira_en: process.env.JWT_EXPIRES_IN || '2h',
      usuario: publicUser(user)
    });
  } catch (error) {
    return next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id_usuario', sql.Int, req.auth.id_usuario)
      .query(`
        SELECT
          u.id_usuario,
          u.email,
          u.rol,
          u.fecha_creacion,
          p.id_protagonista,
          p.nombre_negocio,
          p.telefono_whatsapp,
          p.departamento,
          p.descripcion_negocio,
          p.estado_verificacion
        FROM dbo.USUARIOS AS u
        LEFT JOIN dbo.PROTAGONISTAS AS p ON p.id_usuario = u.id_usuario
        WHERE u.id_usuario = @id_usuario;
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ mensaje: 'No se encontró la cuenta asociada al token.' });
    }
    return res.status(200).json({ usuario: result.recordset[0] });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, getProfile };
