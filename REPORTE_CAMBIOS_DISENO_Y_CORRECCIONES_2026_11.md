# Rediseño visual (rama `uriel`) y corrección de errores

Se adoptó el sistema de diseño de la rama `uriel` en todo el proyecto `ProyectoE1`, conservando toda la funcionalidad de CRM, SCM y ERP (backend PHP + MySQL).

## Diseño
- `css/stylePrin.css` es la base compartida: tokens de color (azul `#1d4ed8`), navbar en degradado azul marino → azul, tarjetas redondeadas, botones tipo píldora, modales, footer y modo oscuro.
- CSS por página tomados de `uriel`: `styles.css`, `stylecurso.css`, `planes.css`, `carrito.css`, `pago.css`, `facturacion.css`, `micropagos.css`, `alumno.css`, `docente.css`, `admin.css`, `flotante.css`.
- Los estilos propios de ProyectoE1 se reescribieron con los tokens: validación de formularios, botón «Regresar», barra de herramientas, estado del catálogo, disponibilidad SCM, solicitudes, cuentas de logística/ventas y modales del panel admin.
- Nuevo `css/modulos.css`: capa que alinea CRM, SCM y ERP con el mismo diseño (barra lateral en degradado azul, tarjetas, botones, tablas, modales, escalas de madurez en azul y modo oscuro).
- Todas las vistas cargan `stylePrin.css`; títulos de pestaña corregidos; badge de estado en el navbar; carrusel en bucle continuo; menú hamburguesa en móvil (`js/script.js`).
- Las páginas de acceso y registro ahora tienen navbar; el botón «Regresar» se coloca debajo del navbar.

## Errores corregidos
- `data/productos.json` ya no existía: `carrito.js`, `carritoini.js` y `planes.js` ahora leen `database/productos.json` (carrito y planes estaban vacíos).
- Imágenes con nombre dañado (`ense#U00f1anza.jpg`, `teclado…investigaci#U00f3n…jpg`) renombradas a `ensenanza.jpg` y `teclado-oficina.jpg`.
- Enlaces rotos a `views/loggin.html` y `views/logdocentes.html` (ahora en `views/CMR/…`) en carrito, carritoini, planes y upSkill.
- Panel docente: imágenes de cursos con ruta incorrecta y barra de progreso que no coincidía con el porcentaje mostrado.
- `pago.js` fallaba en `pago-metodo.html`; `confirmacion.html` fallaba al buscar `#errorMotivo`.
- `</footer>` duplicado en 14 vistas y `</main>` prematuro en el panel admin (dejaba secciones fuera del contenedor); IDs duplicados `modalPlan` / `cerrarModal`.
- «Cerrar sesión» en panel admin, alumno y docente no destruía la sesión PHP: ahora llama a `api/logout.php`.
- El modal de registro no se cerraba con Escape ni al hacer clic fuera.
- `api/scm_proveedores.php`: se restauró la validación que impide dar de baja a un proveedor con cursos activos (409), además de los casos «no existe» (404) y «ya dado de baja» (422).
- CRM: el contenido aparecía centrado verticalmente con un hueco arriba. ERP: el toast asomaba en la esquina.
- Archivos SQL: se agregó `SET NAMES utf8mb4;` para que los acentos no se corrompan al importar desde consola.
- Chart.js con versión fija (`4.4.1`) y el panel admin ya no se rompe si la CDN no carga.
- `docs/Status.html` estaba truncado (sin `</footer>`, `</body>` ni `</html>`) y tenía enlaces a páginas inexistentes; `docs/tecProp.html` tenía 11 `<h1>` sin cerrar.
- `database/productos.json`: dos cursos apuntaban a imágenes inexistentes (`apps.jpg`, `htmlcss.jpg`).
- Se eliminaron la carpeta duplicada `.github (2)` y el archivo vacío `html` de la raíz.

## Verificación
Se probó con PHP 8.3 + MariaDB 10.11 importando `sql/upskill_crm.sql` y todas las migraciones en orden: todas las vistas cargan sin errores de consola ni recursos faltantes, los endpoints de la API responden sin errores 500 y el flujo ERP (crear orden → procesar → descuento de inventario y movimiento SCM) funciona.
