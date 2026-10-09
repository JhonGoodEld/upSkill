# Corrección de solicitudes pendientes

Se separó la carga del backend administrativo del archivo `js/admin.js` legado. Esto evita que un error en módulos antiguos del panel (cursos, gráficas, modales, mocks) impida ejecutar la carga de solicitudes.

Cambios:
- Nuevo `js/admin-backend.js` para solicitudes y superadministradores.
- `admin.html` corregido para evitar etiquetas `<body>` duplicadas y cargar scripts en orden estable.
- `js/admin.js` conserva funciones antiguas, pero ya no contiene el backend de solicitudes.
- Nuevo `api/diagnostico_solicitudes.php` para comprobar tabla y cantidad de solicitudes pendientes.
- En caso de error, la tabla ahora muestra el mensaje del backend en lugar de quedar vacía o en “Cargando”.
