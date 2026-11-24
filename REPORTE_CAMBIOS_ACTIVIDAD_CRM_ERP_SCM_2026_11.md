# Actualización: actividad CRM + ERP + SCM

## Cambios incluidos

- La sección **Mi actividad** del CRM ahora funciona como bitácora global para cualquier usuario con rol `admin`.
- Los administradores pueden filtrar por mes y por usuario; el selector incluye cuentas `admin` y `ventas`.
- La bitácora reúne interacciones CRM, eventos del historial de órdenes ERP y movimientos de inventario SCM vinculados a órdenes ERP.
- El ERP incorpora **Mi actividad** para los roles `admin` y `ventas`. El endpoint siempre filtra por el ID de la sesión, por lo que Ventas no puede consultar la actividad de otra cuenta manipulando parámetros.
- Los movimientos de inventario que se originan por una orden ERP muestran su origen y folio en SCM → Movimientos.
- Las reposiciones PUSH disparadas por una venta ERP conservan también el vínculo `orden_erp_id`, de modo que tanto la salida como la entrada automática se puedan rastrear desde la orden.

## Base de datos

No se crea una tabla de actividad paralela. Se reutilizan:

- `interacciones` para la actividad CRM.
- `erp_orden_historial` para creación, procesamiento, cancelación y reapertura de órdenes.
- `movimientos_inventario` para las salidas de venta y reposiciones PUSH vinculadas a ERP.

Ejecutar `sql/migracion_actividad_erp_crm_scm_2026_11.sql` en phpMyAdmin sobre `upskill_crm`. La migración asegura `movimientos_inventario.orden_erp_id` y agrega índices para las consultas de actividad.

## Archivos relevantes

- `api/actividad_feed.php`
- `api/actividad.php`
- `api/erp_actividad.php`
- `api/erp_procesar.php`
- `api/scm_helpers.php`
- `api/scm_movimientos.php`
- `views/CMR/crm.html`, `js/crm.js`, `css/crm.css`
- `views/ERP/erp.html`, `js/erp.js`, `css/erp.css`
- `views/SCM/scm.html`, `js/scm.js`

## Pruebas recomendadas

1. Iniciar sesión como administrador A, registrar una interacción CRM.
2. Iniciar sesión como administrador B y comprobar que aparece la actividad de A.
3. En CRM, filtrar por administrador A, por administrador B y por un usuario Ventas.
4. Iniciar sesión como Ventas, crear y procesar una orden; abrir ERP → Mi actividad y comprobar que solo aparecen acciones de esa cuenta.
5. Procesar una orden que reduzca un curso PUSH al mínimo. Verificar que aparecen la salida por venta y la entrada por reposición, ambas con el mismo folio ERP.
6. Entrar como administrador o Logística a SCM → Movimientos y comprobar que se muestran origen ERP, folio, detalle y usuario.
7. Probar `api/erp_actividad.php?usuario_id=<otro_id>` con sesión de Ventas: el endpoint ignora cualquier filtro externo y sigue devolviendo únicamente el ID de la sesión.
