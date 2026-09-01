// CRM del Docente: pipeline de contactos (prospecto -> graduado) + seguimientos.
// Todo queda aislado por docente: se filtra siempre por req.user.id.
import db from '../db/index.js';
import { AppError, wrap } from '../middleware/errorHandler.js';
import { requireFields, assertEmail, assertEnum, assertTelefono, toInt } from '../utils/validate.js';

const ESTADOS = ['activo', 'inactivo'];
const ETAPAS = ['Prospecto', 'Inscrito', 'Al dia', 'En riesgo', 'Graduado'];
const TIPOS = ['mensaje', 'tutoria', 'llamada', 'correo', 'reunion'];

function contactoDelDocenteOr404(id, docenteId) {
  const contacto = db
    .prepare('SELECT * FROM contactos_docente WHERE id = ? AND docente_id = ?')
    .get(id, docenteId);
  if (!contacto) throw new AppError(404, 'Contacto no encontrado');
  return contacto;
}

// GET /api/docente/contactos?buscar=&estado=&etapa=
export const listarContactos = wrap(async (req, res) => {
  const { buscar, estado, etapa } = req.query;
  const where = ['docente_id = ?'];
  const params = [req.user.id];

  if (buscar) {
    where.push('(nombre LIKE ? OR correo LIKE ? OR curso LIKE ?)');
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
    where.push('etapa = ?');
    params.push(etapa);
  }

  const sql = `SELECT * FROM contactos_docente WHERE ${where.join(' AND ')} ORDER BY fecha_registro DESC`;
  res.json(db.prepare(sql).all(...params));
});

// GET /api/docente/contactos/:id
export const obtenerContacto = wrap(async (req, res) => {
  res.json(contactoDelDocenteOr404(toInt(req.params.id, 'id'), req.user.id));
});

// POST /api/docente/contactos
export const crearContacto = wrap(async (req, res) => {
  const { nombre, correo, telefono, curso, estado, etapa } = req.body;
  requireFields(req.body, ['nombre', 'correo']);
  assertEmail(correo);
  assertTelefono(telefono);
  if (estado) assertEnum(estado, ESTADOS, 'estado');
  if (etapa) assertEnum(etapa, ETAPAS, 'etapa');

  const duplicado = db
    .prepare('SELECT id FROM contactos_docente WHERE docente_id = ? AND correo = ?')
    .get(req.user.id, correo.trim());
  if (duplicado) throw new AppError(409, 'Ya tienes un contacto con ese correo');

  const info = db
    .prepare(
      `INSERT INTO contactos_docente (docente_id, nombre, correo, telefono, curso, estado, etapa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      nombre.trim(),
      correo.trim(),
      telefono?.trim() || null,
      curso?.trim() || null,
      estado || 'activo',
      etapa || 'Prospecto'
    );

  res.status(201).json(contactoDelDocenteOr404(info.lastInsertRowid, req.user.id));
});

// PUT /api/docente/contactos/:id
export const actualizarContacto = wrap(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  const actual = contactoDelDocenteOr404(id, req.user.id);

  const { nombre, correo, telefono, curso, estado, etapa } = req.body;
  if (correo) assertEmail(correo);
  assertTelefono(telefono);
  if (estado) assertEnum(estado, ESTADOS, 'estado');
  if (etapa) assertEnum(etapa, ETAPAS, 'etapa');

  if (correo && correo.trim() !== actual.correo) {
    const choca = db
      .prepare('SELECT id FROM contactos_docente WHERE docente_id = ? AND correo = ? AND id <> ?')
      .get(req.user.id, correo.trim(), id);
    if (choca) throw new AppError(409, 'Ya tienes otro contacto con ese correo');
  }

  const merged = {
    nombre: nombre?.trim() ?? actual.nombre,
    correo: correo?.trim() ?? actual.correo,
    telefono: telefono !== undefined ? (telefono?.trim() || null) : actual.telefono,
    curso: curso !== undefined ? (curso?.trim() || null) : actual.curso,
    estado: estado ?? actual.estado,
    etapa: etapa ?? actual.etapa,
  };

  db.prepare(
    `UPDATE contactos_docente
     SET nombre = ?, correo = ?, telefono = ?, curso = ?, estado = ?, etapa = ?
     WHERE id = ? AND docente_id = ?`
  ).run(merged.nombre, merged.correo, merged.telefono, merged.curso, merged.estado, merged.etapa, id, req.user.id);

  res.json(contactoDelDocenteOr404(id, req.user.id));
});

// PUT /api/docente/contactos/:id/etapa   { etapa: "Inscrito" }
export const cambiarEtapa = wrap(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  contactoDelDocenteOr404(id, req.user.id);
  requireFields(req.body, ['etapa']);
  assertEnum(req.body.etapa, ETAPAS, 'etapa');

  db.prepare('UPDATE contactos_docente SET etapa = ? WHERE id = ? AND docente_id = ?')
    .run(req.body.etapa, id, req.user.id);
  res.json(contactoDelDocenteOr404(id, req.user.id));
});

// DELETE /api/docente/contactos/:id
export const eliminarContacto = wrap(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  contactoDelDocenteOr404(id, req.user.id);
  db.prepare('DELETE FROM contactos_docente WHERE id = ? AND docente_id = ?').run(id, req.user.id);
  res.status(204).end();
});

// GET /api/docente/contactos/:id/seguimientos
export const listarSeguimientos = wrap(async (req, res) => {
  const id = toInt(req.params.id, 'id');
  contactoDelDocenteOr404(id, req.user.id);
  const rows = db
    .prepare('SELECT * FROM seguimientos WHERE contacto_id = ? ORDER BY fecha DESC')
    .all(id);
  res.json(rows);
});

// POST /api/docente/seguimientos   { contacto_id, tipo, descripcion }
export const crearSeguimiento = wrap(async (req, res) => {
  requireFields(req.body, ['contacto_id', 'tipo', 'descripcion']);
  const contactoId = toInt(req.body.contacto_id, 'contacto_id');
  assertEnum(req.body.tipo, TIPOS, 'tipo');
  contactoDelDocenteOr404(contactoId, req.user.id);

  const info = db
    .prepare(
      `INSERT INTO seguimientos (contacto_id, docente_id, tipo, descripcion)
       VALUES (?, ?, ?, ?)`
    )
    .run(contactoId, req.user.id, req.body.tipo, String(req.body.descripcion).trim());

  res.status(201).json(db.prepare('SELECT * FROM seguimientos WHERE id = ?').get(info.lastInsertRowid));
});

// GET /api/docente/metricas?dias=30
export const metricas = wrap(async (req, res) => {
  const diasSinContacto = Number(req.query.dias) > 0 ? Number(req.query.dias) : 30;
  const docenteId = req.user.id;

  const total = db
    .prepare('SELECT COUNT(*) AS n FROM contactos_docente WHERE docente_id = ?')
    .get(docenteId).n;
  const activos = db
    .prepare("SELECT COUNT(*) AS n FROM contactos_docente WHERE docente_id = ? AND estado = 'activo'")
    .get(docenteId).n;
  const totalSeguimientos = db
    .prepare('SELECT COUNT(*) AS n FROM seguimientos WHERE docente_id = ?')
    .get(docenteId).n;

  const porEtapa = db
    .prepare('SELECT etapa, COUNT(*) AS n FROM contactos_docente WHERE docente_id = ? GROUP BY etapa')
    .all(docenteId);

  // Contactos sin seguimiento reciente (nunca, o hace más de N días).
  const sinSeguimiento = db
    .prepare(
      `SELECT c.id AS contacto_id, c.nombre, c.etapa, c.estado,
              MAX(s.fecha) AS ultimo_seguimiento
       FROM contactos_docente c
       LEFT JOIN seguimientos s ON s.contacto_id = c.id
       WHERE c.docente_id = ?
       GROUP BY c.id
       HAVING ultimo_seguimiento IS NULL
           OR ultimo_seguimiento < datetime('now', ?)
       ORDER BY ultimo_seguimiento IS NOT NULL, ultimo_seguimiento ASC`
    )
    .all(docenteId, `-${diasSinContacto} days`);

  res.json({
    generado: new Date().toISOString(),
    dias_sin_contacto: diasSinContacto,
    totales: {
      contactos: total,
      activos,
      inactivos: total - activos,
      seguimientos: totalSeguimientos,
      sin_seguimiento: sinSeguimiento.length,
    },
    por_etapa: porEtapa,
    sin_seguimiento: sinSeguimiento,
  });
});
