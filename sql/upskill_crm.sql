CREATE DATABASE IF NOT EXISTS upskill_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE upskill_crm;

CREATE TABLE IF NOT EXISTS usuarios (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(120) NOT NULL,
 correo VARCHAR(150) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 rol ENUM('admin','docente','alumno') NOT NULL,
 es_superadmin TINYINT(1) NOT NULL DEFAULT 0,
 estado ENUM('pendiente','activo','inactivo') NOT NULL DEFAULT 'pendiente',
 especialidad VARCHAR(150) NULL,
 curso_solicitado VARCHAR(180) NULL,
 fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_usuario_rol_estado(rol,estado),
 INDEX idx_usuario_superadmin(es_superadmin)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clientes (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(150) NOT NULL,
 correo VARCHAR(150) NOT NULL UNIQUE,
 telefono VARCHAR(30) NOT NULL,
 empresa VARCHAR(150) NOT NULL,
 fecha_registro DATE NOT NULL,
 estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
 etapa_crm ENUM('Prospecto','Activo','Frecuente','Inactivo') NOT NULL DEFAULT 'Prospecto',
 INDEX idx_clientes_estado(estado), INDEX idx_clientes_etapa(etapa_crm)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS solicitudes_registro (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(150) NOT NULL,
 correo VARCHAR(150) NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 rol ENUM('docente','alumno') NOT NULL,
 telefono VARCHAR(30) NOT NULL,
 empresa VARCHAR(150) NOT NULL,
 especialidad VARCHAR(150) NULL,
 curso_solicitado VARCHAR(180) NULL,
 estado ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
 fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 fecha_resolucion DATETIME NULL,
 resuelto_por INT UNSIGNED NULL,
 INDEX idx_solicitud_estado_fecha(estado,fecha_solicitud),
 INDEX idx_solicitud_correo(correo),
 CONSTRAINT fk_solicitud_admin FOREIGN KEY(resuelto_por) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS interacciones (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 cliente_id INT UNSIGNED NOT NULL,
 tipo ENUM('llamada','correo','reunión') NOT NULL,
 descripcion TEXT NOT NULL,
 fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 responsable VARCHAR(150) NOT NULL DEFAULT 'No especificado',
 usuario_id INT UNSIGNED NOT NULL,
 INDEX idx_interacciones_cliente_fecha(cliente_id,fecha),INDEX idx_interacciones_usuario(usuario_id),
 CONSTRAINT fk_interacciones_cliente FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT fk_interacciones_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS evaluaciones (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, cliente_id INT UNSIGNED NOT NULL, usuario_id INT UNSIGNED NOT NULL,
 calificacion TINYINT UNSIGNED NOT NULL, comentario VARCHAR(500) NOT NULL, fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_evaluaciones_cliente FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT fk_evaluaciones_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO usuarios(nombre,correo,password_hash,rol,estado,es_superadmin) VALUES
('Administrador Upskill','admin@upskillacademy.com','$2y$12$xXTSdUEvJriIbfeMeAc68.RoZL7RGLllW89kyFhjDt2lU2ZQ45xBq','admin','activo',1),
('Docente Demo','docente@upskillacademy.com','$2y$12$56m/bgfzUjIwEMMl8jIC8egGcn9d1USn81C/TZA7v0SvNbjQTqJBy','docente','activo',0)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre),rol=VALUES(rol),estado=VALUES(estado),es_superadmin=VALUES(es_superadmin);

INSERT INTO clientes(id,nombre,correo,telefono,empresa,fecha_registro,estado,etapa_crm) VALUES
(1,'Juan Perez','juan.perez@example.com','4491234567','Empresa ABC','2026-08-28','activo','Activo'),
(2,'Maria Gonzalez','maria.gonzalez@example.com','449 987 6543','Tecnologias XYZ','2026-08-28','activo','Frecuente'),
(3,'Ana Garcia','ana.garcia@example.com','4495550198','Aguascalientes Tech','2026-09-01','activo','Prospecto'),
(4,'Carlos Ruiz','carlos.ruiz@example.com','449 555 2031','Innovación MX','2026-08-20','inactivo','Inactivo')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre),telefono=VALUES(telefono),estado=VALUES(estado),etapa_crm=VALUES(etapa_crm);

INSERT INTO interacciones(cliente_id,tipo,descripcion,fecha,responsable,usuario_id) VALUES
(1,'llamada','Se discutieron nuevos requerimientos para el servicio.','2026-09-04 10:30:00','Juan Pérez',1),
(1,'correo','Se envió información de seguimiento y próximos pasos.','2026-09-06 14:20:00','Juan Pérez',1),
(2,'reunión','Reunión de seguimiento con el cliente.','2026-09-02 11:00:00','María González',1),
(3,'correo','Se envió propuesta inicial.','2026-09-01 09:30:00','Ana García',1);
