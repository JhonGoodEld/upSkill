-- Esquema mínimo del CRM (Etapa 1)
-- 4 entidades: usuarios, clientes, interacciones, evaluaciones

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre         TEXT    NOT NULL,
  correo         TEXT    NOT NULL UNIQUE,
  password_hash  TEXT    NOT NULL,
  rol            TEXT    NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
  fecha_registro TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre         TEXT    NOT NULL,
  correo         TEXT    NOT NULL UNIQUE,
  telefono       TEXT,
  empresa        TEXT,
  fecha_registro TEXT    NOT NULL DEFAULT (datetime('now')),
  estado         TEXT    NOT NULL DEFAULT 'activo'    CHECK (estado IN ('activo', 'inactivo')),
  etapa_crm      TEXT    NOT NULL DEFAULT 'Prospecto' CHECK (etapa_crm IN ('Prospecto', 'Activo', 'Frecuente', 'Inactivo'))
);

CREATE TABLE IF NOT EXISTS interacciones (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id  INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo        TEXT    NOT NULL CHECK (tipo IN ('llamada', 'correo', 'reunion')),
  descripcion TEXT    NOT NULL,
  fecha       TEXT    NOT NULL DEFAULT (datetime('now')),
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS evaluaciones (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  puntaje    INTEGER NOT NULL CHECK (puntaje BETWEEN 1 AND 5),
  comentario TEXT,
  fecha      TEXT    NOT NULL DEFAULT (datetime('now')),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_interacciones_cliente ON interacciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_usuario ON interacciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_clientes_estado       ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_etapa        ON clientes(etapa_crm);
