import express from 'express';
import cors from 'cors';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import clientesRoutes from './routes/clientes.js';
import interaccionesRoutes from './routes/interacciones.js';
import metricasRoutes from './routes/metricas.js';
import docenteRoutes from './routes/docente.js';

export function crearApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'CRM upSkill', ts: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/clientes', clientesRoutes);
  app.use('/api/interacciones', interaccionesRoutes);
  app.use('/api/metricas', metricasRoutes);
  app.use('/api/docente', docenteRoutes);

  // Sirve el front-end estático del proyecto (raíz del repo) para desarrollo.
  // Así http://localhost:3000/ abre la página principal (index.html -> views/pagPrin.html)
  // y http://localhost:3000/views/crm.html abre el CRM, sin otro servidor.
  const raizRepo = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
  app.use(express.static(raizRepo));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
  app.use(errorHandler);

  return app;
}
