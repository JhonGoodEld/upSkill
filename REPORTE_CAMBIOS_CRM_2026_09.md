# Reporte de cambios CRM — septiembre 2026

## Objetivo
Reorganizar el sistema para que el CRM sea exclusivo del administrador y conservar las vistas académicas independientes para docentes y alumnos. Se añadieron mejoras de interfaz, métricas, historial de interacciones, control de acceso y registro pendiente de aprobación.

## Cambios principales

### Acceso y roles
- CRM restringido a usuarios con rol `admin` tanto en JavaScript como en los endpoints PHP.
- Roles de base de datos: `admin`, `docente`, `alumno`.
- Estados de cuenta: `pendiente`, `activo`, `inactivo`.
- Los registros desde `views/registro.html` y `views/regdocentes.html` se almacenan en MySQL con estado `pendiente`.
- El administrador dispone de una tabla de solicitudes pendientes para aprobar o rechazar cuentas.
- Los docentes aprobados usan `views/CMR/logdocentes.html` y regresan a `views/CMR/Docentes/docente.html`, no al CRM.
- Los alumnos aprobados usan `views/logalumno.html` y acceden a `views/alumno.html`.
- Se agregó un guardado de rol en las vistas estáticas de administrador, docente y alumno.

### Login docente
- Se agregaron enlaces hacia `views/regdocentes.html` con el texto solicitado.
- Se conserva el acceso independiente al login del administrador.
- Se agregaron controles de regreso, idioma y modo oscuro.

### CRM
- Nueva paleta azul alineada visualmente con la plataforma y soporte de modo oscuro.
- Barra superior con nombre del administrador, búsqueda global, idioma y tema.
- Botón de regreso.
- IDs de clientes mostrados en orden ascendente.
- Columna `Etapa` renombrada a `Etapa CRM`.
- Teléfono validado únicamente con formatos `4492255316` o `449 225 5316`.
- Acciones por cliente: ojo (historial), editar/detalles y papelera (eliminación definitiva).
- Vista secundaria de detalles con avatar de iniciales, estado, empresa, correo, teléfono, etapa y fecha de registro.
- Cambio de Etapa CRM mediante modal con Prospecto, Activo, Frecuente e Inactivo.
- Historial como línea de tiempo, ordenado de más reciente a más antiguo.
- Nueva interacción con tipo, descripción, fecha/hora y responsable/contacto.
- Sección Interacciones con tabla de clientes y acceso al historial mediante ojo.
- Mi Actividad con filtro mensual.

### Dashboard y reportes
- Total de clientes: subtítulo `Todos los clientes`.
- Clientes activos: porcentaje respecto al total.
- Interacciones del mes: variación porcentual contra el mes anterior.
- Clientes sin interacción: subtítulo `Últimos 30 días`.
- Activos vs. inactivos con tonos de azul y porcentajes.
- Clientes en riesgo ordenados por antigüedad de última interacción; los que nunca tuvieron interacción aparecen primero.
- El dashboard muestra inicialmente 3 clientes en riesgo y ofrece `Ver todos`.
- En Reportes se repiten las cuatro tarjetas principales.
- Interacciones por tipo: gráfica vertical.
- Clientes por etapa CRM: gráfica circular con leyenda y cantidades.

## Definición aplicada de cliente en riesgo
Un cliente en riesgo NO es únicamente quien nunca ha tenido interacciones. Se considera en riesgo cuando no registra ninguna interacción durante los últimos 30 días. Esto incluye:
1. clientes que nunca han tenido una interacción;
2. clientes cuya última interacción ocurrió hace más de 30 días.

## Cambios de base de datos
Se añadieron/modificaron:
- `usuarios.rol`: admin/docente/alumno.
- `usuarios.estado`: pendiente/activo/inactivo.
- `usuarios.especialidad`.
- `usuarios.curso_solicitado`.
- `interacciones.responsable`.

### Para una base YA creada
Ejecutar en phpMyAdmin:
`sql/migracion_crm_2026_09.sql`

### Para instalación nueva
Importar:
`sql/upskill_crm.sql`

No es necesario importar ambos en una instalación nueva.

## Archivos API nuevos
- `api/registro.php`: registra alumnos/docentes como pendientes.
- `api/solicitudes.php`: permite al administrador listar/aprobar/rechazar registros.

## Nota sobre cursos solicitados
El proyecto académico existente conserva su catálogo de cursos principalmente en archivos JSON. Por esta razón, esta versión guarda el texto `curso_solicitado` del docente y permite que el administrador apruebe su cuenta, pero no crea todavía una inscripción relacional automática a un curso en MySQL. Para implementar esa asignación de forma completa conviene migrar el catálogo a tablas `cursos` y `usuario_curso` en una etapa posterior, evitando duplicar dos fuentes de datos distintas.

## Pruebas recomendadas
1. Ejecutar la migración SQL.
2. Reiniciar Apache/MySQL si fuera necesario.
3. Administrador: iniciar en `views/CMR/Administradores/loggin.html`.
4. Abrir el panel administrador y comprobar solicitudes pendientes.
5. Abrir CRM desde el panel y probar Clientes, Interacciones, Actividad y Reportes.
6. Registrar un docente nuevo y verificar que el login indique que está pendiente antes de aprobarlo.
7. Aprobarlo desde administrador y confirmar que el mismo login ya permite entrar a la vista docente.
8. Repetir el flujo con un alumno.

## Limitaciones de prueba
La estructura y la sintaxis de JavaScript y PHP fueron verificadas en el entorno de generación. No fue posible ejecutar contra la instancia local de MariaDB/XAMPP del usuario, por lo que la migración debe probarse en phpMyAdmin en el equipo donde corre XAMPP.


## Actualización: solicitudes y administrador principal
- Las solicitudes de alumno/docente ahora se guardan primero en `solicitudes_registro`; no crean una cuenta utilizable de inmediato.
- Al aprobar, el backend crea el usuario activo y crea/actualiza su registro en `clientes`, por lo que aparece en el CRM.
- Al rechazar, la solicitud queda marcada como `rechazada` y no se crea usuario ni cliente.
- Se añadieron teléfono y empresa/institución a los formularios para disponer de los campos mínimos necesarios al crear el cliente.
- `admin@upskillacademy.com` se marca como administrador principal (`es_superadmin=1`). Solo esta cuenta puede crear o activar/desactivar otros administradores.
- La cuenta principal está protegida contra desactivación desde la API.
- Se añadieron controles Regresar, ES/EN y modo oscuro al login de alumno, equiparándolo con los otros logins.
- Se actualizó el mensaje del login de alumno con enlaces independientes a Registro para Docentes y Sistema para Docentes.
- Para bases existentes se debe ejecutar nuevamente `sql/migracion_crm_2026_09.sql` (la migración es acumulativa).
