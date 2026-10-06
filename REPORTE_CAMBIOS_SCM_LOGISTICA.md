# Reporte de cambios — SCM Logística

- Se agregó el rol `logistica` a la base de datos.
- Se creó `api/usuarios_logistica.php` protegido con `require_superadmin()`.
- El login administrativo acepta admin y logística y redirige según el rol.
- Los endpoints SCM aceptan `admin` y `logistica`; CRM/panel siguen restringidos a `admin`.
- Panel de superadmin: alta, edición, activación y desactivación de usuarios de logística.
- Cursos y proveedores cuentan con operaciones CRUD visibles; la baja de cursos/proveedores es lógica.
- El alta de proveedor permite abrir directamente el alta de un curso asociado.
- Los cambios de inventario quedan registrados como movimientos incluso cuando el stock cambia desde la edición de un curso.
- Se reemplazaron avisos de inventario/pedidos por notificaciones visuales SCM.
- Inventario muestra Normal/Pocas licencias y una vista de historial por curso.
- Pedidos exigen proveedor; se registra la estrategia de origen y existe tabla dedicada para PULL.
- La sección Logística permite cambiar estrategia por registro y alternar tabla/gráfica.
- El checklist de Madurez dejó de autocompletarse: ahora es manual y se persiste en `scm_configuracion`.
- Reportes mantienen tablas y una visualización gráfica alternativa por conjunto de datos.
- Se incluye migración incremental y migración acumulativa con los 38 cursos del catálogo escolar.
