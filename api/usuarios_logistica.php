<?php
require_once __DIR__ . '/helpers.php';
$principal = require_superadmin();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $st = $pdo->query("SELECT id,nombre,correo,estado,fecha_registro,actualizado_en FROM usuarios WHERE rol='logistica' ORDER BY id ASC");
    json_response(['usuarios_logistica' => $st->fetchAll()]);
}

if ($method === 'POST') {
    $d = body_json();
    $nombre = clean_string($d['nombre'] ?? '');
    $correo = clean_string($d['correo'] ?? '');
    $password = (string)($d['password'] ?? '');
    if ($nombre==='' || $correo==='' || $password==='') json_response(['error'=>'Nombre, correo y contraseña son obligatorios.'],422);
    if (!validate_name($nombre)) json_response(['error'=>'El nombre solo puede contener letras y espacios.'],422);
    if (!validate_email($correo)) json_response(['error'=>'El correo no tiene un formato válido.'],422);
    if (preg_match('/\s/',$password) || strlen($password)<8) json_response(['error'=>'La contraseña debe tener al menos 8 caracteres y no contener espacios.'],422);
    try {
        $st=$pdo->prepare("INSERT INTO usuarios(nombre,correo,password_hash,rol,estado,es_superadmin) VALUES(?,?,?,'logistica','activo',0)");
        $st->execute([$nombre,$correo,password_hash($password,PASSWORD_DEFAULT)]);
        json_response(['ok'=>true,'id'=>(int)$pdo->lastInsertId(),'mensaje'=>'Usuario de logística creado correctamente.'],201);
    } catch (PDOException $e) {
        if ($e->getCode()==='23000') json_response(['error'=>'El correo ya está registrado.'],409);
        throw $e;
    }
}

if ($method === 'PUT') {
    $d=body_json();
    $id=filter_var($d['id']??null,FILTER_VALIDATE_INT);
    if(!$id) json_response(['error'=>'ID inválido.'],422);
    $st=$pdo->prepare("SELECT id,nombre,correo,estado FROM usuarios WHERE id=? AND rol='logistica' LIMIT 1");
    $st->execute([$id]);
    $u=$st->fetch();
    if(!$u) json_response(['error'=>'Usuario de logística no encontrado.'],404);

    if(isset($d['estado'])){
        $estado=clean_string($d['estado']);
        if(!in_array($estado,['activo','inactivo'],true)) json_response(['error'=>'Estado inválido.'],422);
        $pdo->prepare("UPDATE usuarios SET estado=?,actualizado_en=NOW() WHERE id=? AND rol='logistica'")->execute([$estado,$id]);
        json_response(['ok'=>true,'mensaje'=>$estado==='activo'?'Usuario de logística activado correctamente.':'Usuario de logística desactivado correctamente.']);
    }

    $nombre=clean_string($d['nombre']??'');
    $correo=clean_string($d['correo']??'');
    $password=(string)($d['password']??'');
    if($nombre===''||$correo==='') json_response(['error'=>'Nombre y correo son obligatorios.'],422);
    if(!validate_name($nombre)) json_response(['error'=>'El nombre solo puede contener letras y espacios.'],422);
    if(!validate_email($correo)) json_response(['error'=>'Correo inválido.'],422);
    $check=$pdo->prepare("SELECT id FROM usuarios WHERE correo=? AND id<>? LIMIT 1");
    $check->execute([$correo,$id]);
    if($check->fetch()) json_response(['error'=>'Ese correo ya pertenece a otro usuario.'],409);

    if($password!==''){
        if(preg_match('/\s/',$password)||strlen($password)<8) json_response(['error'=>'La contraseña debe tener al menos 8 caracteres y no contener espacios.'],422);
        $pdo->prepare("UPDATE usuarios SET nombre=?,correo=?,password_hash=?,actualizado_en=NOW() WHERE id=? AND rol='logistica'")->execute([$nombre,$correo,password_hash($password,PASSWORD_DEFAULT),$id]);
    } else {
        $pdo->prepare("UPDATE usuarios SET nombre=?,correo=?,actualizado_en=NOW() WHERE id=? AND rol='logistica'")->execute([$nombre,$correo,$id]);
    }
    json_response(['ok'=>true,'mensaje'=>'Usuario de logística actualizado correctamente.']);
}

json_response(['error'=>'Método no permitido.'],405);
