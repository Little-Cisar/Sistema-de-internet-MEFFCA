const { sql, getPool } = require('../config/database');

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getSeller(transaction, userId) {
  const result = await new sql.Request(transaction)
    .input('id_usuario', sql.Int, userId)
    .query(`
      SELECT TOP (1)
        p.id_protagonista,
        p.id_usuario,
        p.estado_verificacion
      FROM dbo.PROTAGONISTAS AS p WITH (UPDLOCK, HOLDLOCK)
      INNER JOIN dbo.USUARIOS AS u ON u.id_usuario = p.id_usuario
      WHERE p.id_usuario = @id_usuario
        AND u.rol = N'Protagonista';
    `);
  return result.recordset[0] || null;
}

function normaliseDetails(details) {
  const grouped = new Map();
  for (const item of details) {
    const id = Number(item.id_producto);
    const quantity = Number(item.cantidad);
    grouped.set(id, (grouped.get(id) || 0) + quantity);
  }
  return [...grouped.entries()].map(([id_producto, cantidad]) => ({ id_producto, cantidad })).sort((a, b) => a.id_producto - b.id_producto);
}

function saleHeaderSelect(whereClause) {
  return `
    SELECT TOP (200)
      v.id_venta,
      v.id_vendedor,
      v.id_comprador_usuario,
      v.fecha_venta,
      v.estado,
      v.metodo_pago,
      v.metodo_entrega,
      v.observaciones,
      v.total,
      p.nombre_negocio,
      comprador.email AS correo_comprador,
      (SELECT COUNT_BIG(1) FROM dbo.DETALLE_VENTA AS d WHERE d.id_venta = v.id_venta) AS lineas,
      (SELECT COALESCE(SUM(d.cantidad), 0) FROM dbo.DETALLE_VENTA AS d WHERE d.id_venta = v.id_venta) AS unidades
    FROM dbo.vw_ventas_con_total AS v
    INNER JOIN dbo.PROTAGONISTAS AS p ON p.id_protagonista = v.id_vendedor
    LEFT JOIN dbo.USUARIOS AS comprador ON comprador.id_usuario = v.id_comprador_usuario
    ${whereClause}
    ORDER BY v.fecha_venta DESC, v.id_venta DESC;
  `;
}

async function createSale(req, res, next) {
  const details = normaliseDetails(req.body.detalles || []);
  const buyerEmail = String(req.body.comprador_email || '').trim().toLowerCase() || null;
  let transaction;
  let transactionStarted = false;

  try {
    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    transactionStarted = true;

    const seller = await getSeller(transaction, req.auth.id_usuario);
    if (!seller) throw httpError(403, 'La cuenta no tiene un perfil de protagonista asociado.');
    if (!seller.estado_verificacion) {
      throw httpError(403, 'El perfil de protagonista debe estar verificado antes de registrar ventas.');
    }

    let buyerId = null;
    if (buyerEmail) {
      const buyerResult = await new sql.Request(transaction)
        .input('email', sql.NVarChar(254), buyerEmail)
        .input('id_vendedor_usuario', sql.Int, req.auth.id_usuario)
        .query(`
          SELECT TOP (1) id_usuario, email, rol
          FROM dbo.USUARIOS WITH (UPDLOCK, HOLDLOCK)
          WHERE LOWER(email) = LOWER(@email)
            AND rol IN (N'Cliente', N'Protagonista')
            AND id_usuario <> @id_vendedor_usuario;
        `);
      if (!buyerResult.recordset.length) {
        throw httpError(400, 'El correo del comprador no corresponde a una cuenta Cliente o Protagonista distinta del vendedor. Déjalo vacío si la venta no se vinculará a una cuenta.');
      }
      buyerId = buyerResult.recordset[0].id_usuario;
    }

    const insertSale = await new sql.Request(transaction)
      .input('id_vendedor', sql.Int, seller.id_protagonista)
      .input('id_comprador_usuario', sql.Int, buyerId)
      .input('metodo_pago', sql.NVarChar(50), String(req.body.metodo_pago || '').trim() || null)
      .input('metodo_entrega', sql.NVarChar(50), String(req.body.metodo_entrega || '').trim() || null)
      .input('observaciones', sql.NVarChar(500), String(req.body.observaciones || '').trim() || null)
      .query(`
        INSERT INTO dbo.VENTAS
          (id_vendedor, id_comprador_usuario, estado, metodo_pago, metodo_entrega, observaciones)
        OUTPUT INSERTED.id_venta, INSERTED.fecha_venta, INSERTED.estado
        VALUES
          (@id_vendedor, @id_comprador_usuario, N'Registrada', @metodo_pago, @metodo_entrega, @observaciones);
      `);
    const saleId = insertSale.recordset[0].id_venta;
    const responseDetails = [];

    for (const item of details) {
      const productResult = await new sql.Request(transaction)
        .input('id_producto', sql.Int, item.id_producto)
        .input('id_protagonista', sql.Int, seller.id_protagonista)
        .query(`
          SELECT p.id_producto, p.nombre_producto, p.precio, p.stock_actual, p.estado
          FROM dbo.PRODUCTOS AS p WITH (UPDLOCK, HOLDLOCK)
          WHERE p.id_producto = @id_producto
            AND p.id_protagonista = @id_protagonista;
        `);
      const product = productResult.recordset[0];
      if (!product) {
        throw httpError(400, `El producto ${item.id_producto} no existe o no pertenece a este emprendimiento.`);
      }
      if (product.estado !== 'Activo') {
        throw httpError(409, `El producto «${product.nombre_producto}» está inactivo y no se puede vender.`);
      }
      if (Number(product.stock_actual) < item.cantidad) {
        throw httpError(409, `Existencias insuficientes para «${product.nombre_producto}». Disponibles: ${product.stock_actual}; solicitadas: ${item.cantidad}.`);
      }

      const updateStock = await new sql.Request(transaction)
        .input('id_producto', sql.Int, item.id_producto)
        .input('cantidad', sql.Int, item.cantidad)
        .query(`
          UPDATE dbo.PRODUCTOS
             SET stock_actual = stock_actual - @cantidad
           WHERE id_producto = @id_producto
             AND stock_actual >= @cantidad
             AND estado = N'Activo';
        `);
      if (updateStock.rowsAffected[0] !== 1) {
        throw httpError(409, `No fue posible reservar las existencias de «${product.nombre_producto}». Actualiza el catálogo e inténtalo otra vez.`);
      }

      const insertDetail = await new sql.Request(transaction)
        .input('id_venta', sql.Int, saleId)
        .input('id_producto', sql.Int, item.id_producto)
        .input('nombre_producto', sql.NVarChar(150), product.nombre_producto)
        .input('cantidad', sql.Int, item.cantidad)
        .input('precio_unitario', sql.Decimal(10, 2), product.precio)
        .query(`
          INSERT INTO dbo.DETALLE_VENTA
            (id_venta, id_producto, nombre_producto, cantidad, precio_unitario)
          OUTPUT INSERTED.id_detalle_venta, INSERTED.id_producto, INSERTED.nombre_producto,
                 INSERTED.cantidad, INSERTED.precio_unitario, INSERTED.subtotal
          VALUES (@id_venta, @id_producto, @nombre_producto, @cantidad, @precio_unitario);
        `);
      responseDetails.push(insertDetail.recordset[0]);
    }

    const totalResult = await new sql.Request(transaction)
      .input('id_venta', sql.Int, saleId)
      .query('SELECT CONVERT(DECIMAL(18,2), COALESCE(SUM(subtotal), 0)) AS total FROM dbo.DETALLE_VENTA WHERE id_venta = @id_venta;');
    const total = Number(totalResult.recordset[0]?.total || 0);
    await transaction.commit();
    transactionStarted = false;
    return res.status(201).json({
      mensaje: 'Venta registrada. Las existencias se actualizaron correctamente.',
      venta: {
        id_venta: saleId,
        id_vendedor: seller.id_protagonista,
        id_comprador_usuario: buyerId,
        fecha_venta: insertSale.recordset[0].fecha_venta,
        estado: insertSale.recordset[0].estado,
        metodo_pago: String(req.body.metodo_pago || '').trim() || null,
        metodo_entrega: String(req.body.metodo_entrega || '').trim() || null,
        observaciones: String(req.body.observaciones || '').trim() || null,
        total: Number(total.toFixed(2)),
        detalles: responseDetails
      }
    });
  } catch (error) {
    if (transactionStarted && transaction) {
      try { await transaction.rollback(); } catch (_rollbackError) { /* Se conserva el error original. */ }
    }
    if (error.status) return res.status(error.status).json({ mensaje: error.message });
    return next(error);
  }
}

async function listMySales(req, res, next) {
  try {
    const pool = await getPool();
    const sellerResult = await pool.request()
      .input('id_usuario', sql.Int, req.auth.id_usuario)
      .query(`SELECT id_protagonista FROM dbo.PROTAGONISTAS WHERE id_usuario = @id_usuario;`);
    if (!sellerResult.recordset.length) return res.status(404).json({ mensaje: 'La cuenta no tiene un perfil de protagonista asociado.' });

    const result = await pool.request()
      .input('id_vendedor', sql.Int, sellerResult.recordset[0].id_protagonista)
      .query(saleHeaderSelect('WHERE v.id_vendedor = @id_vendedor'));
    return res.status(200).json({ ventas: result.recordset, total: result.recordset.length, limite: 200 });
  } catch (error) { return next(error); }
}

async function listMyPurchases(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id_comprador_usuario', sql.Int, req.auth.id_usuario)
      .query(saleHeaderSelect('WHERE v.id_comprador_usuario = @id_comprador_usuario'));
    return res.status(200).json({ compras: result.recordset, total: result.recordset.length, limite: 200 });
  } catch (error) { return next(error); }
}

async function listAllSales(_req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(saleHeaderSelect(''));
    return res.status(200).json({ ventas: result.recordset, total: result.recordset.length, limite: 200 });
  } catch (error) { return next(error); }
}

async function getSaleDetails(req, res, next) {
  try {
    const pool = await getPool();
    const headerResult = await pool.request()
      .input('id_venta', sql.Int, Number(req.params.id))
      .query(`
        SELECT
          v.id_venta, v.id_vendedor, v.id_comprador_usuario, v.fecha_venta, v.estado,
          v.metodo_pago, v.metodo_entrega, v.observaciones, v.total,
          seller.id_usuario AS id_usuario_vendedor,
          seller.nombre_negocio,
          buyer.email AS correo_comprador
        FROM dbo.vw_ventas_con_total AS v
        INNER JOIN dbo.PROTAGONISTAS AS seller ON seller.id_protagonista = v.id_vendedor
        LEFT JOIN dbo.USUARIOS AS buyer ON buyer.id_usuario = v.id_comprador_usuario
        WHERE v.id_venta = @id_venta;
      `);
    const sale = headerResult.recordset[0];
    if (!sale) return res.status(404).json({ mensaje: 'No se encontró la operación solicitada.' });

    const isAdmin = req.auth.rol === 'Admin';
    const isSeller = Number(sale.id_usuario_vendedor) === req.auth.id_usuario;
    const isBuyer = Number(sale.id_comprador_usuario) === req.auth.id_usuario;
    if (!isAdmin && !isSeller && !isBuyer) {
      return res.status(404).json({ mensaje: 'No se encontró la operación solicitada.' });
    }

    const detailResult = await pool.request()
      .input('id_venta', sql.Int, Number(req.params.id))
      .query(`
        SELECT id_detalle_venta, id_producto, nombre_producto,
               cantidad, precio_unitario, subtotal
        FROM dbo.DETALLE_VENTA
        WHERE id_venta = @id_venta
        ORDER BY id_detalle_venta ASC;
      `);
    return res.status(200).json({ venta: sale, detalles: detailResult.recordset });
  } catch (error) { return next(error); }
}

async function cancelSale(req, res, next) {
  let transaction;
  let transactionStarted = false;
  try {
    const pool = await getPool();
    transaction = new sql.Transaction(pool);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    transactionStarted = true;

    const headerResult = await new sql.Request(transaction)
      .input('id_venta', sql.Int, Number(req.params.id))
      .query(`
        SELECT v.id_venta, v.id_vendedor, v.estado, p.id_usuario AS id_usuario_vendedor
        FROM dbo.VENTAS AS v WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.PROTAGONISTAS AS p ON p.id_protagonista = v.id_vendedor
        WHERE v.id_venta = @id_venta;
      `);
    const sale = headerResult.recordset[0];
    if (!sale) throw httpError(404, 'No se encontró la venta solicitada.');
    if (req.auth.rol !== 'Admin' && Number(sale.id_usuario_vendedor) !== req.auth.id_usuario) {
      throw httpError(404, 'No se encontró la venta solicitada.');
    }
    if (sale.estado === 'Anulada') throw httpError(409, 'Esta venta ya fue anulada y las existencias ya fueron restauradas.');

    const detailResult = await new sql.Request(transaction)
      .input('id_venta', sql.Int, Number(req.params.id))
      .query('SELECT id_producto, cantidad FROM dbo.DETALLE_VENTA WHERE id_venta = @id_venta;');

    const updateSale = await new sql.Request(transaction)
      .input('id_venta', sql.Int, Number(req.params.id))
      .query(`
        UPDATE dbo.VENTAS
           SET estado = N'Anulada'
         WHERE id_venta = @id_venta AND estado = N'Registrada';
      `);
    if (updateSale.rowsAffected[0] !== 1) throw httpError(409, 'La venta cambió de estado. Actualiza el historial e inténtalo nuevamente.');

    for (const item of detailResult.recordset) {
      const restoreResult = await new sql.Request(transaction)
        .input('id_producto', sql.Int, item.id_producto)
        .input('cantidad', sql.Int, item.cantidad)
        .query(`
          UPDATE dbo.PRODUCTOS
             SET stock_actual = stock_actual + @cantidad
           WHERE id_producto = @id_producto
             AND stock_actual <= 2147483647 - @cantidad;
        `);
      if (restoreResult.rowsAffected[0] !== 1) {
        throw httpError(409, 'No se pudo restaurar el inventario sin superar el límite permitido. La anulación fue revertida; revisa el stock del producto.');
      }
    }

    await transaction.commit();
    transactionStarted = false;
    return res.status(200).json({ mensaje: 'Venta anulada y existencias restauradas correctamente.', id_venta: sale.id_venta, estado: 'Anulada' });
  } catch (error) {
    if (transactionStarted && transaction) {
      try { await transaction.rollback(); } catch (_rollbackError) { /* Se conserva el error original. */ }
    }
    if (error.status) return res.status(error.status).json({ mensaje: error.message });
    return next(error);
  }
}

module.exports = { createSale, listMySales, listMyPurchases, listAllSales, getSaleDetails, cancelSale };
