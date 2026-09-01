// Error de aplicación con código HTTP explícito.
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Middleware final: convierte cualquier error en una respuesta JSON coherente.
export function errorHandler(err, req, res, _next) {
  // Violaciones de restricciones de SQLite (UNIQUE, CHECK, FK...)
  if (err?.code === 'ERR_SQLITE_ERROR' || /SQLITE_CONSTRAINT/.test(err?.message || '')) {
    return res.status(409).json({ error: 'Conflicto de datos', detalle: err.message });
  }

  const status = err.status || 500;
  if (status === 500) console.error(err);

  res.status(status).json({ error: err.message || 'Error interno del servidor' });
}

// Envuelve controladores async para no repetir try/catch.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
