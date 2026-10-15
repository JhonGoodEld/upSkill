# Cambios SCM: imágenes, PUSH auto-surtido y catálogo público

Esta actualización se aplicó sobre `upSkillNue(3).zip`, conservando el progreso existente.

## Cambios realizados

1. **Imágenes de cursos**
   - Se mantiene `productos.imagen` como vínculo de cada curso con su archivo en `/src`.
   - Las rutas se normalizan en BD al formato `src/archivo.jpg`.
   - `Curso de Desarrollo de Apps Móviles` usa `src/android.jpg`.
   - `Curso de HTML y CSS Moderno` usa `src/html.jpg`.
   - Cursos sin imagen usan `src/primer.jpg`.
   - La tabla de Cursos del SCM incluye una nueva columna Imagen.

2. **PUSH automático**
   - Al llegar a `stock_actual <= stock_minimo`, un curso PUSH con proveedor genera el pedido automático.
   - El pedido se crea directamente como `surtido`.
   - Se agregan las licencias al stock en la misma transacción.
   - Se registra una entrada en `movimientos_inventario`, ligada al pedido.

3. **Catálogo público**
   - Nuevo endpoint: `api/cursos_publicos.php`.
   - `views/cursos.html` / `js/cursos.js` consultan MySQL en lugar del JSON.
   - El endpoint público no expone costo interno, proveedor, stock mínimo ni datos logísticos.

4. **Migración incremental**
   - Ejecutar `sql/migracion_scm_imagenes_push_catalogo_2026_10.sql` sobre `upskill_crm`.
   - La migración no borra CRM ni los cursos actuales; normaliza imágenes y surte pedidos PUSH automáticos antiguos pendientes.

## Prueba recomendada

1. Ejecutar la migración.
2. Abrir SCM > Cursos y comprobar miniaturas.
3. Abrir `views/cursos.html` y comprobar que carga los cursos desde MySQL.
4. Tomar un curso PUSH con proveedor y stock apenas por encima del mínimo.
5. Registrar una salida que lo deje en o debajo del mínimo.
6. Comprobar que aparece un pedido `automatico_push` como `surtido` y una entrada de reposición en el historial.
