# Cambios: catálogo público, imágenes y validaciones SCM

## Problema de cursos.html
La vista ya apuntaba al endpoint público, pero si la base no tenía exactamente las columnas esperadas el PHP podía devolver un error HTML/Fatal y el JavaScript terminaba sin tarjetas. Se cambió el endpoint para devolver siempre JSON controlado y un mensaje explícito de migración. También se agregó un indicador visible de carga/error en la vista.

## Login de cursos.html
El menú desplegable anterior se reemplazó por un enlace directo `Loggin` a `views/logalumno.html`, igual al comportamiento de `pagPrin.html`.

## Cursos SCM
- Se elimina `inscritos` del modelo actual.
- Nivel, duración, fecha de publicación, descuento y proveedor son obligatorios en frontend y backend.
- Imagen se selecciona con `<input type=file>` y se copia de forma segura a `src/uploads/cursos/`.
- El backend valida formato y tamaño (máximo 5 MB; JPG/PNG/WEBP/GIF).

## Proveedores
La dirección es obligatoria en frontend y backend.

## Movimientos
El detalle es obligatorio antes de registrar cualquier entrada o salida.

## Base de datos
Ejecutar `sql/migracion_scm_catalogo_validaciones_2026_10.sql` después de respaldar `upskill_crm`.
