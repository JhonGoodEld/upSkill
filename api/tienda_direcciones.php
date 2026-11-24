<?php
require_once __DIR__ . '/tienda_helpers.php';
$ctx=require_customer();$clienteId=$ctx['cliente_id'];$pdo=db();$method=$_SERVER['REQUEST_METHOD'];
if($method==='GET'){$st=$pdo->prepare("SELECT * FROM cliente_direcciones WHERE cliente_id=? AND estado_registro='activa' ORDER BY es_predeterminada DESC,id DESC");$st->execute([$clienteId]);json_response(['ok'=>true,'direcciones'=>$st->fetchAll()]);}
require_csrf();$d=body_json();
$fields=['etiqueta','calle','numero_exterior','numero_interior','colonia','municipio','estado','codigo_postal','pais','referencias'];
if($method==='POST'||$method==='PUT'){
 $id=(int)($d['id']??0);$v=[];foreach($fields as $f)$v[$f]=clean_string($d[$f]??'');
 foreach(['calle','numero_exterior','colonia','municipio','estado','codigo_postal'] as $f)if($v[$f]==='')json_response(['error'=>'Completa calle, número exterior, colonia, municipio, estado y código postal.'],422);
 foreach($v as $k=>$x)if(mb_strlen($x)>($k==='referencias'?255:150))json_response(['error'=>'Uno de los campos de dirección supera la longitud permitida.'],422);
 $default=!empty($d['es_predeterminada'])?1:0;
 $pdo->beginTransaction();try{
  if($default)$pdo->prepare("UPDATE cliente_direcciones SET es_predeterminada=0 WHERE cliente_id=?")->execute([$clienteId]);
  if($method==='POST'){$sql='INSERT INTO cliente_direcciones(cliente_id,etiqueta,calle,numero_exterior,numero_interior,colonia,municipio,estado,codigo_postal,pais,referencias,es_predeterminada) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)';$pdo->prepare($sql)->execute([$clienteId,$v['etiqueta']?:'Principal',$v['calle'],$v['numero_exterior'],$v['numero_interior']?:null,$v['colonia'],$v['municipio'],$v['estado'],$v['codigo_postal'],$v['pais']?:'México',$v['referencias']?:null,$default]);$id=(int)$pdo->lastInsertId();}
  else{$st=$pdo->prepare("UPDATE cliente_direcciones SET etiqueta=?,calle=?,numero_exterior=?,numero_interior=?,colonia=?,municipio=?,estado=?,codigo_postal=?,pais=?,referencias=?,es_predeterminada=?,actualizada_en=NOW() WHERE id=? AND cliente_id=? AND estado_registro='activa'");$st->execute([$v['etiqueta']?:'Principal',$v['calle'],$v['numero_exterior'],$v['numero_interior']?:null,$v['colonia'],$v['municipio'],$v['estado'],$v['codigo_postal'],$v['pais']?:'México',$v['referencias']?:null,$default,$id,$clienteId]);if(!$st->rowCount())throw new RuntimeException('Dirección no encontrada o sin cambios.');}
  if($default===1){$pdo->prepare('UPDATE cliente_direcciones SET es_predeterminada=0 WHERE cliente_id=? AND id<>?')->execute([$clienteId,$id]);}
  $pdo->commit();json_response(['ok'=>true,'mensaje'=>'Dirección guardada.']);
 }catch(PDOException $e){if($pdo->inTransaction())$pdo->rollBack();error_log('[Upskill address] '.$e->getMessage());json_response(['error'=>'No fue posible guardar la dirección por un error interno.'],500);}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();json_response(['error'=>$e->getMessage()],422);}
}
if($method==='DELETE'){$id=(int)($d['id']??0);if(!$id)json_response(['error'=>'Dirección inválida.'],422);$st=$pdo->prepare("UPDATE cliente_direcciones SET estado_registro='inactiva',es_predeterminada=0,actualizada_en=NOW() WHERE id=? AND cliente_id=?");$st->execute([$id,$clienteId]);json_response(['ok'=>true,'mensaje'=>'Dirección retirada de tu lista.']);}
json_response(['error'=>'Método no permitido.'],405);
