const express = require('express');
const { body, param } = require('express-validator');
const {
  listUsers,
  listPendingProtagonists,
  setProtagonistVerification
} = require('../controllers/adminController');
const { requireAuth, allowRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../validators/validateRequest');

const router = express.Router();
const adminOnly = [requireAuth, allowRoles('Admin')];
const protagonistId = param('id')
  .isInt({ min: 1 }).withMessage('El identificador del protagonista debe ser un entero positivo.')
  .toInt();

router.use(...adminOnly);
router.get('/usuarios', listUsers);
router.get('/protagonistas/pendientes', listPendingProtagonists);
router.patch(
  '/protagonistas/:id/verificacion',
  protagonistId,
  body('estado_verificacion').exists().withMessage('estado_verificacion es obligatorio.')
    .bail().isBoolean().withMessage('estado_verificacion debe ser booleano (true o false).')
    .toBoolean(),
  validateRequest,
  setProtagonistVerification
);

module.exports = router;
