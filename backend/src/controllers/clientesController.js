import db from '../db/index.js';
import { AppError, wrap } from '../middleware/errorHandler.js';
import { requireFields, assertEmail, assertEnum, assertTelefono, toInt } from '../utils/validate.js';

const ESTADOS = ['activo', 'inactivo'];
const ETAPAS = ['Prospecto', 'Activo', 'Frecuente', 'Inactivo'];

function obtenerClienteOr404(id) {
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
  if (!cliente) throw new AppError(404, 'Cliente no encontrado');
  return cliente;
}

// GET /api/clientes?buscar=texto&estado=activo&etapa=Activo
export const listar = wrap(async (req, res) => {
  const { buscar, estado, etapa } = req.query;
  const where = [];
  const params = [];

  if (buscar) {
    where.push('(nombre LIKE ? OR correo LIKE ? OR empresa LIKE ?)');
    const like = `%${buscar}%`;
    params.push(like, like, like);
  }
  if (estado) {
    assertEnum(estado, ESTADOS, 'estado');
    where.push('estado = ?');
    params.push(estado);
  }
  if (etapa) {
    assertEnum(etapa, ETAPAS, 'etapa');
    where.push('etapa_crm = ?');
    params.push(etapa);
  }

  const sql = `SELECT * FROM clientes ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY fecha_registro DESC`;
  res.json(db.prepare(sql).all(...params));
});

// GET /api/clientes/:id
export const obtener = wrap(async (req, res) => {
  res.json(obtenerClienteOr404(toInt(req.params.id, 'id')));
});

// POST /api/clientes
export const crear = wrap(async (req, res) => {
  const { nombre, correo, telefono, empresa, estado, etapa_crm } = req.body;
  requireFields(req.body, ['nombre', 'correo']);
  assertEmail(correo);
  assertTelefono(telefono);
  if (estado) assertEnum(estado, ESTADOS, 'estado');
  if (etapa_crm) assertEnum(etapa_crm, ETAPAS, 'etapa_crm');

  if (db.prepare('SELECT id FROM clientes WHERE correo = ?').get(correo.trim())) {
    throw new AppError(409, 'Ya existe un cliente con ese correo');
  }

  const info = db
    .prepare(
      `INSERT INTO clientes (nombre, correo, telefono, empresa, estado, etapa_crm)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      nombre.trim(),
      correo.trim(),
      telefono?.trim() || null,
      empresa?.trim() || null,
      estado || 'activo',
      etapa_crm || 'Prospecto'
    );

  res.status(201).json(obtenerClienteOr404(info.lastInsertRowid));
});

// PUT /api/clientes/:id
export const actualizar = wrap(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const actual = obtenerClienteOr404(id);

  const { nombre, correo, telefono, empresa, estado, etapa_crm } = req.body;
  if (correo) assertEmail(correo);
  assertTelefono(telefono);
  if (estado) assertEnum(estado, ESTADOS, 'estado');
  if (etapa_crm) assertEnum(etapa_crm, ETAPAS, 'etapa_crm');

  if (correo && correo.trim() !== actual.correo) {
    if (db.prepare('SELECT id FROM clientes WHERE correo = ? AND id <> ?').get(correo.trim(), id)) {
      throw new AppError(409, 'Ya existe otro cliente con ese correo');
    }
  }

  const merged = {
    nombre: nombre?.trim() ?? actual.nombre,
    correo: correo?.trim() ?? actual.correo,
    telefono: telefono !== undefined ? (telefono?.trim() || null) : actual.telefono,
    empresa: empresa !== undefined ? (empresa?.trim() || null) : actual.empresa,
    estado: estado ?? actual.estado,
    etapa_crm: etapa_crm ?? actual.etapa_crm,
  };

  db.prepare(
    `UPDATE clientes SET nombre = ?, correo = ?, telefono = ?, empresa = ?, estado = ?, etapa_crm = ?
     WHERE id = ?`
  ).run(merged.nombre, merged.correo, merged.telefono, merged.empresa, merged.estado, merged.etapa_crm, id);

  res.json(obtenerClienteOr404(id));
});

// PUT /api/clientes/:id/etapa   { etapa_crm: "Activo" }
export const cambiarEtapa = wrap(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  obtenerClienteOr404(id);
  const { etapa_crm } = req.body;
  requireFields(req.body, ['etapa_crm']);
  assertEnum(etapa_crm, ETAPAS, 'etapa_crm');

  db.prepare('UPDATE clientes SET etapa_crm = ? WHERE id = ?').run(etapa_crm, id);
  res.json(obtenerClienteOr404(id));
});

// DELETE /api/clientes/:id   (solo admin - se aplica en la ruta)
export const eliminar = wrap(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  obtenerClienteOr404(id);
  db.prepare('DELETE FROM clientes WHERE id = ?').run(id);
  res.status(204).end();
});
