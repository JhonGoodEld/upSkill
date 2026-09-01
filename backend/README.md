# Backend CRM — Etapa 1 (Semanas 1–3)

Backend del módulo **CRM** del proyecto de Negocios Electrónicos.
Stack: **Node.js + Express + SQLite** (módulo nativo `node:sqlite`, sin compilación nativa).

## Requisitos

- Node.js **>= 22.5** (probado en Node 24)

## Instalación y arranque

```bash
cd backend
npm install
cp .env.example .env      # ajusta JWT_SECRET
npm run seed              # datos de ejemplo (opcional)
npm start                 # http://localhost:3000
```

`npm run dev` arranca con recarga automática (`node --watch`).

Con el servidor arriba, el **front-end del CRM** queda servido en
<http://localhost:3000/views/crm.html> (la raíz `/` redirige ahí). No hace falta
otro servidor: Express sirve los archivos estáticos del repo.

## Usuarios de prueba (tras `npm run seed`)

| Correo             | Contraseña | Rol     |
|--------------------|------------|---------|
| admin@upskill.mx   | admin123   | admin   |
| ana@upskill.mx     | ana12345   | usuario |

> Si la base está vacía, el **primer** usuario registrado se crea como `admin` automáticamente.

## Modelo de datos

- **usuarios** — id, nombre, correo, password_hash, rol (`admin`/`usuario`), fecha_registro
- **clientes** — id, nombre, correo, telefono, empresa, fecha_registro, estado (`activo`/`inactivo`), etapa_crm (`Prospecto`/`Activo`/`Frecuente`/`Inactivo`)
- **interacciones** — id, cliente_id, tipo (`llamada`/`correo`/`reunion`), descripcion, fecha, usuario_id
- **evaluaciones** — id, cliente_id, puntaje (1–5), comentario, fecha, usuario_id

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

### Clientes (`/api/clientes`)
| Método | Ruta                    | Descripción                                   |
|--------|-------------------------|-----------------------------------------------|
| GET    | `/`                     | Listar. Filtros: `?buscar=`, `?estado=`, `?etapa=` |
| POST   | `/`                     | Crear cliente                                 |
| GET    | `/:id`                  | Obtener cliente                               |
| PUT    | `/:id`                  | Actualizar cliente                            |
| PUT    | `/:id/etapa`            | Cambiar `etapa_crm` — body `{ "etapa_crm": "Activo" }` |
| DELETE | `/:id`                  | Eliminar (**solo admin**)                     |
| GET    | `/:id/interacciones`    | Historial de interacciones del cliente        |

### Interacciones (`/api/interacciones`)
| Método | Ruta      | Descripción                                                    |
|--------|-----------|---------------------------------------------------------------|
| POST   | `/`       | Registrar interacción. El usuario responsable sale del token. |
| GET    | `/mias`   | "Mi actividad": interacciones del usuario autenticado         |

### Métricas (`/api/metricas`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/`  | Totales, clientes activos vs inactivos, interacciones por cliente, clientes sin interacción reciente (`?dias=30`), distribución por etapa |

## Ejemplos rápidos (curl)

```bash
# login
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@upskill.mx","password":"admin123"}' | jq -r .token)

# crear cliente
curl -X POST localhost:3000/api/clientes \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nombre":"ACME SA","correo":"contacto@acme.com","telefono":"4491112233","empresa":"ACME"}'

# métricas
curl localhost:3000/api/metricas -H "Authorization: Bearer $TOKEN"
```

## Seguridad implementada

- Contraseñas con **bcrypt** (hash + salt).
- **JWT** firmado con `JWT_SECRET`, expiración configurable.
- Middleware `autenticar` (token obligatorio) y `requiereRol('admin')` para acciones sensibles.
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
│   │   ├── schema.sql       DDL de las 4 tablas
│   │   └── seed.js          datos de ejemplo
│   ├── middleware/
│   │   ├── auth.js          JWT + roles
│   │   └── errorHandler.js  manejo central de errores
│   ├── utils/
│   │   └── validate.js      validaciones reutilizables
│   ├── controllers/         lógica de negocio
│   └── routes/              definición de endpoints
└── package.json
```

## Front-end del CRM (implementado)

- [`views/crm.html`](../views/crm.html) — interfaz completa del CRM
- [`js/crm.js`](../js/crm.js) — lógica y llamadas a la API
- [`css/crm.css`](../css/crm.css) — estilos

Incluye:
- Login que guarda el token en `localStorage` y lo envía en cada petición; valida el token al recargar.
- Tabla de clientes con búsqueda y filtros por estado y etapa.
- Alta y edición de cliente en modal.
- Vista "Historial del cliente" con línea de tiempo de interacciones y alta de interacción.
- Selector de `etapa_crm` por fila con etiquetas de color (cambio en caliente vía `PUT /clientes/:id/etapa`).
- Dashboard de métricas: contadores, gráfica de dona por etapa (Chart.js) y lista de clientes en riesgo.
- Pantalla "Mi actividad" (`GET /api/interacciones/mias`).
- El botón *Eliminar* solo aparece para el rol `admin`.

Para apuntar el front a otra URL de API: `localStorage.setItem('crm_api', 'http://host:puerto/api')`.
