const { sql, getPool } = require('../config/database');

function handleCategoryDatabaseError(error, res, next) {
  if (error.number === 2601 || error.number === 2627) {
    return res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre.' });
  }
  if (error.number === 547) {
    return res.status(409).json({ mensaje: 'La categoría está relacionada con otros registros y no se puede eliminar de forma física.' });
  }
  return next(error);
}

async function listCategories(_req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id_categoria, nombre_categoria, descripcion
      FROM dbo.CATEGORIAS
      ORDER BY nombre_categoria ASC, id_categoria ASC;
    `);
    return res.status(200).json({ categorias: result.recordset, total: result.recordset.length });
  } catch (error) {
    return next(error);
  }
}

async function createCategory(req, res, next) {
  const nombre = String(req.body.nombre_categoria || '').trim();
  const descripcion = req.body.descripcion == null || String(req.body.descripcion).trim() === ''
    ? null
    : String(req.body.descripcion).trim();

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('nombre_categoria', sql.NVarChar(50), nombre)
      .input('descripcion', sql.NVarChar(sql.MAX), descripcion)
      .query(`
        INSERT INTO dbo.CATEGORIAS (nombre_categoria, descripcion)
        OUTPUT INSERTED.id_categoria, INSERTED.nombre_categoria, INSERTED.descripcion
        VALUES (@nombre_categoria, @descripcion);
      `);
    return res.status(201).json({ mensaje: 'Categoría creada correctamente.', categoria: result.recordset[0] });
  } catch (error) {
    return handleCategoryDatabaseError(error, res, next);
  }
}

async function updateCategory(req, res, next) {
  const nombre = String(req.body.nombre_categoria || '').trim();
  const descripcion = req.body.descripcion == null || String(req.body.descripcion).trim() === ''
    ? null
    : String(req.body.descripcion).trim();

  try {
    const pool = await getPool();
    const existing = await pool.request()
      .input('id_categoria', sql.Int, Number(req.params.id))
      .query('SELECT id_categoria FROM dbo.CATEGORIAS WHERE id_categoria = @id_categoria;');

    if (!existing.recordset.length) {
      return res.status(404).json({ mensaje: 'No se encontró la categoría solicitada.' });
    }

    const result = await pool.request()
      .input('id_categoria', sql.Int, Number(req.params.id))
      .input('nombre_categoria', sql.NVarChar(50), nombre)
      .input('descripcion', sql.NVarChar(sql.MAX), descripcion)
      .query(`
        UPDATE dbo.CATEGORIAS
        SET nombre_categoria = @nombre_categoria,
            descripcion = @descripcion
        OUTPUT INSERTED.id_categoria, INSERTED.nombre_categoria, INSERTED.descripcion
        WHERE id_categoria = @id_categoria;
      `);

    return res.status(200).json({ mensaje: 'Categoría actualizada correctamente.', categoria: result.recordset[0] });
  } catch (error) {
    return handleCategoryDatabaseError(error, res, next);
  }
}

module.exports = { listCategories, createCategory, updateCategory };
