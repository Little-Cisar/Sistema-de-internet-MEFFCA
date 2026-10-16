const express = require('express');
const { body, param, query } = require('express-validator');
const {
  listProducts,
  getProduct,
  getMyProducts,
  createProduct,
  updateProduct,
  setProductStatus,
  deactivateProduct
} = require('../controllers/productController');
const { requireAuth, allowRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../validators/validateRequest');

const router = express.Router();
const protagonistOnly = [requireAuth, allowRoles('Protagonista')];
const productId = param('id').isInt({ min: 1 }).withMessage('El identificador del producto debe ser un entero positivo.').toInt();
const validName = body('nombre_producto')
  .exists({ checkFalsy: true }).withMessage('El nombre del producto es obligatorio.')
  .bail().isString().withMessage('El nombre del producto debe ser texto.')
  .bail().trim().isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres.');
const validCategoryId = body('id_categoria')
  .exists({ checkFalsy: true }).withMessage('La categoría es obligatoria.')
  .bail().isInt({ min: 1 }).withMessage('La categoría debe ser un identificador entero positivo.')
  .toInt();
const validDescription = body('descripcion')
  .optional({ nullable: true, checkFalsy: true })
  .isString().withMessage('La descripción debe ser texto.')
  .bail().isLength({ max: 10000 }).withMessage('La descripción no puede superar 10000 caracteres.')
  .trim();
const validPrice = body('precio')
  .exists({ checkFalsy: false }).withMessage('El precio es obligatorio.')
  .bail().custom((value) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 && n <= 99999999.99 && /^\d{1,8}(\.\d{1,2})?$/.test(String(value).trim());
  }).withMessage('El precio debe ser un número mayor o igual que cero con un máximo de dos decimales.')
  .toFloat();
const validImage = body('imagen')
  .optional({ nullable: true, checkFalsy: true })
  .isString().withMessage('La imagen debe ser una URL de texto.')
  .bail().isURL({ protocols: ['http', 'https'], require_protocol: true })
  .withMessage('La imagen debe ser una URL que comience por http:// o https://.')
  .bail().isLength({ max: 500 }).withMessage('La URL de imagen no puede superar 500 caracteres.')
  .trim();
const validStock = body('stock_actual')
  .exists({ checkFalsy: false }).withMessage('La existencia es obligatoria.')
  .bail().isInt({ min: 0, max: 2147483647 }).withMessage('La existencia debe ser un entero igual o mayor que cero.')
  .toInt();
const productFields = [validName, validCategoryId, validDescription, validPrice, validImage, validStock];

router.get(
  '/',
  query('q').optional({ checkFalsy: true }).isString().withMessage('q debe ser texto.').bail().trim().isLength({ max: 100 }).withMessage('La búsqueda no puede superar 100 caracteres.'),
  query('id_categoria').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('id_categoria debe ser un entero positivo.').toInt(),
  query('id_protagonista').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('id_protagonista debe ser un entero positivo.').toInt(),
  query('min_precio').optional({ checkFalsy: true }).isFloat({ min: 0, max: 99999999.99 }).withMessage('min_precio debe ser un precio válido.').toFloat(),
  query('max_precio').optional({ checkFalsy: true }).isFloat({ min: 0, max: 99999999.99 }).withMessage('max_precio debe ser un precio válido.').toFloat(),
  query('page').optional({ checkFalsy: true }).isInt({ min: 1, max: 1000000 }).withMessage('page debe ser un entero positivo.').toInt(),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100.').toInt(),
  query('orden').optional({ checkFalsy: true }).isIn(['recientes', 'precio_asc', 'precio_desc', 'nombre_asc']).withMessage('orden no es válido.'),
  validateRequest,
  listProducts
);

// La ruta literal /mios se declara antes que /:id para que se interprete correctamente.
router.get('/mios', ...protagonistOnly, getMyProducts);
router.get('/:id', productId, validateRequest, getProduct);
router.post('/', ...protagonistOnly, productFields, validateRequest, createProduct);
router.put('/:id', ...protagonistOnly, productId, productFields, validateRequest, updateProduct);
router.patch(
  '/:id/estado',
  ...protagonistOnly,
  productId,
  body('estado').exists({ checkFalsy: true }).withMessage('El estado es obligatorio.').bail()
    .isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser Activo o Inactivo.'),
  validateRequest,
  setProductStatus
);
router.delete('/:id', ...protagonistOnly, productId, validateRequest, deactivateProduct);

module.exports = router;
