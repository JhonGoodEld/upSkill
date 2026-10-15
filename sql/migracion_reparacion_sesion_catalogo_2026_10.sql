USE upskill_crm;

-- Reparación de invariantes de seguridad: cualquier superadministrador debe ser admin.
UPDATE usuarios
SET rol='admin', estado='activo', actualizado_en=NOW()
WHERE es_superadmin=1;

-- Asegurar que los cursos con baja lógica conserven sus datos y que los activos sean visibles públicamente.
-- No se reactivan cursos dados de baja: solamente se normalizan rutas vacías de imagen.
UPDATE productos
SET imagen='src/primer.jpg'
WHERE (imagen IS NULL OR TRIM(imagen)='') AND estado='activo';
