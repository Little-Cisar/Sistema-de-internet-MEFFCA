const express = require('express');
const { body, param } = require('express-validator');
const {
  listPublicProtagonists,
  getPublicProtagonist,
  getMyProtagonist,
  updateProtagonist
} = require('../controllers/protagonistController');
const { requireAuth, allowRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../validators/validateRequest');

const router = express.Router();
const protagonistOnly = [requireAuth, allowRoles('Protagonista')];
const protagonistId = param('id')
  .isInt({ min: 1 }).withMessage('El identificador del protagonista debe ser un entero positivo.')
  .toInt();

const validName = body('nombre_negocio')
  .exists({ checkFalsy: true }).withMessage('El nombre del emprendimiento es obligatorio.')
  .bail().isString().withMessage('El nombre del emprendimiento debe ser texto.')
  .bail().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.');
const validPhone = body('telefono_whatsapp')
  .exists({ checkFalsy: true }).withMessage('El teléfono de WhatsApp es obligatorio.')
  .bail().isString().withMessage('El teléfono debe ser texto.')
  .bail().trim().isLength({ min: 8, max: 20 }).withMessage('El teléfono debe tener entre 8 y 20 caracteres.')
  .bail().matches(/^[+\d][\d\s().-]{6,19}$/).withMessage('El teléfono contiene caracteres no admitidos.');
const validDepartment = body('departamento')
  .exists({ checkFalsy: true }).withMessage('El departamento es obligatorio.')
  .bail().isString().withMessage('El departamento debe ser texto.')
  .bail().trim().isLength({ min: 2, max: 50 }).withMessage('El departamento debe tener entre 2 y 50 caracteres.');
const validDescription = body('descripcion_negocio')
  .optional({ nullable: true, checkFalsy: true })
  .isString().withMessage('La descripción debe ser texto.')
  .bail().isLength({ max: 4000 }).withMessage('La descripción no puede superar 4000 caracteres.')
  .trim();

router.get('/', listPublicProtagonists);
router.get('/me', ...protagonistOnly, getMyProtagonist);
router.put(
  '/:id',
  ...protagonistOnly,
  protagonistId,
  validName,
  validPhone,
  validDepartment,
  validDescription,
  validateRequest,
  updateProtagonist
);
router.get('/:id', protagonistId, validateRequest, getPublicProtagonist);

module.exports = router;
