const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { recordInteraction, getMyInteractionSummary } = require('../controllers/interactionController');
const { optionalAuth, requireAuth, allowRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../validators/validateRequest');

const router = express.Router();
const interactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Se alcanzó el límite temporal de registros de interacción. Intente más tarde.' }
});

router.get('/mis', requireAuth, allowRoles('Protagonista'), getMyInteractionSummary);

router.post(
  '/',
  interactionLimiter,
  optionalAuth,
  body('id_producto').exists({ checkFalsy: true }).withMessage('id_producto es obligatorio.')
    .bail().isInt({ min: 1 }).withMessage('id_producto debe ser un entero positivo.').toInt(),
  body('tipo_accion').optional({ checkFalsy: true })
    .isIn(['Clic en WhatsApp']).withMessage('La acción permitida actualmente es Clic en WhatsApp.'),
  validateRequest,
  recordInteraction
);

module.exports = router;
