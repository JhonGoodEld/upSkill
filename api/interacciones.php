<?php
require_once __DIR__ . '/helpers.php';
$user=require_role('admin'); $pdo=db();
if($_SERVER['REQUEST_METHOD']==='GET'){
 $clienteId=filter_input(INPUT_GET,'cliente_id',FILTER_VALIDATE_INT); if(!$clienteId)json_response(['error'=>'cliente_id es obligatorio.'],422);
 $st=$pdo->prepare('SELECT i.id,i.cliente_id,i.tipo,i.descripcion,i.fecha,i.responsable,i.usuario_id,u.nombre AS usuario_nombre FROM interacciones i INNER JOIN usuarios u ON u.id=i.usuario_id WHERE i.cliente_id=? ORDER BY i.fecha DESC,i.id DESC');$st->execute([$clienteId]);json_response(['interacciones'=>$st->fetchAll()]);
}
if($_SERVER['REQUEST_METHOD']==='POST'){
 $d=body_json();$clienteId=filter_var($d['cliente_id']??null,FILTER_VALIDATE_INT);$tipo=clean_string($d['tipo']??'');$descripcion=clean_string($d['descripcion']??'');$fecha=clean_string($d['fecha']??'');$responsable=clean_string($d['responsable']??'');
 if(!$clienteId||$tipo===''||$descripcion===''||$responsable==='')json_response(['error'=>'Cliente, tipo, descripción y responsable son obligatorios.'],422); if(!in_array($tipo,['llamada','correo','reunión'],true))json_response(['error'=>'Tipo de interacción inválido.'],422); if(mb_strlen($responsable)>150)json_response(['error'=>'El responsable es demasiado largo.'],422);
 $ch=$pdo->prepare('SELECT id FROM clientes WHERE id=?');$ch->execute([$clienteId]);if(!$ch->fetch())json_response(['error'=>'El cliente no existe.'],404); if($fecha==='')$fecha=date('Y-m-d H:i:s');$ts=strtotime($fecha);if($ts===false)json_response(['error'=>'Fecha inválida.'],422);$fecha=date('Y-m-d H:i:s',$ts);
 $st=$pdo->prepare('INSERT INTO interacciones(cliente_id,tipo,descripcion,fecha,responsable,usuario_id) VALUES(?,?,?,?,?,?)');$st->execute([$clienteId,$tipo,$descripcion,$fecha,$responsable,$user['id']]);$id=(int)$pdo->lastInsertId();$st=$pdo->prepare('SELECT i.id,i.cliente_id,i.tipo,i.descripcion,i.fecha,i.responsable,i.usuario_id,u.nombre AS usuario_nombre FROM interacciones i INNER JOIN usuarios u ON u.id=i.usuario_id WHERE i.id=?');$st->execute([$id]);json_response(['ok'=>true,'interaccion'=>$st->fetch()],201);
}
json_response(['error'=>'Método no permitido.'],405);
