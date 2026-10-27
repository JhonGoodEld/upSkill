<?php
require_once __DIR__ . '/erp_helpers.php';
$user=require_erp_user();$pdo=db();if($_SERVER['REQUEST_METHOD']!=='POST')json_response(['error'=>'Método no permitido.'],405);
$d=body_json();$id=(int)($d['orden_id']??0);if(!$id)json_response(['error'=>'Orden inválida.'],422);
try{
 $pdo->beginTransaction();
 $st=$pdo->prepare("SELECT id,folio,estado FROM erp_ordenes WHERE id=? FOR UPDATE");$st->execute([$id]);$orden=$st->fetch();if(!$orden)throw new RuntimeException('Orden no encontrada.');if($orden['estado']==='procesada')throw new RuntimeException('La orden ya fue procesada.');if($orden['estado']==='cancelada')throw new RuntimeException('La orden está cancelada.');
 $pdo->prepare("UPDATE erp_ordenes SET estado='procesando',actualizado_en=NOW() WHERE id=?")->execute([$id]);
 $pdo->prepare("INSERT INTO erp_orden_historial(orden_id,estado,descripcion,usuario_id) VALUES(?,'procesando','Validando stock e iniciando procesamiento ERP.',?)")->execute([$id,$user['id']]);
 $st=$pdo->prepare("SELECT d.producto_id,d.cantidad,p.nombre,p.stock_actual FROM erp_orden_detalle d JOIN productos p ON p.id=d.producto_id WHERE d.orden_id=? FOR UPDATE");$st->execute([$id]);$items=$st->fetchAll();if(!$items)throw new RuntimeException('La orden no contiene productos.');
 foreach($items as $it){if((int)$it['stock_actual']<(int)$it['cantidad'])throw new RuntimeException('Stock insuficiente para '.$it['nombre'].'.');}
 foreach($items as $it){$nuevo=(int)$it['stock_actual']-(int)$it['cantidad'];$pdo->prepare("UPDATE productos SET stock_actual=?,actualizado_en=NOW() WHERE id=?")->execute([$nuevo,$it['producto_id']]);
   $detalle='Venta ERP '.$orden['folio'].': salida automática de '.(int)$it['cantidad'].' licencia(s) por orden de cliente.';
   $pdo->prepare("INSERT INTO movimientos_inventario(producto_id,tipo,cantidad,motivo,detalle,fecha,usuario_id,orden_erp_id) VALUES(?,'salida',?,'venta',?,NOW(),?,?)")->execute([$it['producto_id'],$it['cantidad'],$detalle,$user['id'],$id]);
   scm_maybe_generate_push_order($pdo,(int)$it['producto_id'],(int)$user['id']);
 }
 $pdo->prepare("UPDATE erp_ordenes SET estado='procesada',actualizado_en=NOW() WHERE id=?")->execute([$id]);
 $pdo->prepare("INSERT INTO erp_orden_historial(orden_id,estado,descripcion,usuario_id) VALUES(?,'procesada','Inventario actualizado y movimientos de venta registrados automáticamente en SCM.',?)")->execute([$id,$user['id']]);
 $pdo->commit();json_response(['ok'=>true,'mensaje'=>'Orden procesada correctamente. Inventario y movimientos SCM actualizados.']);
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();json_response(['error'=>$e->getMessage()],422);}
