const { sql, getPool } = require('../config/database');

const PRODUCT_FROM = `
  FROM dbo.PRODUCTOS AS p
  INNER JOIN dbo.CATEGORIAS AS c ON c.id_categoria = p.id_categoria
  INNER JOIN dbo.PROTAGONISTAS AS pr ON pr.id_protagonista = p.id_protagonista
  INNER JOIN dbo.USUARIOS AS u ON u.id_usuario = pr.id_usuario
`;

const PRODUCT_COLUMNS = `
  SELECT
    p.id_producto,
    p.id_protagonista,
    p.id_categoria,
    p.nombre_producto,
    p.descripcion,
    p.precio,
    p.imagen,
    p.estado,
    p.stock_actual,
    p.fecha_creacion,
    c.nombre_categoria,
    pr.nombre_negocio,
    pr.telefono_whatsapp,
    pr.departamento,
    pr.estado_verificacion
`;

const SORT_OPTIONS = {
  recientes: 'p.fecha_creacion DESC, p.id_producto DESC',
  precio_asc: 'p.precio ASC, p.id_producto DESC',
  precio_desc: 'p.precio DESC, p.id_producto DESC',
  nombre_asc: 'p.nombre_producto ASC, p.id_producto DESC'
};

function publicProductWhere(request, filters) {
  const clauses = [
    "p.estado = N'Activo'",
    'pr.estado_verificacion = 1',
    "u.rol = N'Protagonista'"
  ];

  const term = String(filters.q || '').trim();
  if (term) {
    request.input('q', sql.NVarChar(102), `%${term}%`);
    clauses.push(`(
      p.nombre_producto LIKE @q OR
      ISNULL(p.descripcion, N'') LIKE @q OR
      c.nombre_categoria LIKE @q OR
      pr.nombre_negocio LIKE @q
    )`);
  }

  if (filters.id_categoria !== undefined && filters.id_categoria !== '') {
    request.input('id_categoria', sql.Int, Number(filters.id_categoria));
    clauses.push('p.id_categoria = @id_categoria');
  }
  if (filters.id_protagonista !== undefined && filters.id_protagonista !== '') {
    request.input('id_protagonista', sql.Int, Number(filters.id_protagonista));
    clauses.push('p.id_protagonista = @id_protagonista');
  }
  if (filters.min_precio !== undefined && filters.min_precio !== '') {
    request.input('min_precio', sql.Decimal(10, 2), Number(filters.min_precio));
    clauses.push('p.precio >= @min_precio');
  }
  if (filters.max_precio !== undefined && filters.max_precio !== '') {
    request.input('max_precio', sql.Decimal(10, 2), Number(filters.max_precio));
    clauses.push('p.precio <= @max_precio');
  }

  return clauses.join(' AND ');
}

async function findProductById(pool, idProducto, { publicOnly = false } = {}) {
  const request = pool.request().input('id_producto', sql.Int, Number(idProducto));
  let extraWhere = 'p.id_producto = @id_producto';
  if (publicOnly) {
    extraWhere += " AND p.estado = N'Activo' AND pr.estado_verificacion = 1 AND u.rol = N'Protagonista'";
  }
  const result = await request.query(`${PRODUCT_COLUMNS} ${PRODUCT_FROM} WHERE ${extraWhere};`);
  return result.recordset[0] || null;
}

async function listProducts(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 100);
    const minPrice = req.query.min_precio;
    const maxPrice = req.query.max_precio;

    if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
      return res.status(400).json({ mensaje: 'min_precio no puede ser mayor que max_precio.' });
    }

    const pool = await getPool();
    const countRequest = pool.request();
    const whereCount = publicProductWhere(countRequest, req.query);
    const countResult = await countRequest.query(`
      SELECT COUNT_BIG(1) AS total
      ${PRODUCT_FROM}
      WHERE ${whereCount};
    `);
    const total = Number(countResult.recordset[0]?.total || 0);

    const listRequest = pool.request();
    const whereList = publicProductWhere(listRequest, req.query);
    listRequest.input('offset', sql.Int, (page - 1) * limit);
    listRequest.input('limit', sql.Int, limit);
    const orderBy = SORT_OPTIONS[req.query.orden || 'recientes'] || SORT_OPTIONS.recientes;
    const listResult = await listRequest.query(`
      ${PRODUCT_COLUMNS}
      ${PRODUCT_FROM}
      WHERE ${whereList}
      ORDER BY ${orderBy}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `);

    return res.status(200).json({
      productos: listResult.recordset,
      paginacion: {
        pagina: page,
        limite: limit,
        total,
        total_paginas: total === 0 ? 0 : Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const pool = await getPool();
    const product = await findProductById(pool, req.params.id, { publicOnly: true });
    if (!product) {
      return res.status(404).json({ mensaje: 'No se encontró un producto activo y publicado disponible para consulta.' });
    }
    return res.status(200).json({ producto: product });
  } catch (error) {
    return next(error);
  }
}

async function getMyProducts(req, res, next) {
  try {
    const pool = await getPool();
    const request = pool.request().input('id_usuario', sql.Int, req.auth.id_usuario);
    const result = await request.query(`
      ${PRODUCT_COLUMNS}
      ${PRODUCT_FROM}
      WHERE pr.id_usuario = @id_usuario
      ORDER BY p.fecha_creacion DESC, p.id_producto DESC;
    `);
    return res.status(200).json({ productos: result.recordset, total: result.recordset.length });
  } catch (error) {
    return next(error);
  }
}

async function getVerifiedProtagonist(pool, idUsuario) {
  const result = await pool.request()
    .input('id_usuario', sql.Int, idUsuario)
    .query(`
      SELECT id_protagonista, estado_verificacion
      FROM dbo.PROTAGONISTAS
      WHERE id_usuario = @id_usuario;
    `);
  return result.recordset[0] || null;
}

async function ensureCategoryExists(pool, idCategoria) {
  const result = await pool.request()
    .input('id_categoria', sql.Int, Number(idCategoria))
    .query('SELECT id_categoria FROM dbo.CATEGORIAS WHERE id_categoria = @id_categoria;');
  return result.recordset.length > 0;
}

function productInputValues(req) {
  return {
    nombre_producto: String(req.body.nombre_producto || '').trim(),
    id_categoria: Number(req.body.id_categoria),
    descripcion: req.body.descripcion == null || String(req.body.descripcion).trim() === ''
      ? null
      : String(req.body.descripcion).trim(),
    precio: Number(req.body.precio),
    imagen: req.body.imagen == null || String(req.body.imagen).trim() === ''
      ? null
      : String(req.body.imagen).trim(),
    stock_actual: Number(req.body.stock_actual)
  };
}

function sendDatabaseConstraintError(error, res, next) {
  if (error.number === 2601 || error.number === 2627) {
    return res.status(409).json({ mensaje: 'Ya existe un registro con los datos únicos indicados.' });
  }
  if (error.number === 547) {
    return res.status(400).json({ mensaje: 'La operación hace referencia a una categoría o registro relacionado que no existe o no puede modificarse.' });
  }
  return next(error);
}

async function createProduct(req, res, next) {
  try {
    const pool = await getPool();
    const protagonist = await getVerifiedProtagonist(pool, req.auth.id_usuario);
    if (!protagonist) {
      return res.status(403).json({ mensaje: 'La cuenta no tiene un perfil de protagonista asociado.' });
    }
    if (!protagonist.estado_verificacion) {
      return res.status(403).json({ mensaje: 'El perfil de protagonista debe ser verificado por la institución antes de publicar productos.' });
    }

    const values = productInputValues(req);
    if (!(await ensureCategoryExists(pool, values.id_categoria))) {
      return res.status(400).json({ mensaje: 'La categoría seleccionada no existe.' });
    }

    const result = await pool.request()
      .input('id_protagonista', sql.Int, protagonist.id_protagonista)
      .input('id_categoria', sql.Int, values.id_categoria)
      .input('nombre_producto', sql.NVarChar(150), values.nombre_producto)
      .input('descripcion', sql.NVarChar(sql.MAX), values.descripcion)
      .input('precio', sql.Decimal(10, 2), values.precio)
      .input('imagen', sql.NVarChar(500), values.imagen)
      .input('stock_actual', sql.Int, values.stock_actual)
      .query(`
        INSERT INTO dbo.PRODUCTOS
          (id_protagonista, id_categoria, nombre_producto, descripcion, precio, imagen, estado, stock_actual)
        OUTPUT INSERTED.id_producto
        VALUES
          (@id_protagonista, @id_categoria, @nombre_producto, @descripcion, @precio, @imagen, N'Activo', @stock_actual);
      `);

    const product = await findProductById(pool, result.recordset[0].id_producto);
    return res.status(201).json({ mensaje: 'Producto publicado correctamente.', producto: product });
  } catch (error) {
    return sendDatabaseConstraintError(error, res, next);
  }
}

async function getOwnedProduct(pool, idProducto, idUsuario) {
  const result = await pool.request()
    .input('id_producto', sql.Int, Number(idProducto))
    .query(`
      SELECT p.id_producto, p.id_protagonista, p.estado,
             pr.id_usuario, pr.estado_verificacion
      FROM dbo.PRODUCTOS AS p
      INNER JOIN dbo.PROTAGONISTAS AS pr ON pr.id_protagonista = p.id_protagonista
      WHERE p.id_producto = @id_producto;
    `);
  const product = result.recordset[0] || null;
  if (!product) return { product: null, allowed: false };
  return { product, allowed: product.id_usuario === Number(idUsuario) };
}

async function updateProduct(req, res, next) {
  try {
    const pool = await getPool();
    const ownership = await getOwnedProduct(pool, req.params.id, req.auth.id_usuario);
    if (!ownership.product) {
      return res.status(404).json({ mensaje: 'No se encontró el producto solicitado.' });
    }
    if (!ownership.allowed) {
      return res.status(403).json({ mensaje: 'Solo puede editar los productos de su propio emprendimiento.' });
    }

    const values = productInputValues(req);
    if (!(await ensureCategoryExists(pool, values.id_categoria))) {
      return res.status(400).json({ mensaje: 'La categoría seleccionada no existe.' });
    }

    await pool.request()
      .input('id_producto', sql.Int, Number(req.params.id))
      .input('id_categoria', sql.Int, values.id_categoria)
      .input('nombre_producto', sql.NVarChar(150), values.nombre_producto)
      .input('descripcion', sql.NVarChar(sql.MAX), values.descripcion)
      .input('precio', sql.Decimal(10, 2), values.precio)
      .input('imagen', sql.NVarChar(500), values.imagen)
      .input('stock_actual', sql.Int, values.stock_actual)
      .query(`
        UPDATE dbo.PRODUCTOS
        SET id_categoria = @id_categoria,
            nombre_producto = @nombre_producto,
            descripcion = @descripcion,
            precio = @precio,
            imagen = @imagen,
            stock_actual = @stock_actual
        WHERE id_producto = @id_producto;
      `);

    const product = await findProductById(pool, req.params.id);
    return res.status(200).json({ mensaje: 'Producto actualizado correctamente.', producto: product });
  } catch (error) {
    return sendDatabaseConstraintError(error, res, next);
  }
}

async function changeProductStatus(req, res, next, forcedStatus = null) {
  try {
    const requestedStatus = forcedStatus || req.body.estado;
    const pool = await getPool();
    const ownership = await getOwnedProduct(pool, req.params.id, req.auth.id_usuario);

    if (!ownership.product) {
      return res.status(404).json({ mensaje: 'No se encontró el producto solicitado.' });
    }
    if (!ownership.allowed) {
      return res.status(403).json({ mensaje: 'Solo puede cambiar el estado de los productos de su propio emprendimiento.' });
    }
    if (requestedStatus === 'Activo' && !ownership.product.estado_verificacion) {
      return res.status(403).json({ mensaje: 'No se puede activar un producto hasta que el perfil de protagonista esté verificado.' });
    }

    await pool.request()
      .input('id_producto', sql.Int, Number(req.params.id))
      .input('estado', sql.NVarChar(10), requestedStatus)
      .query('UPDATE dbo.PRODUCTOS SET estado = @estado WHERE id_producto = @id_producto;');

    const product = await findProductById(pool, req.params.id);
    return res.status(200).json({
      mensaje: requestedStatus === 'Activo' ? 'Producto activado correctamente.' : 'Producto desactivado correctamente.',
      producto: product
    });
  } catch (error) {
    return next(error);
  }
}

function setProductStatus(req, res, next) {
  return changeProductStatus(req, res, next);
}

function deactivateProduct(req, res, next) {
  // DELETE conserva la compatibilidad semántica con la Fase 1, pero nunca borra
  // físicamente: cambia el estado para preservar historiales y referencias.
  return changeProductStatus(req, res, next, 'Inactivo');
}

module.exports = {
  listProducts,
  getProduct,
  getMyProducts,
  createProduct,
  updateProduct,
  setProductStatus,
  deactivateProduct
};
