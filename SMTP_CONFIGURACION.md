# Configuración SMTP para recibos de compra

El envío real de recibos utiliza PHPMailer y un servidor SMTP externo. XAMPP ejecuta PHP, pero no es el proveedor de correo.

## Instalación local

1. Instala Composer para Windows si aún no está disponible.
2. Abre PowerShell en la carpeta raíz `upSkillNue`.
3. Ejecuta `composer install` para instalar PHPMailer en `vendor/`.
4. Copia `config.local.php.example` como `config.local.php`.
5. Completa host, puerto, cifrado, usuario, contraseña de aplicación y remitente.
6. En `php.ini` verifica que la extensión `openssl` esté habilitada; reinicia Apache y realiza una compra de prueba con una cuenta de alumno cuyo correo puedas consultar.

## Correos que envía la plataforma

| Momento | Correo | Archivo |
| --- | --- | --- |
| El alumno o docente envía su registro | Solicitud recibida: debe esperar la aprobación del administrador | `api/registro.php` |
| El administrador aprueba la solicitud | Cuenta aprobada, con enlace para iniciar sesión; los alumnos reciben un código de 25 % de descuento de un solo uso (30 días) | `api/solicitudes.php` |
| El alumno termina una compra | Recibo (ticket) con folio, cursos, subtotal, descuento, IVA, total y método de pago | `api/tienda_checkout.php` |

Las plantillas están en `api/email_service.php`. El código de bienvenida queda en la tabla `promociones` ligado al cliente (`cliente_id`): solo lo puede usar ese alumno y se desactiva al primer uso. Requiere importar `sql/migracion_correos_codigo_bienvenida_2026_11.sql`.

### Sin SMTP (modo demostración)

Si no existe `vendor/` o `config.local.php`, ningún proceso falla: cada correo se guarda como archivo HTML en `logs/correos/`. Ábrelo con doble clic para mostrar el correo en una exposición. La carpeta no se sube a Git y `.htaccess` la bloquea desde el navegador. Al aprobar, el panel admin muestra el código de un solo uso para entregarlo a mano.

## Gmail (ejemplo)

- Host: `smtp.gmail.com`
- Puerto: `587`
- Cifrado: `tls` (STARTTLS)
- Usuario: correo completo de Gmail
- Contraseña: contraseña de aplicación, no la contraseña normal de la cuenta. Google requiere verificación en dos pasos y que la cuenta permita generar contraseñas de aplicación.

También puede utilizarse Outlook/Microsoft 365 o un proveedor transaccional, siempre que la cuenta permita SMTP autenticado.

## Seguridad

- No compartas ni pegues aquí la contraseña SMTP.
- No subas `config.local.php` ni `vendor/` al repositorio.
- `config.local.php` está excluido de Git y bloqueado por `.htaccess`.
- Si SMTP no está configurado, la compra sí se registra y el recibo queda como `pendiente_configuracion`; el envío no revierte el pedido.
- Tarjeta, PayPal y transferencia del checkout son simulaciones académicas. No se almacenan números de tarjeta, CVV ni credenciales reales.
