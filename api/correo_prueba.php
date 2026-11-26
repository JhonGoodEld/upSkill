<?php
/**
 * Estado de la configuración de correo (GET) y envío de un correo de prueba real (POST).
 * Solo administradores. El token CSRF de los POST lo valida helpers.php.
 */
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/email_service.php';
$admin = require_role('admin');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $cfg = tienda_mail_config();
    $problema = upskill_correo_problema($cfg);
    json_response([
        'ok' => true,
        'configurado' => $problema === null,
        'problema' => $problema,
        'servidor' => $cfg['host'] . ':' . $cfg['port'] . ' (' . strtoupper($cfg['secure'] === 'ssl' ? 'ssl' : 'starttls') . ')',
        'remitente' => $cfg['from_email'],
        'correo_admin' => $admin['correo'],
    ]);
}

if ($method === 'POST') {
    $d = body_json();
    $para = strtolower(clean_string($d['para'] ?? '')) ?: $admin['correo'];
    if (!validate_email($para)) json_response(['error' => 'Escribe un correo válido para la prueba.'], 422);
    $r = correo_prueba($para, $admin['nombre']);
    if (!$r['sent']) json_response(['error' => $r['error'] ?? 'No se pudo enviar el correo de prueba.'], 502);
    json_response(['ok' => true, 'mensaje' => "Correo de prueba enviado a $para. Revisa la bandeja de entrada (y la carpeta de spam)."]);
}

json_response(['error' => 'Método no permitido.'], 405);
