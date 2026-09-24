<?php
require_once __DIR__ . '/scm_helpers.php';
$user = require_scm_admin();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $estrategia = clean_string($_GET['estrategia'] ?? '');
    $sql = "SELECT p.*, pr.nombre proveedor_nombre FROM productos p LEFT JOIN proveedores pr ON pr.id=p.proveedor_id WHERE p.estado='activo'";
    $params = [];
    if ($estrategia !== '') {
        if (!in_array($estrategia,['PUSH','PULL'],true)) json_response(['error'=>'Estrategia inválida.'],422);
        $sql .= " AND p.estrategia_logistica=?"; $params[]=$estrategia;
    }
    $sql .= " ORDER BY p.id ASC";
    $st=$pdo->prepare($sql);$st->execute($params);
    json_response(['productos'=>$st->fetchAll()]);
}

if ($method === 'POST') {
    $d=body_json();
    $nombre=clean_string($d['nombre']??'');$descripcion=clean_string($d['descripcion']??'');$categoria=clean_string($d['categoria']??'');
    $stock=(int)($d['stock_actual']??0);$min=(int)($d['stock_minimo']??0);$prov=(int)($d['proveedor_id']??0);$costo=(float)($d['costo_unitario']??0);$est=clean_string($d['estrategia_logistica']??'PULL');
    if($nombre===''||$categoria==='')json_response(['error'=>'Nombre y categoría son obligatorios.'],422);
    if($stock<0||$min<0||$costo<0)json_response(['error'=>'Stock y costo no pueden ser negativos.'],422);
    if(!in_array($est,['PUSH','PULL'],true))json_response(['error'=>'Estrategia inválida.'],422);
    $prov=$prov>0?$prov:null;
    $st=$pdo->prepare("INSERT INTO productos(nombre,descripcion,categoria,stock_actual,stock_minimo,proveedor_id,costo_unitario,estrategia_logistica) VALUES(?,?,?,?,?,?,?,?)");
    $st->execute([$nombre,$descripcion,$categoria,$stock,$min,$prov,$costo,$est]);
    json_response(['ok'=>true,'id'=>(int)$pdo->lastInsertId(),'mensaje'=>'Producto creado correctamente.'],201);
}

if ($method === 'PUT') {
    $id=filter_var($_GET['id']??null,FILTER_VALIDATE_INT);if(!$id)json_response(['error'=>'ID inválido.'],422);
    $d=body_json();
    $nombre=clean_string($d['nombre']??'');$descripcion=clean_string($d['descripcion']??'');$categoria=clean_string($d['categoria']??'');
    $stock=(int)($d['stock_actual']??0);$min=(int)($d['stock_minimo']??0);$prov=(int)($d['proveedor_id']??0);$costo=(float)($d['costo_unitario']??0);$est=clean_string($d['estrategia_logistica']??'PULL');
    if($nombre===''||$categoria==='')json_response(['error'=>'Nombre y categoría son obligatorios.'],422);
    if($stock<0||$min<0||$costo<0)json_response(['error'=>'Stock y costo no pueden ser negativos.'],422);
    if(!in_array($est,['PUSH','PULL'],true))json_response(['error'=>'Estrategia inválida.'],422);
    $prov=$prov>0?$prov:null;
    $st=$pdo->prepare("UPDATE productos SET nombre=?,descripcion=?,categoria=?,stock_actual=?,stock_minimo=?,proveedor_id=?,costo_unitario=?,estrategia_logistica=?,actualizado_en=NOW() WHERE id=? AND estado='activo'");
    $st->execute([$nombre,$descripcion,$categoria,$stock,$min,$prov,$costo,$est,$id]);
    json_response(['ok'=>true,'mensaje'=>'Producto actualizado correctamente.']);
}

if ($method === 'DELETE') {
    $id=filter_var($_GET['id']??null,FILTER_VALIDATE_INT);if(!$id)json_response(['error'=>'ID inválido.'],422);
    $st=$pdo->prepare("UPDATE productos SET estado='inactivo',actualizado_en=NOW() WHERE id=?");$st->execute([$id]);
    json_response(['ok'=>true,'mensaje'=>'Producto desactivado correctamente.']);
}
json_response(['error'=>'Método no permitido.'],405);
