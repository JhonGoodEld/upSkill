SET NAMES utf8mb4;
USE upskill_crm;

-- ============================================================
-- Correos de registro y código de bienvenida de un solo uso
-- Importar DESPUÉS de migracion_etapa4_5_tienda_seguridad_2026_11.sql
-- ============================================================

-- Códigos personales: si cliente_id tiene valor, la promoción solo la puede
-- usar ese cliente y no aparece en la lista pública del catálogo.
ALTER TABLE promociones
  ADD COLUMN IF NOT EXISTS cliente_id INT UNSIGNED NULL AFTER usos_actuales;

ALTER TABLE promociones
  ADD INDEX IF NOT EXISTS idx_promocion_cliente (cliente_id);
