// Seguridad básica: JWT + control de acceso por rol.
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-inseguro';

export function firmarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// Exige un token válido. Deja el usuario en req.user.
export function autenticar(req, _res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return next(new AppError(401, 'Falta el token de autenticación'));
  }
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.sub, nombre: payload.nombre, correo: payload.correo, rol: payload.rol };
    next();
  } catch {
    next(new AppError(401, 'Token inválido o expirado'));
  }
}

// Exige que el usuario tenga uno de los roles indicados.
export function requiereRol(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'No autenticado'));
    if (!roles.includes(req.user.rol)) {
      return next(new AppError(403, 'No tienes permisos para esta acción'));
    }
    next();
  };
}
