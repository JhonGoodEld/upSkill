import db from '../db/index.js';
import { AppError, wrap } from '../middleware/errorHandler.js';
import { requireFields, assertEnum, toInt } from '../utils/validate.js';

const TIPOS = ['llamada', 'correo', 'reunion'];

// POST /api/interacciones   { cliente_id, tipo, descripcion, fecha? }
// El usuario responsable se toma del token (no se confía en el body).
export const crear = wrap(async (req, res) => {
  requireFields(req.body, ['cliente_id', 'tipo', 'descripcion']);
  const clienteId = toInt(req.body.cliente_id, 'cliente_id');
  assertEnum(req.body.tipo, TIPOS, 'tipo');

  const cliente = db.prepare('SELECT id FROM clientes WHERE id = ?').get(clienteId);
  if (!cliente) throw new AppError(404, 'El cliente indicado no existe');

  const fecha = req.body.fecha ? String(req.body.fecha) : new Date().toISOString();

  const info = db
    .prepare(
      `INSERT INTO interacciones (cliente_id, tipo, descripcion, fecha, usuario_id)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(clienteId, req.body.tipo, String(req.body.descripcion).trim(), fecha, req.user.id);

  res.status(201).json(db.prepare('SELECT * FROM interacciones WHERE id = ?').get(info.lastInsertRowid));
});

// GET /api/clientes/:id/interacciones
export const listarPorCliente = wrap(async (req, res) => {
  const clienteId = toInt(req.params.id, 'id');
  const cliente = db.prepare('SELECT id FROM clientes WHERE id = ?').get(clienteId);
  if (!cliente) throw new AppError(404, 'Cliente no encontrado');

  const rows = db
    .prepare(
      `SELECT i.*, u.nombre AS usuario_nombre
       FROM interacciones i
       JOIN usuarios u ON u.id = i.usuario_id
       WHERE i.cliente_id = ?
       ORDER BY i.fecha DESC`
    )
    .all(clienteId);

  res.json(rows);
});

// GET /api/interacciones/mias   -> pantalla "Mi actividad"
export const misInteracciones = wrap(async (req, res) => {
  const rows = db
    .prepare(
      `SELECT i.*, c.nombre AS cliente_nombre
       FROM interacciones i
       JOIN clientes c ON c.id = i.cliente_id
       WHERE i.usuario_id = ?
       ORDER BY i.fecha DESC`
    )
    .all(req.user.id);

  res.json(rows);
});
