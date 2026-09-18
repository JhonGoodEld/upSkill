# Backend CRM de Upskill Academy

Esta versión agrega el backend solicitado para la Etapa 1 – CRM del documento `Distribución por etapas`.

## Requisitos
- XAMPP con Apache y MySQL/MariaDB.
- PHP con PDO MySQL habilitado.
- El proyecto dentro de `htdocs`, por ejemplo: `C:/xampp/htdocs/upSkillNue/`.

## 1. Crear la base de datos
1. Inicia Apache y MySQL desde XAMPP.
2. Abre phpMyAdmin.
3. Importa `sql/upskill_crm.sql`.
4. Debe aparecer la base `upskill_crm` con las tablas `usuarios`, `clientes`, `interacciones` y `evaluaciones`.

## 2. Configuración PHP
Revisa `api/config.php`. Por defecto usa:
- host: `127.0.0.1`
- base: `upskill_crm`
- usuario: `root`
- contraseña: vacía

Si tu XAMPP utiliza contraseña para root, cambia `DB_PASS`.

## 3. Abrir el CRM
No abras los HTML haciendo doble clic con `file://`. Debes entrar por Apache, por ejemplo:
`http://localhost/upSkillNue/views/CMR/logdocentes.html`

## 4. Cuentas de prueba
- Administrador: `admin@upskillacademy.com` / `Admin123!`
- Usuario/Docente: `docente@upskillacademy.com` / `Docente123!`

Estas credenciales son únicamente para la demostración local. Deben cambiarse antes de una publicación real.

## 5. Funcionalidades CRM implementadas
- Login con sesión PHP y roles `admin` / `usuario`.
- Clientes: alta, listado, búsqueda, filtro, detalle, edición y eliminación (eliminación solo admin).
- Interacciones: registro e historial por cliente.
- Etapa CRM: Prospecto, Activo, Frecuente e Inactivo.
- Mi actividad: interacciones registradas por el usuario autenticado.
- Dashboard y métricas: total de clientes, activos/inactivos, interacciones del mes, clientes sin interacción reciente y clientes en riesgo.
- Evaluaciones: tabla y endpoint preparados para valoración CRM de 1 a 5.
- Consultas mediante PDO y sentencias preparadas.

## Endpoints principales
- `POST /api/login.php`
- `GET /api/clientes.php`
- `POST /api/clientes.php`
- `GET /api/cliente.php?id={id}`
- `PUT /api/cliente.php?id={id}`
- `DELETE /api/cliente.php?id={id}`
- `GET /api/interacciones.php?cliente_id={id}`
- `POST /api/interacciones.php`
- `PUT /api/etapa.php` con `{ "id": 1, "etapa_crm": "Frecuente" }`
- `GET /api/metricas.php`
- `GET /api/actividad.php`
- `GET /api/evaluaciones.php?cliente_id={id}`
- `POST /api/evaluaciones.php`
- `GET /api/usuarios.php` (admin)
- `POST /api/usuarios.php` (admin)
- `GET /api/me.php`
- `POST /api/logout.php`

Los endpoints conceptuales solicitados por la actividad quedan cubiertos; además, `api/.htaccess` permite rutas amigables para clientes cuando `mod_rewrite` está habilitado.
