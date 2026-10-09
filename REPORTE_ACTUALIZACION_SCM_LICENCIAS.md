# Actualización SCM - modelo educativo con licencias

## Cambios aplicados

1. Cursos sustituyen los productos de demostración del SCM.
2. Se añadieron campos académicos a `productos`: nivel, duración, valoración, inscritos, tags, descuento, fecha de publicación, imagen y precio de venta.
3. El inventario se interpreta como licencias disponibles por curso.
4. Se cargan 38 cursos del catálogo previo.
5. Madurez SCM usa slider 0-100 y tres niveles visuales.
6. Checklist SCM se calcula con información real de la base de datos.
7. Reportes alternan entre gráficas y tablas.
8. CRM y SCM redirigen al inicio tras cerrar sesión y revalidan la sesión al volver mediante el historial.

## Migración requerida

Ejecutar `sql/migracion_scm_licencias_cursos_2026_09.sql` sobre `upskill_crm` después de realizar un respaldo.

## Advertencia

La migración elimina los movimientos, pedidos y productos SCM existentes para reemplazar el catálogo de demostración por los 38 cursos. No elimina clientes, usuarios, interacciones ni datos CRM.
