<?php
require_once __DIR__ . '/tienda_helpers.php';
$ctx=require_customer();$user=$ctx['usuario'];$clienteId=$ctx['cliente_id'];$pdo=db();
if($_SERVER['REQUEST_METHOD']==='GET'){
 $st=$pdo->prepare('SELECT id,nombre,correo,telefono,empresa,fecha_registro FROM clientes WHERE id=?');$st->execute([$clienteId]);$cliente=$st->fetch();
 json_response(['ok'=>true,'cliente'=>$cliente]);
}
if($_SERVER['REQUEST_METHOD']==='PUT'){
 require_csrf();$d=body_json();$telefono=clean_string($d['telefono']??'');$empresa=clean_string($d['empresa']??'Particular');
 if(!preg_match('/^(?:\d{10}|\d{3} \d{3} \d{4})$/',$telefono))json_response(['error'=>'El teléfono debe tener 10 dígitos.'],422);
 if($empresa===''||mb_strlen($empresa)>150)json_response(['error'=>'La institución/empresa no es válida.'],422);
 $pdo->prepare('UPDATE clientes SET telefono=?,empresa=? WHERE id=?')->execute([$telefono,$empresa,$clienteId]);
 json_response(['ok'=>true,'mensaje'=>'Datos actualizados. El nombre y el correo de acceso permanecen protegidos.']);
}
json_response(['error'=>'Método no permitido.'],405);
