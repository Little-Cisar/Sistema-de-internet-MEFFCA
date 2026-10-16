const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Se requiere un token Bearer para esta operación.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const idUsuario = Number(payload.sub);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(401).json({ mensaje: 'El token no contiene un usuario válido.' });
    }
    req.auth = { id_usuario: idUsuario, rol: payload.rol };
    return next();
  } catch (_error) {
    return res.status(401).json({ mensaje: 'El token es inválido o ha expirado.' });
  }
}

// Para acciones públicas que pueden pertenecer a un visitante anónimo o a
// un usuario autenticado. Nunca se acepta id_usuario desde el cuerpo.
function optionalAuth(req, res, next) {
  const authHeader = req.get('authorization');
  if (!authHeader) return next();
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match) return res.status(401).json({ mensaje: 'El encabezado Authorization debe usar el formato Bearer.' });
  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET);
    const idUsuario = Number(payload.sub);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(401).json({ mensaje: 'El token no contiene un usuario válido.' });
    }
    req.auth = { id_usuario: idUsuario, rol: payload.rol };
    return next();
  } catch (_error) {
    return res.status(401).json({ mensaje: 'El token es inválido o ha expirado.' });
  }
}

function allowRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.auth || !rolesPermitidos.includes(req.auth.rol)) {
      return res.status(403).json({ mensaje: 'No tiene permisos para realizar esta operación.' });
    }
    return next();
  };
}

module.exports = { requireAuth, optionalAuth, allowRoles };
