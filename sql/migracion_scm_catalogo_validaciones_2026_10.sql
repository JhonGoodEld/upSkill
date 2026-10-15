USE upskill_crm;

-- 1) Eliminar el dato de inscritos históricos, ya no forma parte del modelo actual.
SET @has_inscritos := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'inscritos'
);
SET @sql := IF(@has_inscritos > 0, 'ALTER TABLE productos DROP COLUMN inscritos', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Asegurar capacidad suficiente para rutas de imágenes, incluidas las cargas.
ALTER TABLE productos MODIFY imagen VARCHAR(500) NULL;

-- 3) Normalizar campos requeridos existentes.
UPDATE productos SET nivel='Por definir' WHERE nivel IS NULL OR TRIM(nivel)='';
UPDATE productos SET duracion='Por definir' WHERE duracion IS NULL OR TRIM(duracion)='';
UPDATE productos SET fecha_publicacion=DATE(fecha_registro) WHERE fecha_publicacion IS NULL;
UPDATE productos SET descuento=0 WHERE descuento IS NULL;

-- Si hubiera cursos antiguos sin proveedor, se crea un proveedor de transición para no romper relaciones.
INSERT INTO proveedores(nombre,contacto,correo,telefono,direccion,estado)
SELECT 'Proveedor académico general','Administración Upskill','proveedor.general@upskill.local','4490000000','Aguascalientes, México','activo'
WHERE EXISTS (SELECT 1 FROM productos WHERE proveedor_id IS NULL)
  AND NOT EXISTS (SELECT 1 FROM proveedores WHERE correo='proveedor.general@upskill.local');

UPDATE productos p
JOIN proveedores pr ON pr.correo='proveedor.general@upskill.local'
SET p.proveedor_id=pr.id
WHERE p.proveedor_id IS NULL;

-- Normalizar direcciones viejas de proveedor antes de requerirlas desde la aplicación.
UPDATE proveedores SET direccion='Dirección pendiente de actualización' WHERE direccion IS NULL OR TRIM(direccion)='';

-- 4) Mantener imágenes existentes; si están vacías, usar imagen de respaldo.
UPDATE productos SET imagen='src/primer.jpg' WHERE imagen IS NULL OR TRIM(imagen)='';

-- La obligatoriedad de nivel, duración, fecha, descuento, proveedor y dirección
-- se valida en frontend y backend para no romper esquemas previos con FK ON DELETE SET NULL.
