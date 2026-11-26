# Envío de correos reales por Gmail

La plataforma envía los correos de verdad por el servidor SMTP de Gmail usando PHPMailer.
No hay modo simulado: si Gmail no está configurado o rechaza el envío, la pantalla lo dice
(el registro, la aprobación o la compra sí se guardan).

PHPMailer ya viene incluido en `lib/PHPMailer`, así que **no hace falta Composer**.
Si alguien ejecuta `composer install`, se usa la copia de `vendor/`.

## Correos que envía la plataforma

| Momento | Correo | Archivo |
| --- | --- | --- |
| El alumno o docente envía su registro | Solicitud recibida: debe esperar la aprobación del administrador | `api/registro.php` |
| El administrador aprueba la solicitud | Cuenta aprobada, con enlace para iniciar sesión; los alumnos reciben un código de 25 % de descuento de un solo uso (30 días) | `api/solicitudes.php` |
| El alumno termina una compra | Recibo (ticket) con folio, cursos, subtotal, descuento, IVA, total y método de pago | `api/tienda_checkout.php` |
| El administrador pulsa «Enviar correo de prueba» | Correo de prueba para comprobar la configuración | `api/correo_prueba.php` |

Las plantillas están en `api/email_service.php`. El código de bienvenida queda en la tabla `promociones`
ligado al cliente (`cliente_id`): solo lo puede usar ese alumno y se desactiva al primer uso. Requiere
importar `sql/migracion_correos_codigo_bienvenida_2026_11.sql`.

## Configurar Gmail (una sola vez, unos 5 minutos)

### 1. Activa la verificación en dos pasos

Google solo deja crear contraseñas de aplicación si la cuenta tiene la verificación en dos pasos.

1. Entra a <https://myaccount.google.com/security> con la cuenta de Gmail que enviará los correos
   (puede ser una cuenta nueva solo para el proyecto).
2. En **Cómo inicias sesión en Google**, abre **Verificación en dos pasos** y actívala.

### 2. Crea una contraseña de aplicación

1. Entra a <https://myaccount.google.com/apppasswords>.
2. Escribe un nombre, por ejemplo `Upskill Academy`, y pulsa **Crear**.
3. Google muestra una contraseña de **16 letras** (por ejemplo `abcd efgh ijkl mnop`). Cópiala.
   Solo se muestra una vez; si la pierdes, borra esa y crea otra.

> Es distinta de la contraseña normal de Gmail. Con la contraseña normal Gmail rechaza el envío.

### 3. Crea `config.local.php`

1. En la carpeta del proyecto que abre XAMPP (la que tiene `api/`, `views/`, `css/`…), copia
   `config.local.php.example` y renombra la copia como `config.local.php`.
2. Ábrela con el Bloc de notas o VS Code y cambia solo dos líneas:

```php
'username' => 'tu-correo@gmail.com',          // ← tu cuenta de Gmail
'password' => 'TU_CONTRASENA_DE_APLICACION',  // ← las 16 letras (con o sin espacios)
```

3. Guarda el archivo. No hace falta tocar nada más: el servidor (`smtp.gmail.com`), el puerto (`587`)
   y el cifrado (STARTTLS) ya vienen configurados.

### 4. Revisa XAMPP

- La extensión `openssl` debe estar activa. En XAMPP lo está por defecto; si no, abre
  `C:\xampp\php\php.ini`, quita el `;` de la línea `;extension=openssl` y reinicia Apache.
- El equipo necesita internet. Algunos antivirus o redes escolares bloquean el puerto 587.

### 5. Prueba el envío

1. Inicia sesión como administrador y abre el panel de administración.
2. En la sección **📧 Correo (Gmail)** debe aparecer en verde «Gmail configurado».
   Si aparece en rojo, el mensaje dice qué falta.
3. Escribe tu correo personal y pulsa **Enviar correo de prueba**.
4. Revisa la bandeja de entrada (y la carpeta de spam la primera vez).

Después registra un alumno con un correo que puedas abrir y sigue el recorrido:
registro → correo de solicitud recibida → aprobación en el panel → correo con el código → compra con el código → recibo.

## Si no llega el correo

| Mensaje en pantalla | Qué hacer |
| --- | --- |
| Falta el archivo config.local.php | Crea el archivo como en el paso 3, en la carpeta raíz del proyecto (no dentro de `api/`). |
| config.local.php todavía tiene los datos de ejemplo | Cambia `tu-correo@gmail.com` y `TU_CONTRASENA_DE_APLICACION` por tus datos. |
| Gmail rechazó el usuario o la contraseña | Usa la contraseña de aplicación de 16 letras, no la normal. Revisa que el correo esté bien escrito y que la verificación en dos pasos siga activa. |
| No se pudo conectar con el servidor de Gmail | Revisa internet, el antivirus o firewall (puerto 587) y la extensión `openssl`. Si tu red bloquea el 587, prueba `'port' => 465, 'secure' => 'ssl'`. |
| PHP no tiene habilitada la extensión openssl | Activa `extension=openssl` en `php.ini` y reinicia Apache. |
| Dice «enviado» pero no aparece | Busca en spam o en «Promociones». Gmail limita a unos 500 correos por día por cuenta. |

El detalle técnico de cada error también queda en el log de PHP (`C:\xampp\apache\logs\error.log`),
en las líneas que empiezan con `[Upskill correo]`.

## Seguridad

- No compartas la contraseña de aplicación ni la pegues en chats o capturas.
- `config.local.php` no se sube a GitHub (está en `.gitignore`) y `.htaccess` bloquea abrirlo desde el navegador.
  Cada integrante del equipo crea el suyo en su computadora.
- Si la contraseña se filtra, bórrala en <https://myaccount.google.com/apppasswords> y crea otra.
- Si el correo falla, la compra sí se registra y el recibo queda como «No se pudo enviar»; el alumno
  puede reenviarlo desde **Mis pedidos**.
- Tarjeta, PayPal y transferencia del checkout son simulaciones académicas. No se almacenan números de tarjeta, CVV ni credenciales reales.
