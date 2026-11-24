SET NAMES utf8mb4;
USE upskill_crm;

-- ============================================================
-- ETAPAS 4 y 5: tienda, carrito, checkout, monedero, tickets,
-- perfil/direcciones, promociones, impuestos y controles básicos.
-- Migración acumulativa e idempotente para MariaDB/XAMPP.
-- ============================================================

-- El alumno es también un cliente del CRM. Se conserva una sola fuente de identidad.
ALTER TABLE usuarios
  MODIFY rol ENUM('admin','logistica','ventas','soporte','docente','alumno') NOT NULL DEFAULT 'alumno',
  ADD COLUMN IF NOT EXISTS cliente_id INT UNSIGNED NULL AFTER es_superadmin;

-- Vincula las cuentas de alumno que ya existen con su cliente CRM.
INSERT INTO clientes(nombre,correo,telefono,empresa,fecha_registro,estado,etapa_crm)
SELECT u.nombre,u.correo,'0000000000','Particular',CURRENT_DATE,'activo','Prospecto'
FROM usuarios u
LEFT JOIN clientes c ON c.correo=u.correo
WHERE u.rol='alumno' AND c.id IS NULL;

UPDATE usuarios u
JOIN clientes c ON c.correo=u.correo
SET u.cliente_id=c.id
WHERE u.rol='alumno' AND u.cliente_id IS NULL;

-- Direcciones de contacto/facturación (no son direcciones de envío físico).
CREATE TABLE IF NOT EXISTS cliente_direcciones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  etiqueta VARCHAR(60) NOT NULL DEFAULT 'Principal',
  calle VARCHAR(150) NOT NULL,
  numero_exterior VARCHAR(30) NOT NULL,
  numero_interior VARCHAR(30) NULL,
  colonia VARCHAR(100) NOT NULL,
  municipio VARCHAR(100) NOT NULL,
  estado VARCHAR(100) NOT NULL,
  codigo_postal VARCHAR(12) NOT NULL,
  pais VARCHAR(80) NOT NULL DEFAULT 'México',
  referencias VARCHAR(255) NULL,
  es_predeterminada TINYINT(1) NOT NULL DEFAULT 0,
  estado_registro ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizada_en DATETIME NULL,
  INDEX idx_direcciones_cliente(cliente_id,estado_registro),
  CONSTRAINT fk_direccion_cliente FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Carrito persistente por cliente.
CREATE TABLE IF NOT EXISTS carritos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL,
  estado ENUM('activo','convertido','abandonado') NOT NULL DEFAULT 'activo',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL,
  INDEX idx_carrito_cliente_estado(cliente_id,estado),
  CONSTRAINT fk_carrito_cliente FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carrito_detalle (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  carrito_id INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL,
  UNIQUE KEY uq_carrito_producto(carrito_id,producto_id),
  INDEX idx_carrito_detalle_producto(producto_id),
  CONSTRAINT fk_carrito_detalle_carrito FOREIGN KEY(carrito_id) REFERENCES carritos(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_carrito_detalle_producto FOREIGN KEY(producto_id) REFERENCES productos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Impuestos editables. El IVA inicial se establece al 16 %, no se fija en JavaScript.
CREATE TABLE IF NOT EXISTS impuestos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  porcentaje DECIMAL(5,2) NOT NULL DEFAULT 16.00,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  actualizado_por INT UNSIGNED NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_impuesto_usuario FOREIGN KEY(actualizado_por) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
INSERT INTO impuestos(id,nombre,porcentaje,estado)
VALUES(1,'IVA',16.00,'activo')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Promociones globales mediante código de descuento.
CREATE TABLE IF NOT EXISTS promociones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  descripcion VARCHAR(500) NULL,
  tipo_descuento ENUM('porcentaje','monto') NOT NULL DEFAULT 'porcentaje',
  valor DECIMAL(10,2) NOT NULL,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME NOT NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  usos_maximos INT UNSIGNED NULL,
  usos_actuales INT UNSIGNED NOT NULL DEFAULT 0,
  creado_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL,
  INDEX idx_promocion_estado_fechas(estado,fecha_inicio,fecha_fin),
  CONSTRAINT fk_promocion_usuario FOREIGN KEY(creado_por) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Configuración de alertas del monedero.
CREATE TABLE IF NOT EXISTS tienda_configuracion (
  id TINYINT UNSIGNED PRIMARY KEY,
  saldo_minimo_alerta DECIMAL(12,2) NOT NULL DEFAULT 100.00,
  actualizado_por INT UNSIGNED NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tienda_config_usuario FOREIGN KEY(actualizado_por) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
INSERT INTO tienda_configuracion(id,saldo_minimo_alerta) VALUES(1,100.00)
ON DUPLICATE KEY UPDATE id=id;

-- Monedero persistente y bitácora de cargos/recargas.
CREATE TABLE IF NOT EXISTS monederos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT UNSIGNED NOT NULL UNIQUE,
  saldo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  actualizado_en DATETIME NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_monedero_cliente FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS monedero_movimientos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  monedero_id INT UNSIGNED NOT NULL,
  tipo ENUM('recarga','compra','reembolso','ajuste') NOT NULL,
  concepto VARCHAR(255) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  saldo_resultante DECIMAL(12,2) NOT NULL,
  metodo_pago VARCHAR(30) NULL,
  referencia VARCHAR(80) NULL,
  orden_id INT UNSIGNED NULL,
  usuario_id INT UNSIGNED NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_monedero_mov_fecha(monedero_id,fecha),
  CONSTRAINT fk_monedero_mov_wallet FOREIGN KEY(monedero_id) REFERENCES monederos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_monedero_mov_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Campos adicionales para integrar compras web con las órdenes ERP existentes.
ALTER TABLE erp_ordenes
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER total,
  ADD COLUMN IF NOT EXISTS impuesto_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER subtotal,
  ADD COLUMN IF NOT EXISTS impuesto_monto DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER impuesto_porcentaje,
  ADD COLUMN IF NOT EXISTS descuento_monto DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER impuesto_monto,
  ADD COLUMN IF NOT EXISTS promocion_id INT UNSIGNED NULL AFTER descuento_monto,
  ADD COLUMN IF NOT EXISTS origen ENUM('erp','tienda') NOT NULL DEFAULT 'erp' AFTER estado,
  ADD COLUMN IF NOT EXISTS usuario_cliente_id INT UNSIGNED NULL AFTER usuario_id,
  ADD COLUMN IF NOT EXISTS direccion_id INT UNSIGNED NULL AFTER usuario_cliente_id,
  ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(30) NULL AFTER direccion_id,
  ADD COLUMN IF NOT EXISTS pago_estado VARCHAR(40) NULL AFTER metodo_pago,
  ADD COLUMN IF NOT EXISTS correo_recibo_estado VARCHAR(30) NULL AFTER pago_estado;

-- Llaves foráneas opcionales añadidas de forma segura una sola vez.
SET @fk_orden_usuario_cliente := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='erp_ordenes' AND CONSTRAINT_NAME='fk_erp_orden_usuario_cliente'
);
SET @sql_fk := IF(@fk_orden_usuario_cliente=0,
  'ALTER TABLE erp_ordenes ADD CONSTRAINT fk_erp_orden_usuario_cliente FOREIGN KEY(usuario_cliente_id) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt_fk FROM @sql_fk; EXECUTE stmt_fk; DEALLOCATE PREPARE stmt_fk;

SET @fk_orden_direccion := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='erp_ordenes' AND CONSTRAINT_NAME='fk_erp_orden_direccion'
);
SET @sql_fk := IF(@fk_orden_direccion=0,
  'ALTER TABLE erp_ordenes ADD CONSTRAINT fk_erp_orden_direccion FOREIGN KEY(direccion_id) REFERENCES cliente_direcciones(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt_fk FROM @sql_fk; EXECUTE stmt_fk; DEALLOCATE PREPARE stmt_fk;

SET @fk_orden_promocion := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='erp_ordenes' AND CONSTRAINT_NAME='fk_erp_orden_promocion'
);
SET @sql_fk := IF(@fk_orden_promocion=0,
  'ALTER TABLE erp_ordenes ADD CONSTRAINT fk_erp_orden_promocion FOREIGN KEY(promocion_id) REFERENCES promociones(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt_fk FROM @sql_fk; EXECUTE stmt_fk; DEALLOCATE PREPARE stmt_fk;

-- Relación de la cuenta de alumno con el cliente CRM.
SET @fk_usuario_cliente := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='usuarios' AND CONSTRAINT_NAME='fk_usuario_cliente'
);
SET @sql_fk := IF(@fk_usuario_cliente=0,
  'ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_cliente FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt_fk FROM @sql_fk; EXECUTE stmt_fk; DEALLOCATE PREPARE stmt_fk;

-- Un pago por orden (los métodos externos son simulados; monedero sí actualiza saldo real local).
CREATE TABLE IF NOT EXISTS tienda_pagos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orden_id INT UNSIGNED NOT NULL UNIQUE,
  monto DECIMAL(12,2) NOT NULL,
  metodo_pago ENUM('monedero','tarjeta','paypal','transferencia') NOT NULL,
  estado ENUM('aprobado','aprobado_simulado','rechazado','pendiente') NOT NULL,
  referencia VARCHAR(100) NOT NULL,
  detalles_json TEXT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tienda_pago_orden FOREIGN KEY(orden_id) REFERENCES erp_ordenes(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Atención al cliente. Los tickets se conservan y no tienen endpoint de eliminación.
CREATE TABLE IF NOT EXISTS tickets_atencion (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folio VARCHAR(24) NOT NULL UNIQUE,
  cliente_id INT UNSIGNED NOT NULL,
  orden_id INT UNSIGNED NULL,
  asunto VARCHAR(160) NOT NULL,
  mensaje TEXT NOT NULL,
  estado ENUM('nuevo','en_proceso','respondido','cerrado') NOT NULL DEFAULT 'nuevo',
  respuesta TEXT NULL,
  respondido_por INT UNSIGNED NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NULL,
  INDEX idx_ticket_cliente_fecha(cliente_id,fecha),
  INDEX idx_ticket_estado_fecha(estado,fecha),
  CONSTRAINT fk_ticket_cliente FOREIGN KEY(cliente_id) REFERENCES clientes(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_orden FOREIGN KEY(orden_id) REFERENCES erp_ordenes(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_responsable FOREIGN KEY(respondido_por) REFERENCES usuarios(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Recuperación simulada de contraseña: código de un solo uso, almacenado como hash.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expira_en DATETIME NOT NULL,
  usado_en DATETIME NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reset_usuario_expira(usuario_id,expira_en),
  CONSTRAINT fk_reset_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Limitación de intentos de autenticación (5 fallos por ventana de 15 minutos).
CREATE TABLE IF NOT EXISTS login_intentos (
  clave CHAR(64) PRIMARY KEY,
  intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ventana_inicio DATETIME NOT NULL,
  bloqueado_hasta DATETIME NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Crea un monedero para cada cliente que ya tenga cuenta de alumno.
INSERT INTO monederos(cliente_id,saldo)
SELECT c.id,0.00 FROM clientes c
JOIN usuarios u ON u.cliente_id=c.id AND u.rol='alumno'
LEFT JOIN monederos m ON m.cliente_id=c.id
WHERE m.id IS NULL;

-- Actualiza la vista empresarial sin duplicar inventario/productos.
CREATE OR REPLACE VIEW erp_reporte_resumen AS
SELECT
  (SELECT COUNT(*) FROM clientes WHERE estado='activo') AS clientes_activos,
  (SELECT COUNT(*) FROM erp_ordenes) AS ordenes_totales,
  (SELECT COUNT(*) FROM erp_ordenes WHERE estado='procesada') AS ordenes_procesadas,
  (SELECT COALESCE(SUM(total),0) FROM erp_ordenes WHERE estado='procesada') AS ventas_totales,
  (SELECT COALESCE(SUM(d.cantidad),0) FROM erp_orden_detalle d JOIN erp_ordenes o ON o.id=d.orden_id WHERE o.estado='procesada') AS productos_vendidos,
  (SELECT COALESCE(SUM(stock_actual),0) FROM productos WHERE estado='activo') AS inventario_disponible;

-- NOTA: no se insertan credenciales SMTP, secretos ni números reales de pago.

-- Estados de seguimiento para pedidos digitales y devoluciones simuladas.
ALTER TABLE erp_ordenes
  MODIFY estado ENUM('pendiente','procesando','procesada','cancelada','en_revision','entregada','reembolsada') NOT NULL DEFAULT 'pendiente';
ALTER TABLE movimientos_inventario
  ADD COLUMN IF NOT EXISTS orden_erp_id INT UNSIGNED NULL AFTER pedido_id;
ALTER TABLE tienda_pagos
  MODIFY estado ENUM('aprobado','aprobado_simulado','rechazado','pendiente','reembolsado','reembolsado_simulado') NOT NULL;

-- Integridad referencial para los movimientos del monedero y movimientos SCM vinculados a ERP.
SET @fk_wallet_order := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='monedero_movimientos' AND CONSTRAINT_NAME='fk_monedero_mov_orden'
);
SET @sql_fk := IF(@fk_wallet_order=0,
  'ALTER TABLE monedero_movimientos ADD CONSTRAINT fk_monedero_mov_orden FOREIGN KEY(orden_id) REFERENCES erp_ordenes(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt_fk FROM @sql_fk; EXECUTE stmt_fk; DEALLOCATE PREPARE stmt_fk;

SET @fk_mov_orden := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='movimientos_inventario' AND CONSTRAINT_NAME='fk_mov_orden_erp'
);
SET @sql_fk := IF(@fk_mov_orden=0,
  'ALTER TABLE movimientos_inventario ADD CONSTRAINT fk_mov_orden_erp FOREIGN KEY(orden_erp_id) REFERENCES erp_ordenes(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt_fk FROM @sql_fk; EXECUTE stmt_fk; DEALLOCATE PREPARE stmt_fk;

ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS intentos TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER token_hash;
