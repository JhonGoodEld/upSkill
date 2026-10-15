<?php
require_once __DIR__ . '/scm_helpers.php';
$user=require_scm_admin();$pdo=db();$method=$_SERVER['REQUEST_METHOD'];

if($method==='GET'){
 $producto=filter_var($_GET['producto_id']??null,FILTER_VALIDATE_INT);$tipo=clean_string($_GET['tipo']??'');
 $sql="SELECT m.*,p.nombre producto,u.nombre usuario FROM movimientos_inventario m JOIN productos p ON p.id=m.producto_id JOIN usuarios u ON u.id=m.usuario_id WHERE 1=1";$params=[];
 if($producto){$sql.=" AND m.producto_id=?";$params[]=$producto;}
 if($tipo!==''){if(!in_array($tipo,['entrada','salida'],true))json_response(['error'=>'Tipo inválido.'],422);$sql.=" AND m.tipo=?";$params[]=$tipo;}
 $sql.=" ORDER BY m.fecha DESC,m.id DESC";$st=$pdo->prepare($sql);$st->execute($params);json_response(['movimientos'=>$st->fetchAll()]);
}

if($method==='POST'){
 $d=body_json();$pid=(int)($d['producto_id']??0);$tipo=clean_string($d['tipo']??'');$cantidad=(int)($d['cantidad']??0);$motivo=clean_string($d['motivo']??'otro');$detalle=clean_string($d['detalle']??'');$fecha=clean_string($d['fecha']??'');
 if(!$pid||!in_array($tipo,['entrada','salida'],true)||$cantidad<=0)json_response(['error'=>'Curso, tipo y cantidad válida son obligatorios.'],422);
 if($detalle==='')json_response(['error'=>'El detalle del movimiento es obligatorio.'],422);
 if(!in_array($motivo,['venta','ajuste','reposición','compra','devolución','asignación','inscripción','liberación','reserva','otro'],true))json_response(['error'=>'Motivo inválido.'],422);
 $fecha=$fecha!==''?str_replace('T',' ',$fecha):date('Y-m-d H:i:s');
 try{
   $pdo->beginTransaction();
   $st=$pdo->prepare("SELECT nombre,stock_actual FROM productos WHERE id=? AND estado='activo' FOR UPDATE");$st->execute([$pid]);$curso=$st->fetch();if(!$curso)throw new RuntimeException('Curso no encontrado o dado de baja.');
   $stock=(int)$curso['stock_actual'];$nuevo=$tipo==='entrada'?$stock+$cantidad:$stock-$cantidad;if($nuevo<0)throw new RuntimeException('Licencias insuficientes para registrar la salida.');
   $pdo->prepare("UPDATE productos SET stock_actual=?,actualizado_en=NOW() WHERE id=?")->execute([$nuevo,$pid]);
   $pdo->prepare("INSERT INTO movimientos_inventario(producto_id,tipo,cantidad,motivo,detalle,fecha,usuario_id) VALUES(?,?,?,?,?,?,?)")->execute([$pid,$tipo,$cantidad,$motivo,$detalle,$fecha,$user['id']]);
   $pedido=scm_maybe_generate_push_order($pdo,$pid,(int)$user['id']);
   $pdo->commit();
   $descripcion=$detalle;
   json_response([
     'ok'=>true,
     'stock_actual'=>$nuevo,
     'pedido_push_generado'=>$pedido,
     'movimiento'=>['curso'=>$curso['nombre'],'tipo'=>$tipo,'cantidad'=>$cantidad,'motivo'=>$motivo,'descripcion'=>$descripcion,'usuario'=>$user['nombre'],'fecha'=>$fecha],
     'mensaje'=>$pedido?'Movimiento registrado; la reposición PUSH se generó y se surtió automáticamente.':'Movimiento de inventario registrado correctamente.'
   ],201);
 }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();json_response(['error'=>$e->getMessage()],422);}
}
json_response(['error'=>'Método no permitido.'],405);
