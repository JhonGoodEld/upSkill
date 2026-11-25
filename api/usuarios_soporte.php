<?php
require_once __DIR__ . '/helpers.php';
require_superadmin();$pdo=db();$method=$_SERVER['REQUEST_METHOD'];
if($method==='GET'){$st=$pdo->query("SELECT id,nombre,correo,estado,fecha_registro FROM usuarios WHERE rol='soporte' ORDER BY id DESC");json_response(['ok'=>true,'usuarios'=>$st->fetchAll()]);}
if($method==='POST'){$d=body_json();$name=clean_string($d['nombre']??'');$email=strtolower(clean_string($d['correo']??''));$password=(string)($d['password']??'');if($name===''||!validate_name($name)||!validate_email($email)||strlen($password)<8||preg_match('/\s/',$password))json_response(['error'=>'Nombre, correo válido y contraseña de al menos 8 caracteres son obligatorios.'],422);try{$st=$pdo->prepare("INSERT INTO usuarios(nombre,correo,password_hash,rol,estado,es_superadmin) VALUES(?,?,?,'soporte','activo',0)");$st->execute([$name,$email,password_hash($password,PASSWORD_DEFAULT)]);json_response(['ok'=>true,'mensaje'=>'Cuenta de soporte creada.','id'=>(int)$pdo->lastInsertId()],201);}catch(PDOException $e){if($e->getCode()==='23000')json_response(['error'=>'Ya existe una cuenta con ese correo.'],409);throw $e;}}
json_response(['error'=>'Método no permitido.'],405);
