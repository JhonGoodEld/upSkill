USE upskill_crm;

-- =========================================================
-- ETAPA 2 SCM - USUARIO DE LOGISTICA Y PROGRESO MANUAL
-- Migración incremental para una base que ya tiene CRM + SCM.
-- =========================================================

-- 1) Nuevo rol restringido al SCM.
ALTER TABLE usuarios
  MODIFY rol ENUM('admin','logistica','docente','alumno') NOT NULL;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS actualizado_en DATETIME NULL AFTER fecha_registro;

-- 2) El checklist de madurez pasa a ser un registro MANUAL del avance.
ALTER TABLE scm_configuracion
  ADD COLUMN IF NOT EXISTS check_productos_proveedores TINYINT(1) NOT NULL DEFAULT 0 AFTER descripcion,
  ADD COLUMN IF NOT EXISTS check_inventario TINYINT(1) NOT NULL DEFAULT 0 AFTER check_productos_proveedores,
  ADD COLUMN IF NOT EXISTS check_trazabilidad TINYINT(1) NOT NULL DEFAULT 0 AFTER check_inventario,
  ADD COLUMN IF NOT EXISTS check_push_pull TINYINT(1) NOT NULL DEFAULT 0 AFTER check_trazabilidad,
  ADD COLUMN IF NOT EXISTS check_reportes TINYINT(1) NOT NULL DEFAULT 0 AFTER check_push_pull;

-- 3) Guardar la estrategia con la que nació cada pedido para no perder historial
--    si posteriormente el curso cambia de PUSH a PULL o viceversa.
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS estrategia_origen ENUM('PUSH','PULL') NULL AFTER origen;

UPDATE pedidos pe
JOIN productos p ON p.id = pe.producto_id
SET pe.estrategia_origen = p.estrategia_logistica
WHERE pe.estrategia_origen IS NULL;

-- 4) Inventario escolar basado en licencias/membresías y baja lógica del curso.
CREATE OR REPLACE VIEW inventario AS
SELECT
  p.id AS producto_id,
  p.nombre AS producto,
  p.categoria,
  p.stock_actual,
  p.stock_minimo,
  p.unidad_inventario,
  CASE
    WHEN p.stock_actual <= p.stock_minimo THEN 'Pocas licencias'
    ELSE 'Normal'
  END AS estado_stock,
  p.estrategia_logistica,
  p.proveedor_id
FROM productos p
WHERE p.estado = 'activo';

-- 5) Normalizar los cursos ya existentes al formato escolar.
UPDATE productos
SET unidad_inventario = 'Licencia'
WHERE unidad_inventario IS NULL OR unidad_inventario = '';

-- La cuenta principal conserva el rol administrativo.
UPDATE usuarios
SET rol='admin', estado='activo', es_superadmin=1
WHERE correo='admin@upskillacademy.com';
