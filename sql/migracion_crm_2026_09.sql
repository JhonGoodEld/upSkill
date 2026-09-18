USE upskill_crm;
-- Migración acumulativa para una base upskill_crm creada con versiones anteriores.

ALTER TABLE usuarios MODIFY rol ENUM('admin','usuario','docente','alumno') NOT NULL;
UPDATE usuarios SET rol='docente' WHERE rol='usuario';
ALTER TABLE usuarios MODIFY rol ENUM('admin','docente','alumno') NOT NULL;
ALTER TABLE usuarios MODIFY estado ENUM('pendiente','activo','inactivo') NOT NULL DEFAULT 'pendiente';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_superadmin TINYINT(1) NOT NULL DEFAULT 0 AFTER rol;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS especialidad VARCHAR(150) NULL AFTER estado;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS curso_solicitado VARCHAR(180) NULL AFTER especialidad;
UPDATE usuarios SET rol='docente' WHERE correo='docente@upskillacademy.com';
UPDATE usuarios SET es_superadmin=1,rol='admin',estado='activo' WHERE correo='admin@upskillacademy.com';

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

-- Si había solicitudes antiguas guardadas como usuarios pendientes, se trasladan a la nueva bandeja.
INSERT INTO solicitudes_registro(nombre,correo,password_hash,rol,telefono,empresa,especialidad,curso_solicitado,estado,fecha_solicitud)
SELECT u.nombre,u.correo,u.password_hash,u.rol,'0000000000',
       CASE WHEN u.rol='docente' THEN 'Upskill Academy - Docente' ELSE 'Particular' END,
       u.especialidad,u.curso_solicitado,'pendiente',u.fecha_registro
FROM usuarios u
WHERE u.estado='pendiente' AND u.rol IN ('docente','alumno')
  AND NOT EXISTS (SELECT 1 FROM solicitudes_registro s WHERE s.correo=u.correo AND s.estado='pendiente');
DELETE FROM usuarios WHERE estado='pendiente' AND rol IN ('docente','alumno');

ALTER TABLE interacciones ADD COLUMN IF NOT EXISTS responsable VARCHAR(150) NOT NULL DEFAULT 'No especificado' AFTER fecha;
UPDATE interacciones i JOIN clientes c ON c.id=i.cliente_id SET i.responsable=c.nombre WHERE i.responsable='No especificado' OR i.responsable='';
