<?php
require_once __DIR__ . '/helpers.php';
require_superadmin();
$pdo=db();$method=$_SERVER['REQUEST_METHOD'];

if($method==='GET'){
  $st=$pdo->query("SELECT id,nombre,correo,estado,fecha_registro,actualizado_en FROM usuarios WHERE rol='ventas' ORDER BY id ASC");
  json_response(['usuarios_ventas'=>$st->fetchAll()]);
}

$d=body_json();
if($method==='POST'){
  $nombre=clean_string($d['nombre']??'');$correo=clean_string($d['correo']??'');$password=(string)($d['password']??'');
  if($nombre===''||$correo===''||$password==='')json_response(['error'=>'Nombre, correo y contraseña son obligatorios.'],422);
  if(!validate_name($nombre))json_response(['error'=>'El nombre solo puede contener letras y espacios.'],422);
  if(!validate_email($correo))json_response(['error'=>'Correo inválido.'],422);
  if(strlen($password)<8||preg_match('/\s/',$password))json_response(['error'=>'La contraseña debe tener mínimo 8 caracteres y no contener espacios.'],422);
  try{
    $st=$pdo->prepare("INSERT INTO usuarios(nombre,correo,password_hash,rol,es_superadmin,estado,fecha_registro) VALUES(?,?,?,'ventas',0,'activo',NOW())");
    $st->execute([$nombre,$correo,password_hash($password,PASSWORD_DEFAULT)]);
    json_response(['ok'=>true,'mensaje'=>'Usuario de ventas creado correctamente.'],201);
  }catch(PDOException $e){if($e->getCode()==='23000')json_response(['error'=>'El correo ya está registrado.'],409);throw $e;}
}

if($method==='PUT'){
  $id=(int)($d['id']??0);if(!$id)json_response(['error'=>'ID inválido.'],422);
  $st=$pdo->prepare("SELECT id FROM usuarios WHERE id=? AND rol='ventas' LIMIT 1");$st->execute([$id]);if(!$st->fetch())json_response(['error'=>'Usuario de ventas no encontrado.'],404);
  if(isset($d['estado'])){
    $estado=clean_string($d['estado']);if(!in_array($estado,['activo','inactivo'],true))json_response(['error'=>'Estado inválido.'],422);
    $pdo->prepare("UPDATE usuarios SET estado=?,actualizado_en=NOW() WHERE id=? AND rol='ventas'")->execute([$estado,$id]);
    json_response(['ok'=>true,'mensaje'=>'Estado del usuario de ventas actualizado.']);
  }
  $nombre=clean_string($d['nombre']??'');$correo=clean_string($d['correo']??'');$password=(string)($d['password']??'');
  if($nombre===''||$correo==='')json_response(['error'=>'Nombre y correo son obligatorios.'],422);
  if(!validate_name($nombre)||!validate_email($correo))json_response(['error'=>'Nombre o correo inválido.'],422);
  try{
    if($password!==''){
      if(strlen($password)<8||preg_match('/\s/',$password))json_response(['error'=>'La contraseña debe tener mínimo 8 caracteres y no contener espacios.'],422);
      $pdo->prepare("UPDATE usuarios SET nombre=?,correo=?,password_hash=?,actualizado_en=NOW() WHERE id=? AND rol='ventas'")->execute([$nombre,$correo,password_hash($password,PASSWORD_DEFAULT),$id]);
    }else{
      $pdo->prepare("UPDATE usuarios SET nombre=?,correo=?,actualizado_en=NOW() WHERE id=? AND rol='ventas'")->execute([$nombre,$correo,$id]);
    }
    json_response(['ok'=>true,'mensaje'=>'Usuario de ventas actualizado correctamente.']);
  }catch(PDOException $e){if($e->getCode()==='23000')json_response(['error'=>'El correo ya está registrado.'],409);throw $e;}
}
json_response(['error'=>'Método no permitido.'],405);
