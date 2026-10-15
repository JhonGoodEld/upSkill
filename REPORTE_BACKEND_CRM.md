# Reporte de implementación – Backend CRM

## Base de referencia
La implementación se realizó tomando como requisito principal la Etapa 1 – CRM del documento de distribución por etapas. El documento solicita integrar front-end y back-end, incluyendo API REST, lógica de negocio, persistencia, validaciones y seguridad básica; además define como entidades mínimas Clientes, Interacciones, Usuarios y Evaluaciones/Métricas CRM.

## Cambios realizados
1. Se agregó la base de datos MySQL/MariaDB `upskill_crm`.
2. Se agregaron las tablas `usuarios`, `clientes`, `interacciones` y `evaluaciones`.
3. Se incorporó un endpoint administrativo para registrar y consultar usuarios responsables de las interacciones.
4. Se incorporó `etapa_crm` en `clientes` con las cuatro etapas solicitadas: Prospecto, Activo, Frecuente e Inactivo.
5. Se creó un backend PHP con PDO y consultas preparadas.
6. Se implementó autenticación con sesiones PHP y roles `admin` y `usuario`.
7. Se conectaron los accesos de docentes y administradores con el backend real.
8. Se creó `views/CMR/crm.html` como interfaz funcional para los apartados del CRM: dashboard, clientes, historial, registro de interacción, cambio de etapa, mi actividad y reportes.
9. Se implementaron búsquedas, filtros, alta, edición y eliminación de clientes, con eliminación restringida al administrador.
10. Se implementaron métricas de clientes, interacciones y clientes sin interacción reciente.
11. Se agregaron datos iniciales para poder probar el sistema después de importar el SQL.

## Medidas de seguridad incluidas
- Contraseñas almacenadas con `password_hash()` y verificadas con `password_verify()`.
- Sentencias preparadas mediante PDO para evitar inyección SQL.
- Validación de correo, nombre, teléfono, estados, etapas y tipos de interacción en servidor.
- Sesiones PHP y regeneración del identificador de sesión después del login.
- Control de autorización para operaciones administrativas.
- Escape HTML en el frontend para reducir riesgos de XSS al mostrar datos provenientes de la base.
- No se almacenan contraseñas en texto plano.

## Limitaciones actuales
- El backend está pensado para XAMPP/MariaDB local. Debe ajustarse `api/config.php` si cambian las credenciales.
- Los módulos académicos existentes de alumno/docente continúan utilizando sus archivos JSON; este cambio conecta específicamente el módulo CRM solicitado en la Etapa 1.
- La tabla `evaluaciones` y su API están preparadas, pero no se añadió una pantalla completa de captura de evaluación porque el documento define la entidad mínima, pero no especifica sus campos ni un formulario concreto.
- Los datos de ejemplo deben sustituirse por datos reales durante la integración final.
- Las credenciales incluidas son exclusivamente de demostración local.

## Verificación realizada
Se ejecutó una comprobación de sintaxis sobre todos los archivos PHP nuevos y no se detectaron errores de sintaxis. La conexión real contra MySQL/MariaDB no puede ejecutarse en este entorno porque depende del servicio local de XAMPP del equipo del usuario; por ello, la importación del SQL y las pruebas HTTP deben realizarse en `localhost`.
