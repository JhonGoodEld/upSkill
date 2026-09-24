# Etapa 2 – SCM (Semanas 4–6)

Esta versión añade un módulo SCM sobre la base `upskill_crm` existente.

## Instalación

1. Respaldar la base actual en phpMyAdmin.
2. Seleccionar `upskill_crm`.
3. Importar `sql/migracion_scm_2026_09.sql`.
4. Abrir `http://localhost/upSkillNue/views/SCM/scm.html` con una sesión de administrador activa.
5. También se puede entrar desde el botón **SCM** agregado al menú del CRM.

## Objetos de BD añadidos

- `proveedores`
- `productos`
- `movimientos_inventario`
- `pedidos`
- `scm_configuracion`
- vista `inventario`

La vista `inventario` se deriva de `productos` porque el documento define `stock_actual` y `stock_minimo` dentro del Modelo Producto. Así se evita guardar el mismo stock en dos tablas distintas.

## APIs SCM

- `api/scm_productos.php`
- `api/scm_proveedores.php`
- `api/scm_inventario.php`
- `api/scm_movimientos.php`
- `api/scm_estrategia.php`
- `api/scm_pedidos.php`
- `api/scm_estado.php`
- `api/scm_reportes.php`
- `api/scm_helpers.php`

## Regla PUSH implementada

El documento exige generar un pedido automático al alcanzar el stock mínimo, pero no fija la cantidad de reposición. Esta implementación repone hasta `2 × stock_minimo`, evitando además crear otro pedido automático si ya existe uno pendiente o en proceso para el producto.

## Pedido surtido

- Reposición surtida: genera una entrada de inventario.
- Venta surtida: genera una salida de inventario.
- El movimiento queda ligado al pedido y al administrador responsable.

## Seguridad

Las APIs SCM requieren sesión con rol `admin` mediante `require_role('admin')`.
