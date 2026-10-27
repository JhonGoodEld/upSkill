<?php
require_once __DIR__ . '/erp_helpers.php';
require_erp_user();$pdo=db();$method=$_SERVER['REQUEST_METHOD'];
if($method==='GET'){
  $q=clean_string($_GET['q']??'');$sql="SELECT id,nombre,correo,telefono,empresa,fecha_registro,estado,etapa_crm FROM clientes WHERE estado='activo'";$params=[];
  if($q!==''){$sql.=" AND (nombre LIKE ? OR correo LIKE ? OR empresa LIKE ?)";$like='%'.$q.'%';$params=[$like,$like,$like];}
  $sql.=' ORDER BY nombre ASC';$st=$pdo->prepare($sql);$st->execute($params);json_response(['clientes'=>$st->fetchAll()]);
}
if($method==='POST'){
  $d=body_json();$nombre=clean_string($d['nombre']??'');$correo=clean_string($d['correo']??'');$telefono=clean_string($d['telefono']??'');$empresa=clean_string($d['empresa']??'');
  if($nombre===''||$correo===''||$telefono===''||$empresa==='')json_response(['error'=>'Nombre, correo, teléfono y empresa son obligatorios.'],422);
  if(!validate_name($nombre)||!validate_email($correo)||!erp_phone_valid($telefono))json_response(['error'=>'Verifica nombre, correo y teléfono (10 dígitos).'],422);
  try{$st=$pdo->prepare("INSERT INTO clientes(nombre,correo,telefono,empresa,fecha_registro,estado,etapa_crm) VALUES(?,?,?,?,CURDATE(),'activo','Prospecto')");$st->execute([$nombre,$correo,$telefono,$empresa]);$id=(int)$pdo->lastInsertId();json_response(['ok'=>true,'id'=>$id,'mensaje'=>'Cliente dado de alta desde ERP y disponible en CRM.'],201);}catch(PDOException $e){if($e->getCode()==='23000')json_response(['error'=>'El correo del cliente ya está registrado.'],409);throw $e;}
}
json_response(['error'=>'Método no permitido.'],405);
