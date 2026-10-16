function validateRequest(req, res, next) {
  const { validationResult } = require('express-validator');
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      mensaje: 'Hay datos inválidos en la solicitud.',
      errores: result.array().map(({ path, msg }) => ({ campo: path, mensaje: msg }))
    });
  }
  return next();
}

module.exports = { validateRequest };
