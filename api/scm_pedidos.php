<?php
require_once __DIR__ . '/scm_helpers.php';
$user=require_scm_admin();$pdo=db();$method=$_SERVER['REQUEST_METHOD'];

if($method==='GET'){
    $estado=clean_string($_GET['estado']??'');
    $tipo=clean_string($_GET['tipo']??'');
    $estrategia=clean_string($_GET['estrategia']??'');
    $sql="SELECT pe.*,p.nombre producto,p.estrategia_logistica estrategia_actual,pr.nombre proveedor,u.nombre usuario FROM pedidos pe JOIN productos p ON p.id=pe.producto_id LEFT JOIN proveedores pr ON pr.id=pe.proveedor_id JOIN usuarios u ON u.id=pe.creado_por WHERE 1=1";
    $params=[];
    if($estado!==''){$sql.=" AND pe.estado=?";$params[]=$estado;}
    if($tipo!==''){$sql.=" AND pe.tipo=?";$params[]=$tipo;}
    if($estrategia!==''){
        if(!in_array($estrategia,['PUSH','PULL'],true))json_response(['error'=>'Estrategia inválida.'],422);
        $sql.=" AND COALESCE(pe.estrategia_origen,p.estrategia_logistica)=?";$params[]=$estrategia;
    }
    $sql.=" ORDER BY pe.fecha DESC,pe.id DESC";
    $st=$pdo->prepare($sql);$st->execute($params);json_response(['pedidos'=>$st->fetchAll()]);
}

if($method==='POST'){
    $d=body_json();
    $pid=(int)($d['producto_id']??0);$cantidad=(int)($d['cantidad']??0);$tipo=clean_string($d['tipo']??'reposición');$prov=(int)($d['proveedor_id']??0);$fecha=clean_string($d['fecha']??'');$notas=clean_string($d['notas']??'');
    if(!$pid||$cantidad<=0||!in_array($tipo,['reposición','venta'],true))json_response(['error'=>'Curso, cantidad y tipo válidos son obligatorios.'],422);
    if($prov<=0)json_response(['error'=>'Todo pedido debe dirigirse a un proveedor.'],422);

    $stp=$pdo->prepare("SELECT estrategia_logistica,proveedor_id FROM productos WHERE id=? AND estado='activo' LIMIT 1");
    $stp->execute([$pid]);$producto=$stp->fetch();
    if(!$producto)json_response(['error'=>'Curso no encontrado o dado de baja.'],404);
    $stpr=$pdo->prepare("SELECT id FROM proveedores WHERE id=? AND estado='activo' LIMIT 1");$stpr->execute([$prov]);if(!$stpr->fetch())json_response(['error'=>'Proveedor inválido o inactivo.'],422);

    $folio=scm_folio($pdo);$fecha=$fecha!==''?str_replace('T',' ',$fecha):date('Y-m-d H:i:s');
    $estrategia=$producto['estrategia_logistica'];
    $st=$pdo->prepare("INSERT INTO pedidos(folio,producto_id,proveedor_id,cantidad,tipo,estado,origen,estrategia_origen,notas,fecha,creado_por) VALUES(?,?,?,?,?,'pendiente','manual',?,?,?,?)");
    $st->execute([$folio,$pid,$prov,$cantidad,$tipo,$estrategia,$notas,$fecha,$user['id']]);
    json_response(['ok'=>true,'id'=>(int)$pdo->lastInsertId(),'folio'=>$folio,'estrategia_origen'=>$estrategia,'mensaje'=>'Pedido creado correctamente para el proveedor seleccionado.'],201);
}

if($method==='PUT'){
    $id=filter_var($_GET['id']??null,FILTER_VALIDATE_INT);$d=body_json();$estado=clean_string($d['estado']??'');
    if(!$id||!in_array($estado,['pendiente','en_proceso','surtido','cancelado'],true))json_response(['error'=>'Pedido o estado inválidos.'],422);
    try{
        $pdo->beginTransaction();
        $st=$pdo->prepare("SELECT * FROM pedidos WHERE id=? FOR UPDATE");$st->execute([$id]);$p=$st->fetch();if(!$p)throw new RuntimeException('Pedido no encontrado.');
        $anterior=$p['estado'];$pdo->prepare("UPDATE pedidos SET estado=?,actualizado_en=NOW() WHERE id=?")->execute([$estado,$id]);
        $movimiento=null;
        if($estado==='surtido'&&$anterior!=='surtido'){
            $tipoMov=$p['tipo']==='reposición'?'entrada':'salida';$motivo=$p['tipo']==='reposición'?'reposición':'venta';
            $stp=$pdo->prepare("SELECT stock_actual FROM productos WHERE id=? FOR UPDATE");$stp->execute([$p['producto_id']]);$stock=(int)$stp->fetchColumn();
            $nuevo=$tipoMov==='entrada'?$stock+(int)$p['cantidad']:$stock-(int)$p['cantidad'];if($nuevo<0)throw new RuntimeException('Licencias insuficientes para surtir la venta.');
            $pdo->prepare("UPDATE productos SET stock_actual=?,actualizado_en=NOW() WHERE id=?")->execute([$nuevo,$p['producto_id']]);
            $pdo->prepare("INSERT INTO movimientos_inventario(producto_id,tipo,cantidad,motivo,detalle,fecha,usuario_id,pedido_id) VALUES(?,?,?,?,?,NOW(),?,?)")->execute([$p['producto_id'],$tipoMov,$p['cantidad'],$motivo,'Movimiento generado al surtir pedido '.$p['folio'],$user['id'],$id]);
            $movimiento=['tipo'=>$tipoMov,'cantidad'=>(int)$p['cantidad'],'descripcion'=>'Movimiento generado al surtir pedido '.$p['folio'],'stock_actual'=>$nuevo];
            scm_maybe_generate_push_order($pdo,(int)$p['producto_id'],(int)$user['id']);
        }
        $pdo->commit();
        json_response(['ok'=>true,'mensaje'=>'Estado del pedido actualizado correctamente.','movimiento'=>$movimiento]);
    }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();json_response(['error'=>$e->getMessage()],422);}
}
json_response(['error'=>'Método no permitido.'],405);
