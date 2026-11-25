<?php
require_once __DIR__ . '/erp_helpers.php';
$user=require_erp_user();$pdo=db();$method=$_SERVER['REQUEST_METHOD'];

function orden_detalle(PDO $pdo,int $id): array {
  $st=$pdo->prepare("SELECT o.*,c.nombre cliente,c.correo cliente_correo,c.telefono cliente_telefono,c.empresa,CASE WHEN o.origen='tienda' THEN 'Compra en línea' ELSE u.nombre END usuario FROM erp_ordenes o JOIN clientes c ON c.id=o.cliente_id JOIN usuarios u ON u.id=o.usuario_id WHERE o.id=? LIMIT 1");$st->execute([$id]);$o=$st->fetch();if(!$o)return [];
  $st=$pdo->prepare("SELECT d.*,p.nombre producto,p.imagen FROM erp_orden_detalle d JOIN productos p ON p.id=d.producto_id WHERE d.orden_id=? ORDER BY d.id");$st->execute([$id]);$o['productos']=$st->fetchAll();
  $st=$pdo->prepare("SELECT h.*,u.nombre usuario FROM erp_orden_historial h LEFT JOIN usuarios u ON u.id=h.usuario_id WHERE h.orden_id=? ORDER BY h.fecha DESC,h.id DESC");$st->execute([$id]);$o['historial']=$st->fetchAll();return $o;
}

if($method==='GET'){
  $id=(int)($_GET['id']??0);if($id){$o=orden_detalle($pdo,$id);if(!$o)json_response(['error'=>'Orden no encontrada.'],404);json_response(['orden'=>$o]);}
  $q=clean_string($_GET['q']??'');$estado=clean_string($_GET['estado']??'');$sql="SELECT o.id,o.folio,o.fecha,o.total,o.estado,o.origen,o.metodo_pago,o.pago_estado,c.nombre cliente,CASE WHEN o.origen='tienda' THEN 'Compra en línea' ELSE u.nombre END usuario FROM erp_ordenes o JOIN clientes c ON c.id=o.cliente_id JOIN usuarios u ON u.id=o.usuario_id WHERE 1=1";$params=[];
  if($q!==''){$sql.=" AND (o.folio LIKE ? OR c.nombre LIKE ?)";$like='%'.$q.'%';$params=[$like,$like];}
  if($estado!==''){$sql.=' AND o.estado=?';$params[]=$estado;}
  $sql.=' ORDER BY o.fecha DESC,o.id DESC';$st=$pdo->prepare($sql);$st->execute($params);json_response(['ordenes'=>$st->fetchAll()]);
}

if($method==='POST'){
  $d=body_json();$clienteId=(int)($d['cliente_id']??0);$items=$d['productos']??[];
  if(!$clienteId||!is_array($items)||!count($items))json_response(['error'=>'Selecciona un cliente y al menos un producto.'],422);
  $st=$pdo->prepare("SELECT id FROM clientes WHERE id=? AND estado='activo'");$st->execute([$clienteId]);if(!$st->fetch())json_response(['error'=>'Cliente no encontrado o inactivo.'],422);
  try{$pdo->beginTransaction();$folio=erp_folio($pdo);$total=0;$normal=[];
    foreach($items as $it){$pid=(int)($it['producto_id']??0);$cant=(int)($it['cantidad']??0);if(!$pid||$cant<=0)throw new RuntimeException('Producto o cantidad inválida.');
      $st=$pdo->prepare("SELECT id,nombre,stock_actual,precio_venta,descuento FROM productos WHERE id=? AND estado='activo' FOR UPDATE");$st->execute([$pid]);$p=$st->fetch();if(!$p)throw new RuntimeException('Uno de los cursos ya no está disponible.');if($cant>(int)$p['stock_actual'])throw new RuntimeException('Licencias insuficientes para '.$p['nombre'].'.');
      $precio=(float)$p['precio_venta']*(1-((float)($p['descuento']??0)/100));$subtotal=$precio*$cant;$total+=$subtotal;$normal[]=[$pid,$cant,$precio,$subtotal];
    }
    $st=$pdo->prepare("INSERT INTO erp_ordenes(folio,cliente_id,fecha,estado,total,usuario_id) VALUES(?,?,NOW(),'pendiente',?,?)");$st->execute([$folio,$clienteId,$total,$user['id']]);$oid=(int)$pdo->lastInsertId();
    $ins=$pdo->prepare("INSERT INTO erp_orden_detalle(orden_id,producto_id,cantidad,precio_unitario,subtotal) VALUES(?,?,?,?,?)");foreach($normal as $x)$ins->execute([$oid,$x[0],$x[1],$x[2],$x[3]]);
    $pdo->prepare("INSERT INTO erp_orden_historial(orden_id,estado,descripcion,usuario_id) VALUES(?,'pendiente','Orden creada y pendiente de procesamiento.',?)")->execute([$oid,$user['id']]);$pdo->commit();json_response(['ok'=>true,'orden'=>orden_detalle($pdo,$oid),'mensaje'=>'Orden creada correctamente.'],201);
  }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();json_response(['error'=>$e->getMessage()],422);}
}

if($method==='PUT'){
  $d=body_json();$id=(int)($d['id']??0);$estado=clean_string($d['estado']??'');if(!$id||!in_array($estado,['pendiente','cancelada'],true))json_response(['error'=>'Cambio de estado inválido.'],422);
  $st=$pdo->prepare("SELECT estado FROM erp_ordenes WHERE id=?");$st->execute([$id]);$actual=$st->fetchColumn();if(!$actual)json_response(['error'=>'Orden no encontrada.'],404);if(in_array($actual,['procesada','procesando'],true))json_response(['error'=>'Una orden procesada no puede regresar a pendiente ni cancelarse desde aquí.'],409);
  $pdo->prepare("UPDATE erp_ordenes SET estado=?,actualizado_en=NOW() WHERE id=?")->execute([$estado,$id]);$pdo->prepare("INSERT INTO erp_orden_historial(orden_id,estado,descripcion,usuario_id) VALUES(?,?,?,?)")->execute([$id,$estado,$estado==='cancelada'?'Orden cancelada.':'Orden reabierta como pendiente.',$user['id']]);json_response(['ok'=>true,'mensaje'=>'Estado actualizado.']);
}
json_response(['error'=>'Método no permitido.'],405);
