const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { register, login, getProfile } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateRequest } = require('../validators/validateRequest');

const router = express.Router();
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos de registro. Intente de nuevo más tarde.' }
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos de inicio de sesión. Intente de nuevo más tarde.' }
});

const validateEmail = body('email')
  .exists({ checkFalsy: true }).withMessage('El correo es obligatorio.')
  .bail().isEmail().withMessage('El correo debe tener un formato válido.')
  .bail().isLength({ max: 254 }).withMessage('El correo no puede superar 254 caracteres.')
  .normalizeEmail();

const validatePassword = body('password')
  .exists({ checkFalsy: true }).withMessage('La contraseña es obligatoria.')
  .bail().isString().withMessage('La contraseña debe ser texto.')
  .bail().isLength({ min: 8, max: 72 }).withMessage('La contraseña debe tener entre 8 y 72 caracteres.');

router.post(
  '/registro',
  registerLimiter,
  validateEmail,
  validatePassword,
  body('rol').optional().isString().withMessage('El rol debe ser texto.').bail()
    .trim().isIn(['Cliente', 'Protagonista']).withMessage('El rol debe ser Cliente o Protagonista.'),
  body('nombre_negocio').if((value, { req }) => req.body.rol === 'Protagonista')
    .exists({ checkFalsy: true }).withMessage('El nombre del negocio es obligatorio para protagonistas.')
    .bail().isString().bail().trim().isLength({ min: 2, max: 100 })
    .withMessage('El nombre del negocio debe tener entre 2 y 100 caracteres.'),
  body('telefono_whatsapp').if((value, { req }) => req.body.rol === 'Protagonista')
    .exists({ checkFalsy: true }).withMessage('El WhatsApp es obligatorio para protagonistas.')
    .bail().isString().bail().trim().isLength({ min: 8, max: 20 })
    .withMessage('El WhatsApp debe tener entre 8 y 20 caracteres.'),
  body('departamento').if((value, { req }) => req.body.rol === 'Protagonista')
    .exists({ checkFalsy: true }).withMessage('El departamento es obligatorio para protagonistas.')
    .bail().isString().bail().trim().isLength({ min: 2, max: 50 })
    .withMessage('El departamento debe tener entre 2 y 50 caracteres.'),
  body('descripcion_negocio').optional({ nullable: true }).isString()
    .isLength({ max: 4000 }).withMessage('La descripción no puede superar 4000 caracteres.'),
  validateRequest,
  register
);

router.post('/login', loginLimiter, validateEmail, validatePassword, validateRequest, login);
router.get('/perfil', requireAuth, getProfile);

module.exports = router;
