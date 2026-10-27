USE upskill_crm;

-- =========================================================
-- ETAPA 3 - ERP (Semanas 7-9)
-- Integra CRM + SCM sin duplicar clientes, productos ni inventario.
-- =========================================================

ALTER TABLE usuarios
  MODIFY rol ENUM('admin','logistica','ventas','docente','alumno') NOT NULL;

CREATE TABLE IF NOT EXISTS erp_ordenes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folio VARCHAR(32) NOT NULL UNIQUE,
  cliente_id INT UNSIGNED NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('pendiente','procesando','procesada','cancelada') NOT NULL DEFAULT 'pendiente',
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  usuario_id INT UNSIGNED NOT NULL,
  actualizado_en DATETIME NULL,
  INDEX idx_erp_orden_cliente(cliente_id),
  INDEX idx_erp_orden_estado(estado),
  INDEX idx_erp_orden_fecha(fecha),
  CONSTRAINT fk_erp_orden_cliente FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_erp_orden_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS erp_orden_detalle (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orden_id INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  INDEX idx_erp_detalle_orden(orden_id),
  INDEX idx_erp_detalle_producto(producto_id),
  CONSTRAINT fk_erp_detalle_orden FOREIGN KEY(orden_id) REFERENCES erp_ordenes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_erp_detalle_producto FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS erp_orden_historial (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orden_id INT UNSIGNED NOT NULL,
  estado VARCHAR(40) NOT NULL,
  descripcion VARCHAR(500) NOT NULL,
  usuario_id INT UNSIGNED NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_erp_historial_orden_fecha(orden_id,fecha),
  CONSTRAINT fk_erp_historial_orden FOREIGN KEY(orden_id) REFERENCES erp_ordenes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_erp_historial_usuario FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS erp_configuracion (
  id TINYINT UNSIGNED PRIMARY KEY,
  nivel ENUM('Básico','Integrado','Automatizado','Optimizado') NOT NULL DEFAULT 'Básico',
  porcentaje TINYINT UNSIGNED NOT NULL DEFAULT 0,
  checklist_json TEXT NULL,
  actualizado_por INT UNSIGNED NULL,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_erp_config_usuario FOREIGN KEY(actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO erp_configuracion(id,nivel,porcentaje,checklist_json)
VALUES(1,'Básico',0,'[]')
ON DUPLICATE KEY UPDATE id=id;

-- Trazabilidad: cada salida generada por una venta ERP puede apuntar a su orden.
ALTER TABLE movimientos_inventario
  ADD COLUMN IF NOT EXISTS orden_erp_id INT UNSIGNED NULL AFTER pedido_id;

-- Recursos ERP integrados sin duplicar la información del SCM.
CREATE OR REPLACE VIEW erp_recursos AS
SELECT p.id producto_id,p.nombre,p.categoria,p.stock_actual,p.stock_minimo,
       p.precio_venta,p.estrategia_logistica,p.estado,pr.nombre proveedor
FROM productos p
LEFT JOIN proveedores pr ON pr.id=p.proveedor_id;

-- Resumen empresarial calculado directamente desde CRM + SCM + ERP.
CREATE OR REPLACE VIEW erp_reporte_resumen AS
SELECT
  (SELECT COUNT(*) FROM clientes WHERE estado='activo') AS clientes_activos,
  (SELECT COUNT(*) FROM erp_ordenes) AS ordenes_totales,
  (SELECT COUNT(*) FROM erp_ordenes WHERE estado='procesada') AS ordenes_procesadas,
  (SELECT COALESCE(SUM(total),0) FROM erp_ordenes WHERE estado='procesada') AS ventas_totales,
  (SELECT COALESCE(SUM(d.cantidad),0) FROM erp_orden_detalle d JOIN erp_ordenes o ON o.id=d.orden_id WHERE o.estado='procesada') AS productos_vendidos,
  (SELECT COALESCE(SUM(stock_actual),0) FROM productos WHERE estado='activo') AS inventario_disponible;
