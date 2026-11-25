# Integración de upSkillNue_V3 con el rediseño

La versión V3 (Etapas 4 y 5: tienda, soporte, promociones, seguridad y actividad) partía del commit `38eb667`, igual que el rediseño ya publicado en `ProyectoE1`. Este commit combina los dos trabajos para que nadie sobrescriba al otro.

## Cómo se combinó
- 36 archivos de V3 solo tenían saltos de línea de Windows (CRLF) y ningún cambio real: se conservaron como en el repositorio.
- Se tomaron de V3 sin cambios: `js/carrito.js` (carrito real con la API), `views/pago.html` y `views/pago-metodo.html` (ahora redirigen al checkout).
- Se combinaron a mano:
  - `api/login.php`: límite de 5 intentos de V3 + aviso de solicitud pendiente o rechazada.
  - `views/alumno.html`: enlace "Mi cuenta" de V3 + enlace de certificaciones del rediseño.
  - `views/CMR/crm.html` y `views/ERP/erp.html`: CSS versionado de V3 + `modulos.css` del rediseño; botones nuevos de V3 con los íconos del rediseño.
  - `views/CMR/Administradores/admin.html`: tarjeta "Atención a clientes" de V3 dentro de la cuadrícula de módulos.

## Correcciones necesarias al combinar
- `js/script.js`: "Cerrar sesión" ahora envía el token CSRF; sin él, V3 rechaza la petición y la sesión seguía abierta.
- `js/crm.js`: se quitó un evento duplicado de "Mi actividad".

## Correcciones a V3
- `js/tienda-api.js`: usaba siempre `../api`; desde `views/ERP/configuracion-tienda.html` eso daba 404 y la configuración de IVA y promociones no cargaba. Ahora usa el `data-api-base` de cada página.
- `.htaccess`: bloqueaba toda la carpeta `docs/`, que contiene páginas públicas enlazadas desde el sitio (Tecnología propuesta, Estado del servicio). Los `.md` siguen bloqueados.
- Migraciones nuevas con `SET NAMES utf8mb4;` para importar acentos correctamente.

## Diseño
- `css/tienda.css`: capa final que usa los tokens del sistema de diseño (botones tipo píldora, tarjetas, campos y tablas).
- `css/carrito.css`: estilos para el carrito real (`cart-item`, cantidad, quitar, vaciar).
- `css/stylePrin.css`: los enlaces del navbar sin clase (páginas de la tienda) ya se ven en blanco.
- `views/ERP/soporte.html` y `configuracion-tienda.html` cargan `modulos.css`.

## Verificación
Base de datos importada con las 12 migraciones en orden. Probado: registro, aviso de cuenta pendiente, aprobación, CRM (nuevo cliente y Mi actividad), SCM, ERP, configuración comercial, soporte, factura, cierre de sesión, catálogo del alumno, carrito, checkout y Mi cuenta, sin errores de consola ni de servidor.
