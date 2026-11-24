<?php
/**
 * Servicio de correo de Upskill Academy (PHPMailer + SMTP).
 *
 * Correos que envía la plataforma:
 *  - Solicitud de registro recibida (espera la aprobación del administrador).
 *  - Cuenta aprobada, con el código de descuento personal de un solo uso.
 *  - Recibo de compra (ticket) de la tienda.
 *
 * Si SMTP no está configurado (config.local.php + vendor/ de Composer), ningún
 * proceso se interrumpe: el correo se guarda como archivo HTML en logs/correos/
 * para poder revisarlo en una demostración local.
 */
function tienda_mail_config(): array {
    $file = dirname(__DIR__) . '/config.local.php';
    if (is_file($file)) {
        $config = require $file;
        if (is_array($config)) return $config['smtp'] ?? [];
    }
    return [];
}

function upskill_app_config(): array {
    $file = dirname(__DIR__) . '/config.local.php';
    if (is_file($file)) {
        $config = require $file;
        if (is_array($config)) return $config;
    }
    return [];
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

/** Guarda el correo como HTML en logs/correos/ cuando no hay SMTP (modo demostración). */
function upskill_guardar_correo_demo(string $email, string $asunto, string $html): ?string {
    $dir = dirname(__DIR__) . '/logs/correos';
    if (!is_dir($dir) && !@mkdir($dir, 0775, true)) return null;
    $slug = preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $asunto) ?: 'correo'));
    $file = $dir . '/' . date('Ymd-His') . '-' . trim(substr($slug, 0, 60), '-') . '-' . bin2hex(random_bytes(3)) . '.html';
    $cabecera = '<!-- Para: ' . upskill_e($email) . ' | Asunto: ' . upskill_e($asunto) . ' -->';
    return @file_put_contents($file, $cabecera . "\n" . $html) !== false ? $file : null;
}

/** Envía un correo. Devuelve ['sent'=>bool,'reason'=>string]. */
function upskill_enviar_correo(string $email, string $nombre, string $asunto, string $html, string $texto): array {
    $cfg = tienda_mail_config();
    $autoload = dirname(__DIR__) . '/vendor/autoload.php';
    if (!is_file($autoload) || empty($cfg['host']) || empty($cfg['username']) || empty($cfg['password']) || empty($cfg['from_email'])) {
        upskill_guardar_correo_demo($email, $asunto, $html);
        return ['sent' => false, 'reason' => 'smtp_not_configured'];
    }
    require_once $autoload;
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = (string)$cfg['host'];
        $mail->SMTPAuth = true;
        $mail->Username = (string)$cfg['username'];
        $mail->Password = (string)$cfg['password'];
        $mail->Port = (int)($cfg['port'] ?? 587);
        $secure = strtolower((string)($cfg['secure'] ?? 'tls'));
        $mail->SMTPSecure = $secure === 'ssl'
            ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->CharSet = 'UTF-8';
        $mail->setFrom((string)$cfg['from_email'], (string)($cfg['from_name'] ?? 'Upskill Academy'));
        $mail->addAddress($email, $nombre);
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body = $html;
        $mail->AltBody = $texto;
        $mail->send();
        return ['sent' => true, 'reason' => 'sent'];
    } catch (Throwable $e) {
        error_log('[Upskill SMTP] ' . $e->getMessage());
        return ['sent' => false, 'reason' => 'smtp_error'];
    }
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
