<?php
require_once __DIR__ . '/helpers.php';
require_role('admin');
$pdo = db();
function telefono_valido(string $t): bool { return (bool)preg_match('/^(?:\d{10}|\d{3} \d{3} \d{4})$/', $t); }
if ($_SERVER['REQUEST_METHOD']==='GET') {
  $stmt=$pdo->query('SELECT id,nombre,correo,telefono,empresa,fecha_registro,estado,etapa_crm FROM clientes ORDER BY id ASC');
  json_response(['clientes'=>$stmt->fetchAll()]);
}
if ($_SERVER['REQUEST_METHOD']==='POST') {
  $d=body_json(); $nombre=clean_string($d['nombre']??''); $correo=clean_string($d['correo']??'');
  $telefono=clean_string($d['telefono']??''); $empresa=clean_string($d['empresa']??''); $estado=clean_string($d['estado']??'activo'); $etapa=clean_string($d['etapa_crm']??'Prospecto');
  if($nombre===''||$correo===''||$telefono===''||$empresa==='') json_response(['error'=>'Nombre, correo, teléfono y empresa son obligatorios.'],422);
  if(!validate_name($nombre)) json_response(['error'=>'El nombre solo puede contener letras y espacios.'],422);
  if(!validate_email($correo)) json_response(['error'=>'El correo no tiene un formato válido.'],422);
  if(!telefono_valido($telefono)) json_response(['error'=>'El teléfono debe tener 10 dígitos: 4492255316 o 449 225 5316.'],422);
  if(!in_array($estado,['activo','inactivo'],true)) json_response(['error'=>'Estado inválido.'],422);
  if(!in_array($etapa,['Prospecto','Activo','Frecuente','Inactivo'],true)) json_response(['error'=>'Etapa CRM inválida.'],422);
  try { $st=$pdo->prepare('INSERT INTO clientes(nombre,correo,telefono,empresa,fecha_registro,estado,etapa_crm) VALUES(?,?,?,?,CURDATE(),?,?)'); $st->execute([$nombre,$correo,$telefono,$empresa,$estado,$etapa]); $id=(int)$pdo->lastInsertId(); $st=$pdo->prepare('SELECT id,nombre,correo,telefono,empresa,fecha_registro,estado,etapa_crm FROM clientes WHERE id=?');$st->execute([$id]);json_response(['ok'=>true,'cliente'=>$st->fetch()],201); }
  catch(PDOException $e){ if($e->getCode()==='23000') json_response(['error'=>'El correo del cliente ya está registrado.'],409); throw $e; }
}
json_response(['error'=>'Método no permitido.'],405);
