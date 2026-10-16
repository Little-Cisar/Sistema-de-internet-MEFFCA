const express = require('express');
const { body, param } = require('express-validator');
const {
  createSale,
  listMySales,
  listMyPurchases,
  listAllSales,
  getSaleDetails,
  cancelSale
} = require('../controllers/salesController');
const { requireAuth, allowRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../validators/validateRequest');

const router = express.Router();
const saleId = param('id').isInt({ min: 1 }).withMessage('El identificador de la operación debe ser un entero positivo.').toInt();
const protagonistOnly = [requireAuth, allowRoles('Protagonista')];
const buyerRoles = [requireAuth, allowRoles('Cliente', 'Protagonista')];

router.get('/mias', ...protagonistOnly, listMySales);
router.get('/compras', ...buyerRoles, listMyPurchases);
router.get('/', requireAuth, allowRoles('Admin'), listAllSales);

router.post(
  '/',
  ...protagonistOnly,
  body('detalles').exists().withMessage('La venta debe incluir detalles.')
    .bail().isArray({ min: 1, max: 30 }).withMessage('La venta debe contener entre 1 y 30 líneas de producto.')
    .bail().custom((details) => {
      const ids = details.map((item) => Number(item?.id_producto));
      return ids.every(Number.isInteger) && new Set(ids).size === ids.length;
    }).withMessage('Cada producto debe aparecer una sola vez en los detalles; ajusta la cantidad en su línea.'),
  body('detalles.*.id_producto').exists({ checkFalsy: true }).withMessage('Cada línea debe incluir id_producto.')
    .bail().isInt({ min: 1 }).withMessage('id_producto debe ser un entero positivo.').toInt(),
  body('detalles.*.cantidad').exists({ checkFalsy: true }).withMessage('Cada línea debe incluir cantidad.')
    .bail().isInt({ min: 1, max: 1000000 }).withMessage('La cantidad debe ser un entero positivo.').toInt(),
  body('comprador_email').optional({ checkFalsy: true }).isString().withMessage('El correo del comprador debe ser texto.')
    .bail().trim().isEmail().withMessage('El correo del comprador no tiene un formato válido.')
    .bail().isLength({ max: 254 }).withMessage('El correo del comprador no puede superar 254 caracteres.'),
  body('metodo_pago').optional({ nullable: true, checkFalsy: true }).isString().withMessage('El método de pago debe ser texto.')
    .bail().trim().isLength({ max: 50 }).withMessage('El método de pago no puede superar 50 caracteres.'),
  body('metodo_entrega').optional({ nullable: true, checkFalsy: true }).isString().withMessage('El método de entrega debe ser texto.')
    .bail().trim().isLength({ max: 50 }).withMessage('El método de entrega no puede superar 50 caracteres.'),
  body('observaciones').optional({ nullable: true, checkFalsy: true }).isString().withMessage('Las observaciones deben ser texto.')
    .bail().trim().isLength({ max: 500 }).withMessage('Las observaciones no pueden superar 500 caracteres.'),
  validateRequest,
  createSale
);

router.get('/:id', requireAuth, allowRoles('Admin', 'Protagonista', 'Cliente'), saleId, validateRequest, getSaleDetails);
router.patch('/:id/anular', requireAuth, allowRoles('Admin', 'Protagonista'), saleId, validateRequest, cancelSale);

module.exports = router;
