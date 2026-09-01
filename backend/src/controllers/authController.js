import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { AppError, wrap } from '../middleware/errorHandler.js';
import { firmarToken } from '../middleware/auth.js';
import { requireFields, assertEmail, assertEnum } from '../utils/validate.js';

const publico = (u) => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, fecha_registro: u.fecha_registro });

// POST /api/auth/register
export const register = wrap(async (req, res) => {
  const { nombre, correo, password } = req.body;
  requireFields(req.body, ['nombre', 'correo', 'password']);
  assertEmail(correo);
  if (String(password).length < 6) throw new AppError(400, 'La contraseña debe tener al menos 6 caracteres');

  let rol = req.body.rol || 'alumno';
  assertEnum(rol, ['admin', 'docente', 'alumno'], 'rol');

  // El primer usuario del sistema se crea como admin automáticamente.
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get();
  if (total === 0) rol = 'admin';

  const existe = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(correo.trim());
  if (existe) throw new AppError(409, 'Ya existe un usuario con ese correo');

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)')
    .run(nombre.trim(), correo.trim(), hash, rol);

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ usuario: publico(usuario), token: firmarToken(usuario) });
});

// POST /api/auth/login
export const login = wrap(async (req, res) => {
  const { correo, password } = req.body;
  requireFields(req.body, ['correo', 'password']);

  const usuario = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(String(correo).trim());
  if (!usuario || !bcrypt.compareSync(password, usuario.password_hash)) {
    throw new AppError(401, 'Credenciales incorrectas');
  }
  res.json({ usuario: publico(usuario), token: firmarToken(usuario) });
});

// GET /api/auth/me
export const me = wrap(async (req, res) => {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
  if (!usuario) throw new AppError(404, 'Usuario no encontrado');
  res.json(publico(usuario));
});
