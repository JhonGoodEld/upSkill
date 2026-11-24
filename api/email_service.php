<?php
/**
 * Envío opcional de recibos por SMTP usando PHPMailer.
 * La compra no se revierte si el servicio SMTP no está configurado o falla.
 */
function tienda_mail_config(): array {
    $file = dirname(__DIR__) . '/config.local.php';
    if (is_file($file)) {
        $config = require $file;
        if (is_array($config) && isset($config['smtp'])) return $config['smtp'];
    }
    return [];
}

function tienda_enviar_recibo(string $email, string $nombre, array $order): array {
    $cfg = tienda_mail_config();
    $autoload = dirname(__DIR__) . '/vendor/autoload.php';
    if (!is_file($autoload) || empty($cfg['host']) || empty($cfg['username']) || empty($cfg['password']) || empty($cfg['from_email'])) {
        return ['sent'=>false,'reason'=>'smtp_not_configured'];
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
        $safe = static fn($v) => htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $rows = '';
        foreach (($order['productos'] ?? []) as $item) {
            $rows .= '<tr><td style="padding:8px;border-bottom:1px solid #ddd">'.$safe($item['nombre']).'</td><td style="padding:8px;border-bottom:1px solid #ddd">'.(int)$item['cantidad'].'</td><td style="padding:8px;border-bottom:1px solid #ddd">$'.number_format((float)$item['subtotal'],2).' MXN</td></tr>';
        }
        $mail->Subject = 'Recibo de compra ' . $order['folio'] . ' - Upskill Academy';
        $mail->Body = '<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#172033"><h2>¡Gracias por tu compra, '.$safe($nombre).'!</h2><p>Tu pedido quedó registrado correctamente.</p><h3>Orden: '.$safe($order['folio']).'</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Curso</th><th align="left">Cantidad</th><th align="left">Importe</th></tr></thead><tbody>'.$rows.'</tbody></table><p>Subtotal: $'.number_format((float)$order['subtotal'],2).' MXN</p><p>Descuento: $'.number_format((float)$order['descuento_monto'],2).' MXN</p><p>IVA ('.number_format((float)$order['impuesto_porcentaje'],2).' %): $'.number_format((float)$order['impuesto_monto'],2).' MXN</p><h2>Total pagado: $'.number_format((float)$order['total'],2).' MXN</h2><p>Método: '.$safe($order['metodo_pago']).'</p><p>Conserva este folio para futuras consultas desde Mis pedidos.</p></div>';
        $mail->AltBody = 'Compra '.$order['folio'].' confirmada. Total: $'.number_format((float)$order['total'],2).' MXN.';
        $mail->send();
        return ['sent'=>true,'reason'=>'sent'];
    } catch (Throwable $e) {
        error_log('[Upskill SMTP] '.$e->getMessage());
        return ['sent'=>false,'reason'=>'smtp_error'];
    }
}
