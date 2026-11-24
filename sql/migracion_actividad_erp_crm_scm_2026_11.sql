SET NAMES utf8mb4;
USE upskill_crm;

-- La columna ya se crea en migracion_erp_2026_10.sql. Este bloque también
-- permite actualizar instalaciones que tengan una versión anterior.
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimientos_inventario'
    AND COLUMN_NAME = 'orden_erp_id'
);
SET @ddl = IF(@col_exists = 0,
  'ALTER TABLE movimientos_inventario ADD COLUMN orden_erp_id INT UNSIGNED NULL AFTER pedido_id',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Índice de movimientos vinculados a órdenes ERP.
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'movimientos_inventario'
    AND INDEX_NAME = 'idx_mov_orden_erp'
);
SET @ddl = IF(@idx_exists = 0,
  'CREATE INDEX idx_mov_orden_erp ON movimientos_inventario (orden_erp_id, fecha)',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Índices para cargar los historiales por usuario y periodo.
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'erp_orden_historial'
    AND INDEX_NAME = 'idx_erp_hist_usuario_fecha'
);
SET @ddl = IF(@idx_exists = 0,
  'CREATE INDEX idx_erp_hist_usuario_fecha ON erp_orden_historial (usuario_id, fecha)',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'interacciones'
    AND INDEX_NAME = 'idx_interacciones_usuario_fecha'
);
SET @ddl = IF(@idx_exists = 0,
  'CREATE INDEX idx_interacciones_usuario_fecha ON interacciones (usuario_id, fecha)',
  'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
