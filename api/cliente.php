<?php
require_once __DIR__ . '/helpers.php';
require_role('admin');
$pdo=db(); $id=filter_input(INPUT_GET,'id',FILTER_VALIDATE_INT); if(!$id) json_response(['error'=>'ID de cliente inválido.'],400);
function telefono_cliente_valido(string $t): bool { return (bool)preg_match('/^(?:\d{10}|\d{3} \d{3} \d{4})$/', $t); }
if($_SERVER['REQUEST_METHOD']==='GET'){ $st=$pdo->prepare('SELECT id,nombre,correo,telefono,empresa,fecha_registro,estado,etapa_crm FROM clientes WHERE id=?');$st->execute([$id]);$c=$st->fetch();if(!$c)json_response(['error'=>'Cliente no encontrado.'],404);json_response(['cliente'=>$c]); }
if($_SERVER['REQUEST_METHOD']==='PUT'){
 $d=body_json();$nombre=clean_string($d['nombre']??'');$correo=clean_string($d['correo']??'');$telefono=clean_string($d['telefono']??'');$empresa=clean_string($d['empresa']??'');$estado=clean_string($d['estado']??'activo');
 if($nombre===''||$correo===''||$telefono===''||$empresa==='')json_response(['error'=>'Todos los campos son obligatorios.'],422);
 if(!validate_name($nombre))json_response(['error'=>'El nombre solo puede contener letras y espacios.'],422); if(!validate_email($correo))json_response(['error'=>'El correo no tiene formato válido.'],422); if(!telefono_cliente_valido($telefono))json_response(['error'=>'El teléfono debe tener 10 dígitos: 4492255316 o 449 225 5316.'],422); if(!in_array($estado,['activo','inactivo'],true))json_response(['error'=>'Estado inválido.'],422);
 try{$st=$pdo->prepare('UPDATE clientes SET nombre=?,correo=?,telefono=?,empresa=?,estado=? WHERE id=?');$st->execute([$nombre,$correo,$telefono,$empresa,$estado,$id]);$st=$pdo->prepare('SELECT id,nombre,correo,telefono,empresa,fecha_registro,estado,etapa_crm FROM clientes WHERE id=?');$st->execute([$id]);$c=$st->fetch();if(!$c)json_response(['error'=>'Cliente no encontrado.'],404);json_response(['ok'=>true,'cliente'=>$c]);}catch(PDOException $e){if($e->getCode()==='23000')json_response(['error'=>'El correo del cliente ya está registrado.'],409);throw $e;}
}
if($_SERVER['REQUEST_METHOD']==='DELETE'){ $st=$pdo->prepare('DELETE FROM clientes WHERE id=?');$st->execute([$id]);if($st->rowCount()===0)json_response(['error'=>'Cliente no encontrado.'],404);json_response(['ok'=>true]); }
json_response(['error'=>'Método no permitido.'],405);
