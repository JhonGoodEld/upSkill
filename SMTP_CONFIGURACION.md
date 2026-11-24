# Configuración SMTP para recibos de compra

El envío real de recibos utiliza PHPMailer y un servidor SMTP externo. XAMPP ejecuta PHP, pero no es el proveedor de correo.

## Instalación local

1. Instala Composer para Windows si aún no está disponible.
2. Abre PowerShell en la carpeta raíz `upSkillNue`.
3. Ejecuta `composer install` para instalar PHPMailer en `vendor/`.
4. Copia `config.local.php.example` como `config.local.php`.
5. Completa host, puerto, cifrado, usuario, contraseña de aplicación y remitente.
6. En `php.ini` verifica que la extensión `openssl` esté habilitada; reinicia Apache y realiza una compra de prueba con una cuenta de alumno cuyo correo puedas consultar.

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
