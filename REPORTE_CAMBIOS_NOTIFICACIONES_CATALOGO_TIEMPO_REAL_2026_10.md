# Cambios SCM — confirmaciones y catálogo público en tiempo real

## Confirmaciones de baja
Se reemplazó `window.confirm()` para cursos y proveedores por un modal propio del SCM, reutilizando los estilos del proyecto.

## Catálogo público sincronizado
`views/cursos.html` vuelve a consultar `api/cursos_publicos.php` cuando recibe una actualización desde el SCM mediante `BroadcastChannel` o `storage`. Como respaldo, también refresca cada 5 segundos para detectar cambios realizados desde otro navegador o dispositivo.

El endpoint público envía cabeceras `no-cache/no-store`, de modo que los cambios de nombre, descripción, precio, descuento, imagen, nivel, duración, alta y baja lógica se reflejan sin usar datos antiguos del navegador.

## Base de datos
No se requiere una migración adicional para estos cambios: el catálogo público continúa leyendo directamente la tabla `productos` y solo muestra registros con `estado = 'activo'`.

## Disponibilidad pública
El catálogo muestra un estado derivado del inventario sin revelar cantidades internas: `Disponible`, `Pocas licencias` o `No disponible`. De este modo, movimientos y pedidos que modifican existencias producen un cambio visible en el catálogo público.
