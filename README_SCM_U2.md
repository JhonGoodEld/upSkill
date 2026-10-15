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

## Actualización escolar: cursos como productos y licencias como inventario

La versión actual adapta el SCM a UpSkill Academy:

- `productos` representa cursos.
- `stock_actual` representa licencias disponibles.
- `stock_minimo` representa el mínimo de licencias antes de considerar reposición.
- `unidad_inventario` se establece como `Licencia`.
- `precio_venta` conserva el precio al alumno.
- `costo_unitario` representa el costo simulado de una licencia para la escuela.
- Se conservan PUSH/PULL para reposición automática o manual.

Para una base ya creada, importar en phpMyAdmin:

`sql/migracion_scm_licencias_cursos_2026_09.sql`

IMPORTANTE: esta migración reemplaza los movimientos, pedidos y productos SCM de demostración para cargar los 38 cursos del catálogo proporcionado. Haz respaldo de la base antes de ejecutarla.

### Madurez SCM

La sección de madurez ahora usa una barra de progreso de 0 a 100 %. El nivel se interpreta así:

- 0–33: Inicial
- 34–66: En desarrollo
- 67–100: Optimizado

El checklist no es decorativo: consulta datos reales de productos, proveedores, movimientos, estrategias PUSH/PULL y pedidos/reportes. También calcula una sugerencia automática de avance.

### Reportes

La sección de reportes permite alternar entre `Gráficas` y `Tablas`. Se usan los mismos datos de backend en ambas vistas.

### Sesión y navegación

CRM y SCM validan nuevamente la sesión al mostrarse mediante el evento `pageshow`. Después de cerrar sesión se usa `window.location.replace('../pagPrin.html')` para regresar al inicio y reducir ciclos provocados por el historial del navegador.
