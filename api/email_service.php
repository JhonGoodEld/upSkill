<?php
/**
 * Servicio de correo de Upskill Academy: envío real por SMTP (Gmail) con PHPMailer.
 *
 * Correos que envía la plataforma:
 *  - Solicitud de registro recibida (espera la aprobación del administrador).
 *  - Cuenta aprobada, con el código de descuento personal de un solo uso.
 *  - Recibo de compra (ticket) de la tienda.
 *
 * Configuración: config.local.php en la raíz (ver config.local.php.example y
 * SMTP_CONFIGURACION.md). PHPMailer viene incluido en lib/PHPMailer, así que no hace
 * falta Composer; si existe vendor/ (composer install) se usa esa copia.
 * Si el envío falla, el registro, la aprobación o la compra NO se revierten: la función
 * devuelve el motivo para mostrarlo en pantalla y lo anota en el log de errores de PHP.
 */
function upskill_app_config(): array {
    $file = dirname(__DIR__) . '/config.local.php';
    if (is_file($file)) {
        $config = require $file;
        if (is_array($config)) return $config;
    }
    return [];
}

/** Datos SMTP con valores por defecto de Gmail (smtp.gmail.com, 587, STARTTLS). */
function tienda_mail_config(): array {
    $cfg = upskill_app_config()['smtp'] ?? [];
    if (!is_array($cfg)) $cfg = [];
    $host = trim((string)($cfg['host'] ?? '')) ?: 'smtp.gmail.com';
    $usuario = trim((string)($cfg['username'] ?? ''));
    $password = (string)($cfg['password'] ?? '');
    // Google muestra la contraseña de aplicación en bloques ("abcd efgh ijkl mnop"); se usa sin espacios.
    if (stripos($host, 'gmail.com') !== false) $password = str_replace(' ', '', $password);
    $secure = strtolower(trim((string)($cfg['secure'] ?? ''))) === 'ssl' ? 'ssl' : 'tls';
    return [
        'host' => $host,
        'port' => (int)($cfg['port'] ?? 0) ?: ($secure === 'ssl' ? 465 : 587),
        'secure' => $secure,
        'username' => $usuario,
        'password' => $password,
        'from_email' => trim((string)($cfg['from_email'] ?? '')) ?: $usuario,
        'from_name' => trim((string)($cfg['from_name'] ?? '')) ?: 'Upskill Academy',
    ];
}

/** Carga PHPMailer desde vendor/ (Composer) o desde la copia incluida en lib/PHPMailer. */
function upskill_cargar_phpmailer(): bool {
    if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) return true;
    $autoload = dirname(__DIR__) . '/vendor/autoload.php';
    if (is_file($autoload)) require_once $autoload;
    if (!class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        $lib = dirname(__DIR__) . '/lib/PHPMailer';
        foreach (['Exception', 'PHPMailer', 'SMTP'] as $clase) {
            if (!is_file("$lib/$clase.php")) return false;
            require_once "$lib/$clase.php";
        }
    }
    return class_exists('PHPMailer\\PHPMailer\\PHPMailer');
}

/** Revisa la configuración. Devuelve null si está lista o el motivo en español si falta algo. */
function upskill_correo_problema(?array $cfg = null): ?string {
    $cfg = $cfg ?? tienda_mail_config();
    if (!is_file(dirname(__DIR__) . '/config.local.php')) return 'Falta el archivo config.local.php con los datos de Gmail (copia config.local.php.example).';
    if ($cfg['username'] === '' || $cfg['password'] === '') return 'Faltan el correo de Gmail o la contraseña de aplicación en config.local.php.';
    if ($cfg['username'] === 'tu-correo@gmail.com' || $cfg['password'] === 'TU_CONTRASENA_DE_APLICACION') return 'config.local.php todavía tiene los datos de ejemplo; escribe tu correo de Gmail y tu contraseña de aplicación.';
    if (!filter_var($cfg['from_email'], FILTER_VALIDATE_EMAIL)) return 'El remitente (from_email) de config.local.php no es un correo válido.';
    if (!extension_loaded('openssl')) return 'PHP no tiene habilitada la extensión openssl (php.ini: extension=openssl), necesaria para Gmail.';
    if (!upskill_cargar_phpmailer()) return 'No se encontró PHPMailer (carpeta lib/PHPMailer).';
    return null;
}

/** Traduce los errores de PHPMailer a un mensaje claro. */
function upskill_error_correo(string $detalle): string {
    if (stripos($detalle, 'authenticate') !== false || stripos($detalle, '535') !== false || stripos($detalle, 'Username and Password') !== false) {
        return 'Gmail rechazó el usuario o la contraseña. Usa una contraseña de aplicación de 16 letras (no la contraseña normal) y revisa que la verificación en dos pasos esté activa.';
    }
    if (stripos($detalle, 'connect') !== false) {
        return 'No se pudo conectar con el servidor de Gmail. Revisa la conexión a internet, que el antivirus o firewall no bloquee el puerto ' . tienda_mail_config()['port'] . ' y que openssl esté habilitado.';
    }
    if (stripos($detalle, 'recipient') !== false || stripos($detalle, 'address') !== false) {
        return 'El correo del destinatario no es válido o Gmail lo rechazó.';
    }
    return 'No se pudo enviar el correo: ' . $detalle;
}

/** URL pública del proyecto (por ejemplo http://localhost/upSkillNue) para los enlaces de los correos. */
function upskill_url_base(): string {
    $cfg = upskill_app_config();
    if (!empty($cfg['app_url'])) return rtrim((string)$cfg['app_url'], '/');
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $host = (string)($_SERVER['HTTP_HOST'] ?? 'localhost');
    if (!preg_match('/^[A-Za-z0-9.\-]+(:\d+)?$/', $host)) $host = 'localhost';
    $root = rtrim(str_replace('\\', '/', dirname(dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/api/x.php')))), '/');
    return ($https ? 'https' : 'http') . '://' . $host . $root;
}

function upskill_e(?string $v): string {
    return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Plantilla HTML común con los colores del sistema de diseño. */
function upskill_plantilla_correo(string $titulo, string $contenido): string {
    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>' . upskill_e($titulo) . '</title></head>'
        . '<body style="margin:0;padding:24px;background:#f4f7fd;font-family:Arial,Helvetica,sans-serif;color:#1d1d1f">'
        . '<div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #d8e0ee;border-radius:18px;overflow:hidden">'
        . '<div style="background:#12245c;background:linear-gradient(90deg,#12245c,#1d4ed8);padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold">Upskill Academy</div>'
        . '<div style="padding:28px;font-size:15px;line-height:1.6">' . $contenido . '</div>'
        . '<div style="padding:16px 28px;background:#eef3fb;color:#5b6472;font-size:12px">Este correo se envió automáticamente; no es necesario responderlo. Dudas: soporte@upskillacademy.com</div>'
        . '</div></body></html>';
}

function upskill_boton_correo(string $texto, string $url): string {
    return '<p style="margin:24px 0"><a href="' . upskill_e($url) . '" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold">' . upskill_e($texto) . '</a></p>';
}

/**
 * Envía un correo real por SMTP.
 * Devuelve ['sent'=>bool, 'reason'=>'sent'|'smtp_not_configured'|'smtp_error', 'error'=>mensaje|null].
 */
function upskill_enviar_correo(string $email, string $nombre, string $asunto, string $html, string $texto): array {
    $cfg = tienda_mail_config();
    $problema = upskill_correo_problema($cfg);
    if ($problema !== null) {
        error_log('[Upskill correo] No se envió "' . $asunto . '": ' . $problema);
        return ['sent' => false, 'reason' => 'smtp_not_configured', 'error' => $problema];
    }
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = $cfg['host'];
        $mail->Port = $cfg['port'];
        $mail->SMTPAuth = true;
        $mail->Username = $cfg['username'];
        $mail->Password = $cfg['password'];
        $mail->SMTPSecure = $cfg['secure'] === 'ssl'
            ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        // Límite de espera (segundos) para conectar y para cada respuesta del servidor; sin esto
        // PHPMailer puede esperar hasta 5 minutos y el registro o la compra se quedarían colgados.
        $mail->Timeout = 20;
        $mail->getSMTPInstance()->Timelimit = 20;
        $mail->CharSet = 'UTF-8';
        $mail->setFrom($cfg['from_email'], $cfg['from_name']);
        $mail->addAddress($email, $nombre);
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body = $html;
        $mail->AltBody = $texto;
        $mail->send();
        return ['sent' => true, 'reason' => 'sent', 'error' => null];
    } catch (Throwable $e) {
        $detalle = $mail->ErrorInfo ?: $e->getMessage();
        error_log('[Upskill correo] Error SMTP al enviar "' . $asunto . '" a ' . $email . ': ' . $detalle);
        return ['sent' => false, 'reason' => 'smtp_error', 'error' => upskill_error_correo($detalle)];
    }
}

/** Correo de prueba que el administrador manda desde su panel para comprobar Gmail. */
function correo_prueba(string $email, string $nombre): array {
    $cfg = tienda_mail_config();
    $asunto = 'Correo de prueba - Upskill Academy';
    $html = upskill_plantilla_correo($asunto,
        '<h2 style="margin:0 0 12px;font-size:22px">¡El correo de Upskill Academy funciona!</h2>'
        . '<p style="background:#e8f6ec;border:1px solid #bde5ca;border-radius:10px;padding:12px 14px;color:#17683a">Si estás leyendo esto, la plataforma ya envía correos reales por <strong>' . upskill_e($cfg['host']) . '</strong> desde <strong>' . upskill_e($cfg['from_email']) . '</strong>.</p>'
        . '<p>Con esta misma configuración se envían el correo de solicitud recibida, el de cuenta aprobada con su código de un solo uso y el recibo de compra.</p>'
        . '<p style="font-size:13px;color:#5b6472">Enviado el ' . date('d/m/Y H:i') . '.</p>');
    $texto = 'El correo de Upskill Academy funciona. Enviado por ' . $cfg['host'] . ' desde ' . $cfg['from_email'] . '.';
    return upskill_enviar_correo($email, $nombre, $asunto, $html, $texto);
}

/** Correo 1: la solicitud de registro se recibió y debe esperar la aprobación del administrador. */
function correo_solicitud_recibida(string $email, string $nombre, string $rol): array {
    $tipo = $rol === 'docente' ? 'docente' : 'alumno';
    $asunto = 'Recibimos tu solicitud de registro - Upskill Academy';
    $html = upskill_plantilla_correo($asunto,
        '<h2 style="margin:0 0 12px;font-size:22px">¡Bienvenido a Upskill Academy, ' . upskill_e($nombre) . '!</h2>'
        . '<p>Recibimos tu solicitud de registro como <strong>' . $tipo . '</strong>.</p>'
        . '<p style="background:#fff4dc;border:1px solid #f4d28a;border-radius:10px;padding:12px 14px;color:#875b00"><strong>Tu cuenta está pendiente de aprobación.</strong> Un administrador revisará tus datos y te avisaremos por este medio en cuanto puedas iniciar sesión. Mientras tanto no podrás entrar a la plataforma.</p>'
        . ($tipo === 'alumno' ? '<p>Cuando tu cuenta sea aprobada te enviaremos un <strong>código de descuento personal de un solo uso</strong> para tu primera compra.</p>' : '')
        . '<p>Si tú no hiciste este registro, ignora este correo.</p>');
    $texto = "Hola $nombre: recibimos tu solicitud de registro como $tipo en Upskill Academy. Tu cuenta está pendiente de aprobación por un administrador; te avisaremos por correo cuando puedas iniciar sesión.";
    return upskill_enviar_correo($email, $nombre, $asunto, $html, $texto);
}

/** Correo 2: la cuenta fue aprobada. Para alumnos incluye el código de un solo uso. */
function correo_cuenta_aprobada(string $email, string $nombre, string $rol, ?array $codigo): array {
    $base = upskill_url_base();
    $login = $rol === 'docente' ? $base . '/views/CMR/logdocentes.html' : $base . '/views/logalumno.html';
    $asunto = 'Tu cuenta fue aprobada - Upskill Academy';
    $bloqueCodigo = '';
    $textoCodigo = '';
    if ($codigo) {
        $vence = date('d/m/Y', strtotime((string)$codigo['fecha_fin']));
        $bloqueCodigo = '<p>Como bienvenida, aquí está tu código de descuento:</p>'
            . '<div style="text-align:center;margin:18px 0;padding:16px;border:2px dashed #1d4ed8;border-radius:12px;background:#e6efff">'
            . '<div style="font-size:26px;font-weight:bold;letter-spacing:3px;color:#1e40af">' . upskill_e($codigo['codigo']) . '</div>'
            . '<div style="font-size:14px;color:#1e40af">' . (float)$codigo['valor'] . '% de descuento en tu primera compra</div></div>'
            . '<p style="font-size:13px;color:#5b6472">Código personal de <strong>un solo uso</strong>: solo funciona con tu cuenta y se desactiva al usarlo. Vence el ' . $vence . '. Escríbelo en el checkout, en el campo "Código promocional".</p>';
        $textoCodigo = " Tu código de un solo uso es {$codigo['codigo']} ({$codigo['valor']}% de descuento, vence el $vence).";
    }
    $html = upskill_plantilla_correo($asunto,
        '<h2 style="margin:0 0 12px;font-size:22px">¡Tu cuenta fue aprobada, ' . upskill_e($nombre) . '!</h2>'
        . '<p style="background:#e8f6ec;border:1px solid #bde5ca;border-radius:10px;padding:12px 14px;color:#17683a">Un administrador aprobó tu solicitud. Ya puedes iniciar sesión con el correo y la contraseña que registraste.</p>'
        . upskill_boton_correo('Iniciar sesión', $login)
        . $bloqueCodigo);
    $texto = "Hola $nombre: tu cuenta de Upskill Academy fue aprobada. Ya puedes iniciar sesión en $login." . $textoCodigo;
    return upskill_enviar_correo($email, $nombre, $asunto, $html, $texto);
}

/** Correo 3: recibo (ticket) de compra de la tienda. */
function tienda_enviar_recibo(string $email, string $nombre, array $order): array {
    $safe = static fn($v) => htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $rows = '';
    foreach (($order['productos'] ?? []) as $item) {
        $rows .= '<tr><td style="padding:8px;border-bottom:1px solid #ddd">'.$safe($item['nombre']).'</td><td style="padding:8px;border-bottom:1px solid #ddd">'.(int)$item['cantidad'].'</td><td style="padding:8px;border-bottom:1px solid #ddd">$'.number_format((float)$item['subtotal'],2).' MXN</td></tr>';
    }
    $asunto = 'Recibo de compra ' . $order['folio'] . ' - Upskill Academy';
    $html = upskill_plantilla_correo($asunto, '<h2 style="margin:0 0 12px;font-size:22px">¡Gracias por tu compra, '.$safe($nombre).'!</h2><p>Tu pedido quedó registrado correctamente.</p><h3>Orden: '.$safe($order['folio']).'</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Curso</th><th align="left">Cantidad</th><th align="left">Importe</th></tr></thead><tbody>'.$rows.'</tbody></table><p>Subtotal: $'.number_format((float)$order['subtotal'],2).' MXN</p><p>Descuento: $'.number_format((float)$order['descuento_monto'],2).' MXN</p><p>IVA ('.number_format((float)$order['impuesto_porcentaje'],2).' %): $'.number_format((float)$order['impuesto_monto'],2).' MXN</p><h2>Total pagado: $'.number_format((float)$order['total'],2).' MXN</h2><p>Método: '.$safe($order['metodo_pago']).'</p><p>Conserva este folio para futuras consultas desde Mis pedidos.</p>');
    $texto = 'Compra '.$order['folio'].' confirmada. Total: $'.number_format((float)$order['total'],2).' MXN.';
    return upskill_enviar_correo($email, $nombre, $asunto, $html, $texto);
}
