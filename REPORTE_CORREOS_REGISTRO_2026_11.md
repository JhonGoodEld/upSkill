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

## Sin SMTP
Los correos se guardan como HTML en `logs/correos/` (excluida de Git y bloqueada por `.htaccess`) y el panel admin muestra el código al aprobar. La configuración SMTP real está en `SMTP_CONFIGURACION.md`; `app_url` en `config.local.php` define los enlaces de los correos.

## Verificación
Probado sin SMTP y con un PHPMailer de prueba: los 5 correos (registro de alumno y docente, aprobación de ambos, recibo) se generan; el código aplica 25 % de descuento solo para su dueño, se rechaza para otro alumno y no se puede usar dos veces.
