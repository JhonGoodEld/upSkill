import db from '../db/index.js';
import { wrap } from '../middleware/errorHandler.js';

// GET /api/metricas
// Indicadores simples para el dashboard del CRM.
export const resumen = wrap(async (req, res) => {
  const diasSinContacto = Number(req.query.dias) > 0 ? Number(req.query.dias) : 30;

  const totalClientes = db.prepare('SELECT COUNT(*) AS n FROM clientes').get().n;
  const activos = db.prepare("SELECT COUNT(*) AS n FROM clientes WHERE estado = 'activo'").get().n;
  const inactivos = totalClientes - activos;
  const totalInteracciones = db.prepare('SELECT COUNT(*) AS n FROM interacciones').get().n;

  const interaccionesPorCliente = db
    .prepare(
      `SELECT c.id AS cliente_id, c.nombre, c.etapa_crm, c.estado,
              COUNT(i.id) AS interacciones,
              MAX(i.fecha) AS ultima_interaccion
       FROM clientes c
       LEFT JOIN interacciones i ON i.cliente_id = c.id
       GROUP BY c.id
       ORDER BY interacciones DESC`
    )
    .all();

  // Clientes sin interacción reciente (nunca, o hace más de N días).
  const enRiesgo = db
    .prepare(
      `SELECT c.id AS cliente_id, c.nombre, c.etapa_crm, c.estado,
              MAX(i.fecha) AS ultima_interaccion
       FROM clientes c
       LEFT JOIN interacciones i ON i.cliente_id = c.id
       GROUP BY c.id
       HAVING ultima_interaccion IS NULL
           OR ultima_interaccion < datetime('now', ?)
       ORDER BY ultima_interaccion IS NOT NULL, ultima_interaccion ASC`
    )
    .all(`-${diasSinContacto} days`);

  const porEtapa = db
    .prepare('SELECT etapa_crm, COUNT(*) AS n FROM clientes GROUP BY etapa_crm')
    .all();

  res.json({
    generado: new Date().toISOString(),
    dias_sin_contacto: diasSinContacto,
    totales: {
      clientes: totalClientes,
      activos,
      inactivos,
      interacciones: totalInteracciones,
      clientes_en_riesgo: enRiesgo.length,
    },
    por_etapa: porEtapa,
    interacciones_por_cliente: interaccionesPorCliente,
    clientes_en_riesgo: enRiesgo,
  });
});
