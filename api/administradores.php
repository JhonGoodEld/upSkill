<?php
require_once __DIR__ . '/helpers.php';
$principal = require_superadmin();
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $st = $pdo->query("SELECT id,nombre,correo,estado,es_superadmin,fecha_registro FROM usuarios WHERE rol='admin' ORDER BY es_superadmin DESC,id ASC");
    json_response(['administradores' => $st->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $d = body_json();
    $nombre = clean_string($d['nombre'] ?? '');
    $correo = clean_string($d['correo'] ?? '');
    $password = (string)($d['password'] ?? '');
    if ($nombre === '' || $correo === '' || $password === '') json_response(['error' => 'Nombre, correo y contraseña son obligatorios.'], 422);
    if (!validate_name($nombre)) json_response(['error' => 'El nombre solo puede contener letras y espacios.'], 422);
    if (!validate_email($correo)) json_response(['error' => 'El correo no es válido.'], 422);
    if (preg_match('/\s/', $password) || strlen($password) < 8) json_response(['error' => 'La contraseña debe tener al menos 8 caracteres y no contener espacios.'], 422);
    try {
        $st = $pdo->prepare("INSERT INTO usuarios(nombre,correo,password_hash,rol,estado,es_superadmin) VALUES(?,?,?,'admin','activo',0)");
        $st->execute([$nombre,$correo,password_hash($password,PASSWORD_DEFAULT)]);
        json_response(['ok'=>true,'id'=>(int)$pdo->lastInsertId()],201);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') json_response(['error'=>'El correo ya está registrado.'],409);
        throw $e;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $d = body_json();
    $id = filter_var($d['id'] ?? null, FILTER_VALIDATE_INT);
    $estado = clean_string($d['estado'] ?? '');
    if (!$id || !in_array($estado,['activo','inactivo'],true)) json_response(['error'=>'Datos inválidos.'],422);
    $st = $pdo->prepare("SELECT id,es_superadmin FROM usuarios WHERE id=? AND rol='admin' LIMIT 1");
    $st->execute([$id]); $target=$st->fetch();
    if(!$target) json_response(['error'=>'Administrador no encontrado.'],404);
    if((int)$target['es_superadmin']===1) json_response(['error'=>'La cuenta del administrador principal no puede desactivarse.'],403);
    if((int)$id===(int)$principal['id']) json_response(['error'=>'No puedes desactivar tu propia cuenta.'],403);
    $up=$pdo->prepare("UPDATE usuarios SET estado=? WHERE id=? AND rol='admin' AND es_superadmin=0");
    $up->execute([$estado,$id]);
    json_response(['ok'=>true,'estado'=>$estado]);
}
json_response(['error'=>'Método no permitido.'],405);
