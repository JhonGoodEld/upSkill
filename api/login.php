<?php
require_once __DIR__ . '/helpers.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['error' => 'Método no permitido.'], 405);
require_csrf();

$d = body_json();
$correo = clean_string($d['correo'] ?? '');
$password = (string)($d['password'] ?? '');
$rolSolicitado = clean_string($d['rol'] ?? '');
$portal = clean_string($d['portal'] ?? '');

if ($correo === '' || $password === '') json_response(['error' => 'Correo y contraseña son obligatorios.'], 422);
if (!validate_email($correo)) json_response(['error' => 'El correo no tiene un formato válido.'], 422);
if (preg_match('/\s/', $password)) json_response(['error' => 'La contraseña no puede contener espacios.'], 422);

$pdo = db();
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateKey = hash('sha256', strtolower($correo) . '|' . $ip);
$rate = $pdo->prepare('SELECT intentos,ventana_inicio,bloqueado_hasta FROM login_intentos WHERE clave=?');
$rate->execute([$rateKey]);
$rateRow = $rate->fetch();
if ($rateRow && !empty($rateRow['bloqueado_hasta']) && strtotime($rateRow['bloqueado_hasta']) > time()) {
    json_response(['error' => 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.'], 429);
}

$st = $pdo->prepare('SELECT id,nombre,correo,password_hash,rol,estado,es_superadmin,cliente_id FROM usuarios WHERE correo=? LIMIT 1');
$st->execute([$correo]);
$u = $st->fetch();

if (!$u) {
    // Las cuentas nuevas viven en solicitudes_registro hasta que un administrador las aprueba.
    $st = $pdo->prepare("SELECT password_hash, estado FROM solicitudes_registro WHERE correo=? AND estado IN ('pendiente','rechazada') ORDER BY id DESC LIMIT 1");
    $st->execute([$correo]);
    $solicitud = $st->fetch();
    if ($solicitud && password_verify($password, $solicitud['password_hash'])) {
        if ($solicitud['estado'] === 'pendiente') json_response(['error' => 'Tu solicitud de registro está pendiente de aprobación por un administrador.'], 403);
        json_response(['error' => 'Tu solicitud de registro fue rechazada. Contacta al administrador.'], 403);
    }
}
if (!$u || !password_verify($password, $u['password_hash'])) {
    if (!$rateRow || strtotime($rateRow['ventana_inicio']) < time() - 900) {
        $pdo->prepare('INSERT INTO login_intentos(clave,intentos,ventana_inicio,bloqueado_hasta) VALUES(?,1,NOW(),NULL) ON DUPLICATE KEY UPDATE intentos=1,ventana_inicio=NOW(),bloqueado_hasta=NULL')->execute([$rateKey]);
    } else {
        $attempts = (int)$rateRow['intentos'] + 1;
        $pdo->prepare('UPDATE login_intentos SET intentos=?,bloqueado_hasta=IF(? >= 5,DATE_ADD(NOW(),INTERVAL 15 MINUTE),NULL) WHERE clave=?')->execute([$attempts,$attempts,$rateKey]);
    }
    json_response(['error' => 'Correo o contraseña incorrectos.'], 401);
}
$pdo->prepare('DELETE FROM login_intentos WHERE clave=?')->execute([$rateKey]);
if ($u['estado'] === 'pendiente') json_response(['error' => 'Tu cuenta está pendiente de aprobación por un administrador.'], 403);
if ($u['estado'] === 'inactivo') json_response(['error' => 'Tu cuenta está desactivada. Contacta al administrador.'], 403);
if ($rolSolicitado !== '' && $u['rol'] !== $rolSolicitado) json_response(['error' => 'Esta cuenta no tiene el rol requerido para este acceso.'], 403);
if ($portal === 'gestion' && !in_array($u['rol'], ['admin','logistica','ventas','soporte'], true)) json_response(['error' => 'Esta cuenta no tiene acceso al portal de gestión.'], 403);

session_regenerate_id(true);
$_SESSION['usuario'] = [
    'id' => (int)$u['id'],
    'nombre' => $u['nombre'],
    'correo' => $u['correo'],
    'rol' => $u['rol'],
    'es_superadmin' => (int)$u['es_superadmin'],
    'cliente_id' => isset($u['cliente_id']) ? (int)$u['cliente_id'] : null
];
json_response(['ok' => true, 'usuario' => $_SESSION['usuario']]);
