USE upskill_crm;

-- =========================================================
-- SCM - IMÁGENES, PUSH AUTO-SURTIDO Y CATÁLOGO PÚBLICO
-- Migración incremental para la versión con mayor progreso.
-- =========================================================

-- La columna imagen ya forma parte del modelo productos. Se normaliza a una
-- ruta canónica relativa a la raíz del proyecto: src/archivo.jpg.
UPDATE productos
SET imagen = CONCAT('src/', SUBSTRING_INDEX(REPLACE(imagen,'\\','/'), '/', -1))
WHERE imagen IS NOT NULL AND TRIM(imagen) <> '';

-- Dos nombres del catálogo histórico no existen físicamente en /src.
-- Se ligan a imágenes equivalentes que sí existen en el proyecto.
UPDATE productos SET imagen='src/android.jpg'
WHERE nombre='Curso de Desarrollo de Apps Móviles';

UPDATE productos SET imagen='src/html.jpg'
WHERE nombre='Curso de HTML y CSS Moderno';

-- Asegurar imagen de respaldo para cursos sin ruta.
UPDATE productos SET imagen='src/primer.jpg'
WHERE imagen IS NULL OR TRIM(imagen)='';

-- Procesar pedidos PUSH automáticos antiguos que aún hayan quedado pendientes.
-- Solo se surten una vez y se registra el movimiento de entrada.
DROP TEMPORARY TABLE IF EXISTS tmp_push_pendientes;
CREATE TEMPORARY TABLE tmp_push_pendientes AS
SELECT pe.id, pe.producto_id, pe.cantidad, pe.folio, pe.creado_por
FROM pedidos pe
JOIN productos p ON p.id=pe.producto_id
WHERE pe.origen='automatico_push'
  AND pe.estado IN ('pendiente','en_proceso')
  AND p.estado='activo';

UPDATE productos p
JOIN (
  SELECT producto_id, SUM(cantidad) cantidad_total
  FROM tmp_push_pendientes
  GROUP BY producto_id
) x ON x.producto_id=p.id
SET p.stock_actual=p.stock_actual+x.cantidad_total,
    p.actualizado_en=NOW();

INSERT INTO movimientos_inventario(producto_id,tipo,cantidad,motivo,detalle,fecha,usuario_id,pedido_id)
SELECT t.producto_id,'entrada',t.cantidad,'reposición',
       CONCAT('Entrada automática por pedido PUSH ',t.folio,' surtido durante migración.'),
       NOW(),t.creado_por,t.id
FROM tmp_push_pendientes t
WHERE NOT EXISTS (
  SELECT 1 FROM movimientos_inventario m WHERE m.pedido_id=t.id
);

UPDATE pedidos pe
JOIN tmp_push_pendientes t ON t.id=pe.id
SET pe.estado='surtido', pe.actualizado_en=NOW();

DROP TEMPORARY TABLE IF EXISTS tmp_push_pendientes;
