<?php
require_once __DIR__ . '/helpers.php';
require_role('admin');
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query('SELECT id, nombre, correo, rol, estado, fecha_registro FROM usuarios ORDER BY id DESC');
    json_response(['usuarios' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = body_json();
    $nombre = clean_string($data['nombre'] ?? '');
    $correo = clean_string($data['correo'] ?? '');
    $password = (string)($data['password'] ?? '');
    $rol = clean_string($data['rol'] ?? 'alumno');
    if ($nombre === '' || $correo === '' || $password === '') json_response(['error' => 'Nombre, correo y contraseña son obligatorios.'], 422);
    if (!validate_name($nombre)) json_response(['error' => 'El nombre solo puede contener letras y espacios.'], 422);
    if (!validate_email($correo)) json_response(['error' => 'El correo no tiene un formato válido.'], 422);
    if (preg_match('/\s/', $password)) json_response(['error' => 'La contraseña no puede contener espacios.'], 422);
    if (strlen($password) < 8) json_response(['error' => 'La contraseña debe tener al menos 8 caracteres.'], 422);
    if (!in_array($rol, ['admin', 'docente', 'alumno'], true)) json_response(['error' => 'Rol inválido.'], 422);
    if ($rol === 'admin' && empty(require_login()['es_superadmin'])) json_response(['error' => 'Solo el administrador principal puede crear otros administradores.'], 403);
    try {
        $stmt = $pdo->prepare('INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)');
        $stmt->execute([$nombre, $correo, password_hash($password, PASSWORD_DEFAULT), $rol]);
        json_response(['ok' => true, 'id' => (int)$pdo->lastInsertId()], 201);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') json_response(['error' => 'El correo ya está registrado.'], 409);
        throw $e;
    }
}
json_response(['error' => 'Método no permitido.'], 405);
