# Actualización: administrador principal y solicitudes de registro

## 1. Base de datos existente
Si ya existe la base `upskill_crm`, no vuelvas a importar toda la base. En phpMyAdmin selecciona `upskill_crm` y ejecuta/importa:

`sql/migracion_crm_2026_09.sql`

La migración:
- agrega `usuarios.es_superadmin`;
- marca `admin@upskillacademy.com` como administrador principal;
- crea `solicitudes_registro`;
- migra solicitudes antiguas que estuvieran como usuarios pendientes;
- conserva los cambios previos de roles y responsable de interacciones.

Después de migrar, cierra sesión e inicia sesión de nuevo para que la sesión PHP contenga `es_superadmin`.

## 2. Flujo de registro
`views/registro.html` y `views/regdocentes.html` ya no crean directamente una cuenta utilizable.

1. El formulario envía los datos a `api/registro.php`.
2. La solicitud se almacena en `solicitudes_registro` con estado `pendiente`.
3. El administrador la ve en `Solicitudes de registro pendientes`.
4. Si la rechaza, queda como `rechazada` y no se crea usuario ni cliente.
5. Si la aprueba, dentro de una transacción se crea:
   - un registro `usuarios` con estado `activo` y rol alumno/docente;
   - un registro `clientes` con estado `activo` y etapa CRM `Prospecto`.
6. Desde ese momento la persona puede iniciar sesión y también aparece en el CRM del administrador.

## 3. Administrador principal
La cuenta principal sigue siendo:
- Correo: `admin@upskillacademy.com`
- Contraseña: `Admin123!`

Solo esta cuenta puede ver el apartado `Administradores del sistema`, crear administradores nuevos y activar/desactivar administradores normales.

La cuenta principal no puede ser desactivada mediante la API.

## 4. Docente de prueba
- Correo: `docente@upskillacademy.com`
- Contraseña: `Docente123!`

## 5. Formularios
Los registros de alumno y docente ahora piden teléfono porque el registro aprobado también debe crearse como cliente del CRM. Formatos aceptados:
- `4492255316`
- `449 225 5316`

`Empresa o institución` es opcional. Si se deja vacío se utiliza `Particular` para alumno y `Upskill Academy - Docente` para docente.
