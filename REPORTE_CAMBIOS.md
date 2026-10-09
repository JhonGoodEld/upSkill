# Reporte de cambios – Upskill Academy

## Cambios realizados

1. **views/pagPrin.html**
   - Se corrigieron los enlaces de Cursos y Planes de carrera para mantener rutas relativas válidas.
   - El enlace de **Certificate** ahora dirige a `views/upSkill.html`, que es el recurso existente del proyecto dedicado a certificaciones.
   - El enlace de **Carrito** se mantiene apuntando a `views/carritoini.html`, que es el carrito utilizado actualmente desde la página principal.
   - Se corrigió el enlace de la tarjeta **“Experimenta la nueva forma de enseñanza”** para dirigir al catálogo de cursos (`views/cursos.html`), ya que la tarjeta tenía `href="#"` y no existía una vista específica con ese nombre.
   - Se mejoró el cambio de idioma del menú de Configuración para alternar entre español e inglés y conservar la selección en `localStorage`.

2. **Registro de alumnos y docentes**
   - `views/registro.html` y `views/regdocentes.html` ahora validan campos obligatorios antes de mostrar el mensaje de registro exitoso.
   - El nombre solo acepta letras y espacios.
   - El correo no acepta espacios y debe tener formato válido con `@` y dominio.
   - Las contraseñas no aceptan espacios.
   - La confirmación de contraseña debe coincidir.
   - En el registro docente, el área de expertise solo acepta letras y espacios.
   - Se eliminaron los `formnovalidate` que estaban anulando la validación nativa.
   - Se agregó un mensaje visible de error debajo del formulario para indicar qué regla se está incumpliendo.

3. **Inicio de sesión**
   - `views/logalumno.html`, `views/CMR/logdocentes.html` y `views/CMR/Administradores/loggin.html` ahora utilizan correo y contraseña con controles de validación.
   - El correo debe ser obligatorio, no contener espacios y tener formato válido.
   - La contraseña debe ser obligatoria y no contener espacios.
   - El botón de ingreso ahora es un botón de envío real del formulario y la redirección ocurre únicamente después de pasar la validación.

4. **Alumno**
   - Se corrigió la carga del archivo de cursos: el proyecto no contiene `data/productos.json`; el archivo real está en `database/productos.json`.
   - Se corrigió la generación del porcentaje de progreso para que el valor de la barra y el porcentaje mostrado sean el mismo.
   - Se añadieron mensajes de respaldo si no se pueden cargar los cursos o tareas.
   - Se agregaron comprobaciones para evitar errores si faltan contenedores en la vista.

5. **Docente**
   - Se corrigió la ruta de carga de `productos.json` a `../../../database/productos.json`.
   - Se añadió manejo de error para las secciones de cursos administrados, tareas por revisar, asignaciones y mensajes.
   - Se agregó una comprobación para evitar que el panel intente construir asignaciones si no hay suficientes cursos.

## Limitaciones encontradas

- **Autenticación real:** los formularios de inicio de sesión solo realizan validación del lado del cliente y posteriormente redirigen a la vista correspondiente. En el proyecto entregado no se encontró un backend de autenticación conectado a usuarios/contraseñas, por lo que no fue posible implementar aquí una comprobación real de credenciales, hash de contraseñas, sesiones o autorización por rol.
- **Persistencia de registros:** los formularios de registro muestran el modal de éxito, pero no se encontró un backend que almacene de forma persistente los nuevos registros. La validación realizada es del lado del cliente.
- **Certificaciones:** no existe una página llamada `certificados.html` o equivalente explícita. Se utilizó `views/upSkill.html` porque es la vista existente que contiene “Certificaciones destacadas”.
- **Nueva forma de enseñanza:** no existe una vista específica para esa función. Por ello, el enlace de la tarjeta se dirigió a `views/cursos.html`, que es la vista existente relacionada directamente con la oferta educativa.
- **Datos de alumno/docente:** las secciones solicitadas utilizan datos de ejemplo generados en JavaScript. No se encontró una fuente de datos específica para inscripciones, tareas o mensajes de usuarios reales.

## Archivos principales modificados

- `views/pagPrin.html`
- `views/conocenos.html` (la navegación existente ya apuntaba a `regdocentes.html`; no fue necesario cambiar ese enlace)
- `views/registro.html`
- `views/regdocentes.html`
- `views/logalumno.html`
- `views/alumno.html` (solo se verificó la estructura; la lógica se corrigió en `js/alumno.js`)
- `views/CMR/logdocentes.html`
- `views/CMR/Docentes/docente.html` (la estructura y rutas CSS ya eran correctas; se corrigió principalmente su lógica en `js/docente.js`)
- `views/CMR/Administradores/loggin.html`
- `js/script.js`
- `js/alumno.js`
- `js/docente.js`
- `css/styles.css`

## Nota de seguridad

Las validaciones implementadas ayudan a controlar entradas incorrectas y mejorar la experiencia del usuario, pero **no sustituyen la validación del servidor**. Para un sistema real, las mismas reglas deben validarse nuevamente en backend y las contraseñas nunca deben almacenarse en texto plano.
