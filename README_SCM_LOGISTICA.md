# Actualización SCM — usuario de logística, CRUD, trazabilidad y madurez manual

## Migración recomendada

Si tu base ya tiene los 38 cursos y la versión SCM anterior, importa en phpMyAdmin:

`sql/migracion_scm_logistica_2026_09.sql`

Si quieres volver a cargar los 38 cursos con el formato de licencias y después aplicar esta actualización, usa:

`sql/migracion_scm_logistica_cursos_completa_2026_09.sql`

> La migración completa elimina y vuelve a cargar productos, pedidos y movimientos SCM tal como hacía la migración anterior de cursos. Haz respaldo antes.

## Nuevo rol

`logistica` se agrega a `usuarios.rol`.

El administrador principal puede crearlo desde **Panel administrador > Administradores del sistema > Crear usuario de logística**.

El usuario de logística inicia sesión en el mismo formulario que el administrador:

`views/CMR/Administradores/loggin.html`

El sistema redirige automáticamente:
- `admin` → `admin.html`
- `logistica` → `views/SCM/scm.html`

El rol logística puede usar todos los endpoints SCM, pero no los endpoints CRM ni el panel administrativo.

## Cambios SCM

- Cursos y proveedores: alta, lectura, edición y baja lógica.
- Baja de curso: `estado='inactivo'`; el registro no se elimina.
- Proveedores: botón **+ Curso** abre el alta de curso con ese proveedor seleccionado.
- Inventario: no tiene CRUD; muestra el estado y abre la historia de movimientos del curso.
- Todo cambio de stock genera una entrada/salida en `movimientos_inventario`.
- Los avisos de movimiento se muestran como notificaciones visuales, no como mensajes de consola.
- Pedidos: requieren proveedor y solo pueden ser operados por admin/logística.
- Pedidos PULL: tienen una tabla dedicada con tipo y estado.
- Logística: cada curso puede cambiar PUSH/PULL desde la tabla de cursos o desde la sección Logística; la distribución alterna entre tabla y gráfica.
- Madurez: slider manual + checklist manual persistente en base de datos.
- Reportes: mantienen alternancia Tablas/Gráficas; cada conjunto de datos usa una visualización alternativa única.

## Prueba sugerida

1. Crear usuario de logística desde el superadmin.
2. Cerrar sesión e iniciar con ese usuario usando el login administrativo.
3. Confirmar que entra al SCM.
4. Intentar abrir manualmente CRM/admin: debe ser rechazado.
5. Crear un proveedor.
6. Desde ese proveedor usar **+ Curso**.
7. Registrar una salida de licencias y comprobar el toast + historial de inventario.
8. Cambiar PUSH/PULL desde la tabla de cursos.
9. Crear un pedido PULL dirigido a proveedor y revisar la tabla de pedidos PULL.
10. Marcar manualmente el checklist de Madurez y guardar progreso.
