const { getPool } = require('../config/database');

async function getInteractionReport(_req, res, next) {
  try {
    const pool = await getPool();
    const summaryResult = await pool.request().query(`
      SELECT
        COUNT_BIG(1) AS total_interacciones,
        COALESCE(SUM(CASE WHEN tipo_accion = N'Clic en WhatsApp' THEN 1 ELSE 0 END), 0) AS clics_whatsapp,
        COALESCE(SUM(CASE WHEN CAST(fecha_hora AS date) = CAST(GETDATE() AS date) THEN 1 ELSE 0 END), 0) AS interacciones_hoy,
        COUNT(DISTINCT id_producto) AS productos_con_interacciones
      FROM dbo.INTERACCIONES;
    `);

    const topProductsResult = await pool.request().query(`
      SELECT TOP (5)
        p.id_producto,
        p.nombre_producto,
        COUNT_BIG(i.id_interaccion) AS total_interacciones,
        COALESCE(SUM(CASE WHEN i.tipo_accion = N'Clic en WhatsApp' THEN 1 ELSE 0 END), 0) AS clics_whatsapp
      FROM dbo.INTERACCIONES AS i
      INNER JOIN dbo.PRODUCTOS AS p ON p.id_producto = i.id_producto
      GROUP BY p.id_producto, p.nombre_producto
      ORDER BY COUNT_BIG(i.id_interaccion) DESC, p.nombre_producto ASC;
    `);

    const interactionsResult = await pool.request().query(`
      SELECT TOP (200)
        i.id_interaccion,
        i.id_producto,
        p.nombre_producto,
        c.nombre_categoria,
        pr.nombre_negocio,
        i.tipo_accion,
        i.fecha_hora,
        i.id_usuario,
        COALESCE(u.email, N'Visitante') AS email
      FROM dbo.INTERACCIONES AS i
      INNER JOIN dbo.PRODUCTOS AS p ON p.id_producto = i.id_producto
      INNER JOIN dbo.PROTAGONISTAS AS pr ON pr.id_protagonista = p.id_protagonista
      INNER JOIN dbo.CATEGORIAS AS c ON c.id_categoria = p.id_categoria
      LEFT JOIN dbo.USUARIOS AS u ON u.id_usuario = i.id_usuario
      ORDER BY i.fecha_hora DESC, i.id_interaccion DESC;
    `);

    const rawSummary = summaryResult.recordset[0] || {};
    const resumen = {
      total_interacciones: Number(rawSummary.total_interacciones || 0),
      clics_whatsapp: Number(rawSummary.clics_whatsapp || 0),
      interacciones_hoy: Number(rawSummary.interacciones_hoy || 0),
      productos_con_interacciones: Number(rawSummary.productos_con_interacciones || 0)
    };
    const productosMasContactados = topProductsResult.recordset.map((row) => ({
      ...row,
      total_interacciones: Number(row.total_interacciones || 0),
      clics_whatsapp: Number(row.clics_whatsapp || 0)
    }));

    return res.status(200).json({
      reporte: {
        resumen,
        productos_mas_contactados: productosMasContactados,
        interacciones: interactionsResult.recordset
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getInteractionReport };

async function getSalesReport(_req, res, next) {
  try {
    const pool = await getPool();
    const summaryResult = await pool.request().query(`
      SELECT
        COUNT_BIG(1) AS total_operaciones,
        COALESCE(SUM(CASE WHEN estado = N'Registrada' THEN 1 ELSE 0 END), 0) AS ventas_registradas,
        COALESCE(SUM(CASE WHEN estado = N'Anulada' THEN 1 ELSE 0 END), 0) AS ventas_anuladas,
        CONVERT(DECIMAL(18,2), COALESCE(SUM(CASE WHEN estado = N'Registrada' THEN total ELSE 0 END), 0)) AS importe_registrado,
        COALESCE(SUM(CASE WHEN estado = N'Registrada' AND CAST(fecha_venta AS date) = CAST(GETDATE() AS date) THEN 1 ELSE 0 END), 0) AS ventas_hoy
      FROM dbo.vw_ventas_con_total;
    `);

    const topProductsResult = await pool.request().query(`
      SELECT TOP (5)
        d.id_producto,
        d.nombre_producto,
        SUM(d.cantidad) AS unidades_vendidas,
        COUNT(DISTINCT v.id_venta) AS operaciones,
        CONVERT(DECIMAL(18,2), SUM(d.subtotal)) AS importe_registrado
      FROM dbo.VENTAS AS v
      INNER JOIN dbo.DETALLE_VENTA AS d ON d.id_venta = v.id_venta
      WHERE v.estado = N'Registrada'
      GROUP BY d.id_producto, d.nombre_producto
      ORDER BY SUM(d.cantidad) DESC, SUM(d.subtotal) DESC, d.nombre_producto ASC;
    `);

    return res.status(200).json({
      resumen: summaryResult.recordset[0] || {},
      productos_mas_vendidos: topProductsResult.recordset
    });
  } catch (error) {
    return next(error);
  }
}

module.exports.getSalesReport = getSalesReport;
