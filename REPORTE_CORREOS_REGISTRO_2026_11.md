# Correos de registro, aprobación y compra

| Requisito | Dónde | Resultado |
| --- | --- | --- |
| Correo de bienvenida que pide esperar la aprobación del administrador | `api/registro.php` → `correo_solicitud_recibida()` | Se envía al registrarse alumnos y docentes. |
| Correo de cuenta aprobada con código de un solo uso | `api/solicitudes.php` → `correo_cuenta_aprobada()` | Incluye enlace para iniciar sesión. Los alumnos reciben un código `UPSK-XXXXXXXX` de 25 % de descuento, un solo uso, 30 días. |
| Correo de compra con ticket | `api/tienda_checkout.php` → `tienda_enviar_recibo()` | Folio, cursos, subtotal, descuento, IVA, total y método de pago. |

## Código de un solo uso
- Se guarda en `promociones` con `usos_maximos = 1` y `cliente_id` del alumno.
- Solo lo acepta la cuenta dueña (`store_promo` filtra por `cliente_id`); no aparece en las promociones públicas ni en la lista del administrador.
- El alumno lo ve destacado en el catálogo mientras no lo use.
- Requiere `sql/migracion_correos_codigo_bienvenida_2026_11.sql` (después de la migración de Etapas 4 y 5).

## Envío real por Gmail
Los correos se envían de verdad por `smtp.gmail.com` con PHPMailer (incluido en `lib/PHPMailer`, sin Composer). Solo hay que crear `config.local.php` con la cuenta de Gmail y su contraseña de aplicación; los pasos están en `SMTP_CONFIGURACION.md`. No hay modo simulado: si Gmail no está configurado o rechaza el envío, la pantalla muestra el motivo, el registro, la aprobación o la compra sí se guardan, y al aprobar el panel muestra el código para entregarlo a mano. El panel de administración tiene la sección **📧 Correo (Gmail)** con el estado de la configuración y un botón para enviar un correo de prueba.

## Verificación
Probado con PHPMailer real contra un servidor SMTP con STARTTLS y usuario/contraseña (el mismo protocolo de Gmail): los correos de registro, aprobación con código y recibo llegan; el código aplica 25 % de descuento solo para su dueño, se rechaza para otro alumno y no se puede usar dos veces. Sin `config.local.php`, o con una contraseña incorrecta, la pantalla muestra el motivo del fallo.
