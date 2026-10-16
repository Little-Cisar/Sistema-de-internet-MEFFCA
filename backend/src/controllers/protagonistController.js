const { sql, getPool } = require('../config/database');

const PUBLIC_PROTAGONIST_COLUMNS = `
  SELECT
    p.id_protagonista,
    p.nombre_negocio,
    p.telefono_whatsapp,
    p.departamento,
    p.descripcion_negocio,
    p.estado_verificacion,
    (SELECT COUNT_BIG(1)
       FROM dbo.PRODUCTOS AS prd
      WHERE prd.id_protagonista = p.id_protagonista
        AND prd.estado = N'Activo') AS total_productos
  FROM dbo.PROTAGONISTAS AS p
  INNER JOIN dbo.USUARIOS AS u ON u.id_usuario = p.id_usuario
`;

async function listPublicProtagonists(_req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      ${PUBLIC_PROTAGONIST_COLUMNS}
      WHERE p.estado_verificacion = 1
        AND u.rol = N'Protagonista'
      ORDER BY p.nombre_negocio ASC, p.id_protagonista ASC;
    `);
    return res.status(200).json({ protagonistas: result.recordset, total: result.recordset.length });
  } catch (error) {
    return next(error);
  }
}

async function getPublicProtagonist(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id_protagonista', sql.Int, Number(req.params.id))
      .query(`
        ${PUBLIC_PROTAGONIST_COLUMNS}
        WHERE p.id_protagonista = @id_protagonista
          AND p.estado_verificacion = 1
          AND u.rol = N'Protagonista';
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ mensaje: 'No se encontró un perfil público verificado.' });
    }
    return res.status(200).json({ protagonista: result.recordset[0] });
  } catch (error) {
    return next(error);
  }
}

async function getMyProtagonist(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id_usuario', sql.Int, req.auth.id_usuario)
      .query(`
        SELECT
          p.id_protagonista,
          p.id_usuario,
          u.email,
          p.nombre_negocio,
          p.telefono_whatsapp,
          p.departamento,
          p.descripcion_negocio,
          p.estado_verificacion
        FROM dbo.PROTAGONISTAS AS p
        INNER JOIN dbo.USUARIOS AS u ON u.id_usuario = p.id_usuario
        WHERE p.id_usuario = @id_usuario
          AND u.rol = N'Protagonista';
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ mensaje: 'La cuenta no tiene un perfil de protagonista asociado.' });
    }
    return res.status(200).json({ protagonista: result.recordset[0] });
  } catch (error) {
    return next(error);
  }
}

async function updateProtagonist(req, res, next) {
  const nombre = String(req.body.nombre_negocio || '').trim();
  const telefono = String(req.body.telefono_whatsapp || '').trim();
  const departamento = String(req.body.departamento || '').trim();
  const descripcion = req.body.descripcion_negocio == null || String(req.body.descripcion_negocio).trim() === ''
    ? null
    : String(req.body.descripcion_negocio).trim();

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id_protagonista', sql.Int, Number(req.params.id))
      .input('id_usuario', sql.Int, req.auth.id_usuario)
      .input('nombre_negocio', sql.NVarChar(100), nombre)
      .input('telefono_whatsapp', sql.NVarChar(20), telefono)
      .input('departamento', sql.NVarChar(50), departamento)
      .input('descripcion_negocio', sql.NVarChar(sql.MAX), descripcion)
      .query(`
        UPDATE p
           SET nombre_negocio = @nombre_negocio,
               telefono_whatsapp = @telefono_whatsapp,
               departamento = @departamento,
               descripcion_negocio = @descripcion_negocio
        OUTPUT
          INSERTED.id_protagonista,
          INSERTED.id_usuario,
          INSERTED.nombre_negocio,
          INSERTED.telefono_whatsapp,
          INSERTED.departamento,
          INSERTED.descripcion_negocio,
          INSERTED.estado_verificacion
        FROM dbo.PROTAGONISTAS AS p
        INNER JOIN dbo.USUARIOS AS u ON u.id_usuario = p.id_usuario
        WHERE p.id_protagonista = @id_protagonista
          AND p.id_usuario = @id_usuario
          AND u.rol = N'Protagonista';
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ mensaje: 'No se encontró un perfil propio con el identificador indicado.' });
    }
    return res.status(200).json({
      mensaje: 'Perfil del emprendimiento actualizado correctamente.',
      protagonista: result.recordset[0]
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPublicProtagonists,
  getPublicProtagonist,
  getMyProtagonist,
  updateProtagonist
};
