const { sql, getPool } = require('../config/database');

async function listUsers(_req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id_usuario, email, rol, fecha_creacion
      FROM dbo.USUARIOS
      ORDER BY fecha_creacion DESC, id_usuario DESC;
    `);
    // Deliberadamente no se devuelve password_hash ni otros datos de autenticación.
    return res.status(200).json({ usuarios: result.recordset, total: result.recordset.length });
  } catch (error) {
    return next(error);
  }
}

async function listPendingProtagonists(_req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
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
      WHERE u.rol = N'Protagonista'
        AND p.estado_verificacion = 0
      ORDER BY p.id_protagonista ASC;
    `);
    return res.status(200).json({ protagonistas: result.recordset, total: result.recordset.length });
  } catch (error) {
    return next(error);
  }
}

async function setProtagonistVerification(req, res, next) {
  const estadoVerificacion = req.body.estado_verificacion;
  try {
    const pool = await getPool();
    const updateResult = await pool.request()
      .input('id_protagonista', sql.Int, Number(req.params.id))
      .input('estado_verificacion', sql.Bit, estadoVerificacion)
      .query(`
        UPDATE p
           SET estado_verificacion = @estado_verificacion
        FROM dbo.PROTAGONISTAS AS p
        INNER JOIN dbo.USUARIOS AS u ON u.id_usuario = p.id_usuario
        WHERE p.id_protagonista = @id_protagonista
          AND u.rol = N'Protagonista';
      `);

    if (!updateResult.rowsAffected[0]) {
      return res.status(404).json({ mensaje: 'No se encontró el perfil de protagonista solicitado.' });
    }

    const profileResult = await pool.request()
      .input('id_protagonista', sql.Int, Number(req.params.id))
      .query(`
        SELECT p.id_protagonista, p.id_usuario, u.email, p.nombre_negocio,
               p.telefono_whatsapp, p.departamento, p.descripcion_negocio,
               p.estado_verificacion
        FROM dbo.PROTAGONISTAS AS p
        INNER JOIN dbo.USUARIOS AS u ON u.id_usuario = p.id_usuario
        WHERE p.id_protagonista = @id_protagonista;
      `);

    const profile = profileResult.recordset[0];
    const verified = Boolean(profile.estado_verificacion);
    return res.status(200).json({
      mensaje: verified
        ? 'El perfil del protagonista fue verificado. Ya puede publicar productos.'
        : 'La verificación del perfil quedó pendiente. Sus productos no se mostrarán en el catálogo público.',
      protagonista: profile
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listUsers, listPendingProtagonists, setProtagonistVerification };
