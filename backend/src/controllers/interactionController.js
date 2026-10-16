const { sql, getPool } = require('../config/database');

// Registra el clic de contacto por WhatsApp que actualmente dispara la interfaz.
// El id_usuario nunca se acepta desde el cuerpo: se deriva de un JWT válido o
// se guarda NULL cuando el visitante no está autenticado.
async function recordInteraction(req, res, next) {
  try {
    const productId = Number(req.body.id_producto);
    const userId = req.auth?.id_usuario ?? null;
    const action = req.body.tipo_accion || 'Clic en WhatsApp';
    const pool = await getPool();

    // Solo registra publicaciones visibles en el catálogo público.
    const result = await pool.request()
      .input('id_producto', sql.Int, productId)
      .input('id_usuario', sql.Int, userId)
      .input('tipo_accion', sql.NVarChar(50), action)
      .query(`
        INSERT INTO dbo.INTERACCIONES (id_producto, id_usuario, tipo_accion)
        OUTPUT
          INSERTED.id_interaccion,
          INSERTED.id_producto,
          INSERTED.id_usuario,
          INSERTED.fecha_hora,
          INSERTED.tipo_accion
        SELECT p.id_producto, @id_usuario, @tipo_accion
        FROM dbo.PRODUCTOS AS p
        INNER JOIN dbo.PROTAGONISTAS AS pr ON pr.id_protagonista = p.id_protagonista
        INNER JOIN dbo.USUARIOS AS u ON u.id_usuario = pr.id_usuario
        WHERE p.id_producto = @id_producto
          AND p.estado = N'Activo'
          AND pr.estado_verificacion = 1
          AND u.rol = N'Protagonista';
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ mensaje: 'No se puede registrar la interacción porque el producto no está publicado o no está disponible.' });
    }

    return res.status(201).json({
      mensaje: 'Interacción registrada correctamente.',
      interaccion: result.recordset[0]
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyInteractionSummary(req, res, next) {
  try {
    const pool = await getPool();
    const summaryResult = await pool.request()
      .input('id_usuario', sql.Int, req.auth.id_usuario)
      .query(`
        SELECT
          COUNT_BIG(i.id_interaccion) AS total_interacciones,
          COALESCE(SUM(CASE WHEN i.tipo_accion = N'Clic en WhatsApp' THEN 1 ELSE 0 END), 0) AS clics_whatsapp,
          COALESCE(SUM(CASE WHEN CAST(i.fecha_hora AS date) = CAST(GETDATE() AS date) THEN 1 ELSE 0 END), 0) AS interacciones_hoy,
          COUNT(DISTINCT i.id_producto) AS productos_con_interacciones
        FROM dbo.PROTAGONISTAS AS pr
        LEFT JOIN dbo.PRODUCTOS AS p ON p.id_protagonista = pr.id_protagonista
        LEFT JOIN dbo.INTERACCIONES AS i ON i.id_producto = p.id_producto
        WHERE pr.id_usuario = @id_usuario;
      `);

    const recentResult = await pool.request()
      .input('id_usuario', sql.Int, req.auth.id_usuario)
      .query(`
        SELECT TOP (10)
          i.id_interaccion,
          i.id_producto,
          p.nombre_producto,
          i.tipo_accion,
          i.fecha_hora,
          i.id_usuario,
          CASE WHEN i.id_usuario IS NULL THEN N'Visitante' ELSE N'Usuario registrado' END AS tipo_usuario
        FROM dbo.INTERACCIONES AS i
        INNER JOIN dbo.PRODUCTOS AS p ON p.id_producto = i.id_producto
        INNER JOIN dbo.PROTAGONISTAS AS pr ON pr.id_protagonista = p.id_protagonista
        WHERE pr.id_usuario = @id_usuario
        ORDER BY i.fecha_hora DESC, i.id_interaccion DESC;
      `);

    const raw = summaryResult.recordset[0] || {};
    return res.status(200).json({
      resumen: {
        total_interacciones: Number(raw.total_interacciones || 0),
        clics_whatsapp: Number(raw.clics_whatsapp || 0),
        interacciones_hoy: Number(raw.interacciones_hoy || 0),
        productos_con_interacciones: Number(raw.productos_con_interacciones || 0)
      },
      interacciones: recentResult.recordset
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { recordInteraction, getMyInteractionSummary };
