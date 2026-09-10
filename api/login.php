<?php
require_once __DIR__ . '/helpers.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['error' => 'Método no permitido.'], 405);

$d = body_json();
$correo = clean_string($d['correo'] ?? '');
$password = (string)($d['password'] ?? '');
$rolSolicitado = clean_string($d['rol'] ?? '');

if ($correo === '' || $password === '') json_response(['error' => 'Correo y contraseña son obligatorios.'], 422);
if (!validate_email($correo)) json_response(['error' => 'El correo no tiene un formato válido.'], 422);
if (preg_match('/\s/', $password)) json_response(['error' => 'La contraseña no puede contener espacios.'], 422);

$st = db()->prepare('SELECT id,nombre,correo,password_hash,rol,estado,es_superadmin FROM usuarios WHERE correo=? LIMIT 1');
$st->execute([$correo]);
$u = $st->fetch();

if (!$u || !password_verify($password, $u['password_hash'])) json_response(['error' => 'Correo o contraseña incorrectos.'], 401);
if ($u['estado'] === 'pendiente') json_response(['error' => 'Tu cuenta está pendiente de aprobación por un administrador.'], 403);
if ($u['estado'] === 'inactivo') json_response(['error' => 'Tu cuenta está desactivada. Contacta al administrador.'], 403);
if ($rolSolicitado !== '' && $u['rol'] !== $rolSolicitado) json_response(['error' => 'Esta cuenta no tiene el rol requerido para este acceso.'], 403);

session_regenerate_id(true);
$_SESSION['usuario'] = [
    'id' => (int)$u['id'],
    'nombre' => $u['nombre'],
    'correo' => $u['correo'],
    'rol' => $u['rol'],
    'es_superadmin' => (int)$u['es_superadmin']
];
json_response(['ok' => true, 'usuario' => $_SESSION['usuario']]);
