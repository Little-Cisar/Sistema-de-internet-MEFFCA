const express = require('express');
const { body, param } = require('express-validator');
const { listCategories, createCategory, updateCategory } = require('../controllers/categoryController');
const { requireAuth, allowRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../validators/validateRequest');

const router = express.Router();
const categoryId = param('id').isInt({ min: 1 }).withMessage('El identificador de categoría debe ser un entero positivo.').toInt();
const categoryName = body('nombre_categoria')
  .exists({ checkFalsy: true }).withMessage('El nombre de la categoría es obligatorio.')
  .bail().isString().withMessage('El nombre de la categoría debe ser texto.')
  .bail().trim().isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres.');
const categoryDescription = body('descripcion')
  .optional({ nullable: true, checkFalsy: true })
  .isString().withMessage('La descripción debe ser texto.')
  .bail().isLength({ max: 10000 }).withMessage('La descripción no puede superar 10000 caracteres.')
  .trim();

router.get('/', listCategories);
router.post(
  '/',
  requireAuth,
  allowRoles('Admin'),
  categoryName,
  categoryDescription,
  validateRequest,
  createCategory
);
router.put(
  '/:id',
  requireAuth,
  allowRoles('Admin'),
  categoryId,
  categoryName,
  categoryDescription,
  validateRequest,
  updateCategory
);

// No se implementa DELETE de categorías: la tabla PRODUCTOS mantiene una FK a
// CATEGORIAS. Editarlas conserva las referencias históricas de las publicaciones.
module.exports = router;
