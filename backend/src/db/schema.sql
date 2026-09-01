-- Esquema del CRM (Etapa 1)
-- Admin CRM: usuarios, clientes, interacciones, evaluaciones
-- Docente CRM (aislado por docente): contactos_docente, seguimientos

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre         TEXT    NOT NULL,
  correo         TEXT    NOT NULL UNIQUE,
  password_hash  TEXT    NOT NULL,
  rol            TEXT    NOT NULL DEFAULT 'alumno' CHECK (rol IN ('admin', 'docente', 'alumno')),
  fecha_registro TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ===================== ADMIN CRM =====================

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

-- ===================== DOCENTE CRM =====================
-- Cada docente gestiona su propio pipeline: del prospecto de inscripción
-- al alumno graduado. Los datos quedan aislados por docente_id.

CREATE TABLE IF NOT EXISTS contactos_docente (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  docente_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre         TEXT    NOT NULL,
  correo         TEXT    NOT NULL,
  telefono       TEXT,
  curso          TEXT,
  estado         TEXT    NOT NULL DEFAULT 'activo'     CHECK (estado IN ('activo', 'inactivo')),
  etapa          TEXT    NOT NULL DEFAULT 'Prospecto'  CHECK (etapa IN ('Prospecto', 'Inscrito', 'Al dia', 'En riesgo', 'Graduado')),
  fecha_registro TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (docente_id, correo)
);

CREATE TABLE IF NOT EXISTS seguimientos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  contacto_id INTEGER NOT NULL REFERENCES contactos_docente(id) ON DELETE CASCADE,
  docente_id  INTEGER NOT NULL REFERENCES usuarios(id),
  tipo        TEXT    NOT NULL CHECK (tipo IN ('mensaje', 'tutoria', 'llamada', 'correo', 'reunion')),
  descripcion TEXT    NOT NULL,
  fecha       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ===================== ÍNDICES =====================

CREATE INDEX IF NOT EXISTS idx_interacciones_cliente ON interacciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_usuario ON interacciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_clientes_estado       ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_etapa        ON clientes(etapa_crm);
CREATE INDEX IF NOT EXISTS idx_contactos_docente     ON contactos_docente(docente_id);
CREATE INDEX IF NOT EXISTS idx_contactos_etapa       ON contactos_docente(etapa);
CREATE INDEX IF NOT EXISTS idx_seguimientos_contacto ON seguimientos(contacto_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_docente  ON seguimientos(docente_id);
