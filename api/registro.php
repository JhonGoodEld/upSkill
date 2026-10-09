<?php
require_once __DIR__ . '/helpers.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['error' => 'Método no permitido.'], 405);

$d = body_json();
$nombre = clean_string($d['nombre'] ?? '');
$correo = clean_string($d['correo'] ?? '');
$password = (string)($d['password'] ?? '');
$rol = clean_string($d['rol'] ?? '');
$telefono = clean_string($d['telefono'] ?? '');
$empresa = clean_string($d['empresa'] ?? '');
$especialidad = clean_string($d['especialidad'] ?? '');
$curso = clean_string($d['curso_solicitado'] ?? '');

if ($nombre === '' || $correo === '' || $password === '' || $telefono === '' || !in_array($rol, ['alumno','docente'], true)) {
    json_response(['error' => 'Nombre, correo, teléfono, contraseña y tipo de usuario son obligatorios.'], 422);
}
if (!validate_name($nombre)) json_response(['error' => 'El nombre solo puede contener letras y espacios.'], 422);
if (!validate_email($correo)) json_response(['error' => 'El correo no tiene un formato válido y no puede contener espacios.'], 422);
if (!preg_match('/^\d{10}$|^\d{3} \d{3} \d{4}$/', $telefono)) json_response(['error' => 'El teléfono debe tener el formato 4492255316 o 449 225 5316.'], 422);
if (preg_match('/\s/', $password)) json_response(['error' => 'La contraseña no puede contener espacios.'], 422);
if (strlen($password) < 8) json_response(['error' => 'La contraseña debe tener al menos 8 caracteres.'], 422);
if ($rol === 'docente' && $especialidad === '') json_response(['error' => 'El área de expertise es obligatoria para docentes.'], 422);

$pdo = db();
$check = $pdo->prepare("SELECT 1 FROM usuarios WHERE correo=? UNION SELECT 1 FROM solicitudes_registro WHERE correo=? AND estado='pendiente' LIMIT 1");
$check->execute([$correo, $correo]);
if ($check->fetchColumn()) json_response(['error' => 'Ya existe una cuenta o una solicitud pendiente con ese correo.'], 409);

$empresaFinal = $empresa !== '' ? $empresa : ($rol === 'docente' ? 'Upskill Academy - Docente' : 'Particular');
$hash = password_hash($password, PASSWORD_DEFAULT);
$st = $pdo->prepare('INSERT INTO solicitudes_registro(nombre,correo,password_hash,rol,telefono,empresa,especialidad,curso_solicitado,estado) VALUES(?,?,?,?,?,?,?,?,\'pendiente\')');
$st->execute([$nombre,$correo,$hash,$rol,$telefono,$empresaFinal,$especialidad ?: null,$curso ?: null]);

json_response([
    'ok' => true,
    'mensaje' => 'Tu solicitud fue enviada al administrador. No podrás iniciar sesión hasta que sea aprobada.'
], 201);
