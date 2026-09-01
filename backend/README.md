# Backend CRM — Etapa 1 (Semanas 1–3)

Backend del módulo **CRM** del proyecto de Negocios Electrónicos.
Stack: **Node.js + Express + SQLite** (módulo nativo `node:sqlite`, sin compilación nativa).

Incluye **dos CRM separados**, según el rol que inicia sesión:

- **Administrador** → CRM del negocio: clientes/leads, interacciones y métricas globales.
- **Docente** → su propio CRM: pipeline de contactos (del prospecto de inscripción al alumno
  graduado) + bitácora de seguimientos y métricas. Los datos quedan **aislados por docente**.

## Requisitos

- Node.js **>= 22.5** (probado en Node 24)

## Instalación y arranque

```bash
cd backend
npm install
cp .env.example .env      # ajusta JWT_SECRET
npm run seed              # recrea el esquema + datos de ejemplo
npm start                 # http://localhost:3000
```

`npm run dev` arranca con recarga automática (`node --watch`).

> **Importante:** `npm run seed` hace `DROP` de todas las tablas y vuelve a aplicar
> `schema.sql`. Ejecútalo al menos una vez tras actualizar (los roles y tablas cambiaron).

## Flujo de acceso

La raíz `/` abre el sitio público **`/views/pagPrin.html`**. Desde su menú, el botón
**"Iniciar sesión"** lleva a **`/views/login.html`** — un login único con selección de rol
(Alumno · Docente · Administrador) que autentica contra `/api/auth/login` y redirige:

| Rol      | Destino               |
|----------|-----------------------|
| admin    | `/views/crm.html`         (CRM administración) |
| docente  | `/views/crm-docente.html` (CRM del docente)    |
| alumno   | `/views/alumno.html`      (panel del alumno)   |

Express sirve los archivos estáticos del repo; no hace falta otro servidor.

## Usuarios de prueba (tras `npm run seed`)

| Correo             | Contraseña | Rol     |
|--------------------|------------|---------|
| admin@upskill.mx   | admin123   | admin   |
| ana@upskill.mx     | ana12345   | admin   |
| laura@upskill.mx   | laura123   | docente |
| diego@upskill.mx   | diego123   | docente |
| alumno@upskill.mx  | alumno123  | alumno  |

> Si la base está vacía, el **primer** usuario registrado se crea como `admin` automáticamente.

## Modelo de datos

- **usuarios** — id, nombre, correo, password_hash, rol (`admin`/`docente`/`alumno`), fecha_registro

CRM administración:
- **clientes** — id, nombre, correo, telefono, empresa, fecha_registro, estado (`activo`/`inactivo`), etapa_crm (`Prospecto`/`Activo`/`Frecuente`/`Inactivo`)
- **interacciones** — id, cliente_id, tipo (`llamada`/`correo`/`reunion`), descripcion, fecha, usuario_id
- **evaluaciones** — id, cliente_id, puntaje (1–5), comentario, fecha, usuario_id

CRM del docente (aislado por `docente_id`):
- **contactos_docente** — id, docente_id, nombre, correo, telefono, curso, estado (`activo`/`inactivo`), etapa (`Prospecto`/`Inscrito`/`Al dia`/`En riesgo`/`Graduado`), fecha_registro. `UNIQUE(docente_id, correo)`
- **seguimientos** — id, contacto_id, docente_id, tipo (`mensaje`/`tutoria`/`llamada`/`correo`/`reunion`), descripcion, fecha

Esquema completo en [`src/db/schema.sql`](src/db/schema.sql).

## Endpoints

Todas las rutas (salvo `/api/health`, `register` y `login`) requieren cabecera
`Authorization: Bearer <token>`.

### Autenticación (`/api/auth`)
| Método | Ruta        | Descripción                        |
|--------|-------------|------------------------------------|
| POST   | `/register` | Alta de usuario, devuelve token    |
| POST   | `/login`    | Inicio de sesión, devuelve token   |
| GET    | `/me`       | Datos del usuario autenticado      |

### CRM administración — **solo rol `admin`**

`/api/clientes`
| Método | Ruta                    | Descripción                                   |
|--------|-------------------------|-----------------------------------------------|
| GET    | `/`                     | Listar. Filtros: `?buscar=`, `?estado=`, `?etapa=` |
| POST   | `/`                     | Crear cliente                                 |
| GET    | `/:id`                  | Obtener cliente                               |
| PUT    | `/:id`                  | Actualizar cliente                            |
| PUT    | `/:id/etapa`            | Cambiar `etapa_crm` — body `{ "etapa_crm": "Activo" }` |
| DELETE | `/:id`                  | Eliminar                                      |
| GET    | `/:id/interacciones`    | Historial de interacciones del cliente        |

`/api/interacciones`
| Método | Ruta      | Descripción                                                    |
|--------|-----------|---------------------------------------------------------------|
| POST   | `/`       | Registrar interacción. El usuario responsable sale del token. |
| GET    | `/mias`   | "Mi actividad": interacciones del usuario autenticado         |

`/api/metricas`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/`  | Totales, activos vs inactivos, interacciones por cliente, clientes sin interacción reciente (`?dias=30`), distribución por etapa |

### CRM del docente (`/api/docente`) — **solo rol `docente`**

Todas las consultas se filtran por el docente autenticado.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/contactos`                  | Listar. Filtros: `?buscar=`, `?estado=`, `?etapa=` |
| POST   | `/contactos`                  | Crear contacto (`nombre`, `correo` obligatorios) |
| GET    | `/contactos/:id`              | Obtener contacto |
| PUT    | `/contactos/:id`              | Actualizar contacto |
| PUT    | `/contactos/:id/etapa`        | Cambiar `etapa` — body `{ "etapa": "Inscrito" }` |
| DELETE | `/contactos/:id`              | Eliminar contacto |
| GET    | `/contactos/:id/seguimientos` | Bitácora del contacto |
| POST   | `/seguimientos`               | Registrar seguimiento `{ contacto_id, tipo, descripcion }` |
| GET    | `/metricas`                   | Totales, por etapa, contactos sin seguimiento reciente (`?dias=30`) |

## Ejemplos rápidos (curl)

```bash
# login admin
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@upskill.mx","password":"admin123"}' | jq -r .token)

curl localhost:3000/api/metricas -H "Authorization: Bearer $TOKEN"

# login docente
DTOKEN=$(curl -s -X POST localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"laura@upskill.mx","password":"laura123"}' | jq -r .token)

curl localhost:3000/api/docente/contactos -H "Authorization: Bearer $DTOKEN"
```

## Seguridad implementada

- Contraseñas con **bcrypt** (hash + salt).
- **JWT** firmado con `JWT_SECRET`, expiración configurable.
- Middleware `autenticar` (token obligatorio) y `requiereRol(...)`: el CRM de administración exige
  `admin`, el CRM del docente exige `docente`. Un rol no puede tocar el CRM del otro (403).
- El CRM del docente filtra **siempre** por `req.user.id`; nunca se confía en el `docente_id` del body.
- Validación de entrada en todos los endpoints (campos obligatorios, formato de correo/teléfono, enums).
- Restricciones a nivel de base de datos (`UNIQUE`, `CHECK`, claves foráneas con `ON DELETE CASCADE`).

## Estructura

```
backend/
├── src/
│   ├── server.js            arranque
│   ├── app.js               montaje de Express y rutas
│   ├── db/
│   │   ├── index.js         conexión SQLite + carga de esquema
│   │   ├── schema.sql       DDL de las tablas
│   │   └── seed.js          recrea esquema + datos de ejemplo
│   ├── middleware/
│   │   ├── auth.js          JWT + roles
│   │   └── errorHandler.js  manejo central de errores
│   ├── utils/
│   │   └── validate.js      validaciones reutilizables
│   ├── controllers/         lógica de negocio (incl. docenteController.js)
│   └── routes/              definición de endpoints (incl. docente.js)
└── package.json
```

## Front-end

| Página | Archivo | Descripción |
|--------|---------|-------------|
| Login  | [`views/login.html`](../views/login.html) · [`js/login.js`](../js/login.js) | Login único por rol |
| CRM admin | [`views/crm.html`](../views/crm.html) · [`js/crm.js`](../js/crm.js) | Clientes, interacciones, métricas |
| CRM docente | [`views/crm-docente.html`](../views/crm-docente.html) · [`js/crm-docente.js`](../js/crm-docente.js) | Contactos, seguimientos, métricas del docente |

Estilos compartidos en [`css/crm.css`](../css/crm.css). El token se guarda en `localStorage`
(`crm_token` / `crm_usuario`) y se envía en cada petición; cada CRM valida el rol al cargar y
redirige si no corresponde.

Para apuntar el front a otra URL de API: `localStorage.setItem('crm_api', 'http://host:puerto/api')`.
