<?php
require_once __DIR__ . '/scm_helpers.php';
require_scm_admin();$pdo=db();$method=$_SERVER['REQUEST_METHOD'];
if($method==='GET'){$st=$pdo->query("SELECT * FROM proveedores WHERE estado='activo' ORDER BY id ASC");json_response(['proveedores'=>$st->fetchAll()]);}
if($method==='POST'||$method==='PUT'){
 $d=body_json();$nombre=clean_string($d['nombre']??'');$contacto=clean_string($d['contacto']??'');$correo=clean_string($d['correo']??'');$telefono=clean_string($d['telefono']??'');$direccion=clean_string($d['direccion']??'');
 if($nombre===''||$contacto===''||$correo===''||$telefono==='')json_response(['error'=>'Nombre, contacto, correo y teléfono son obligatorios.'],422);
 if(!validate_email($correo))json_response(['error'=>'Correo inválido.'],422);
 if(!preg_match('/^[0-9 ]{10,15}$/',$telefono))json_response(['error'=>'El teléfono solo puede contener números y espacios.'],422);
 if($method==='POST'){$st=$pdo->prepare("INSERT INTO proveedores(nombre,contacto,correo,telefono,direccion) VALUES(?,?,?,?,?)");$st->execute([$nombre,$contacto,$correo,$telefono,$direccion]);json_response(['ok'=>true,'id'=>(int)$pdo->lastInsertId(),'mensaje'=>'Proveedor creado correctamente.'],201);}
 $id=filter_var($_GET['id']??null,FILTER_VALIDATE_INT);if(!$id)json_response(['error'=>'ID inválido.'],422);$st=$pdo->prepare("UPDATE proveedores SET nombre=?,contacto=?,correo=?,telefono=?,direccion=?,actualizado_en=NOW() WHERE id=? AND estado='activo'");$st->execute([$nombre,$contacto,$correo,$telefono,$direccion,$id]);json_response(['ok'=>true,'mensaje'=>'Proveedor actualizado correctamente.']);
}
if($method==='DELETE'){$id=filter_var($_GET['id']??null,FILTER_VALIDATE_INT);if(!$id)json_response(['error'=>'ID inválido.'],422);$pdo->prepare("UPDATE proveedores SET estado='inactivo',actualizado_en=NOW() WHERE id=?")->execute([$id]);json_response(['ok'=>true,'mensaje'=>'Proveedor desactivado correctamente.']);}
json_response(['error'=>'Método no permitido.'],405);
