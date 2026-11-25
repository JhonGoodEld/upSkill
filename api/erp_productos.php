<?php
require_once __DIR__ . '/erp_helpers.php';
require_erp_user();$pdo=db();
if($_SERVER['REQUEST_METHOD']!=='GET')json_response(['error'=>'Método no permitido.'],405);
$q=clean_string($_GET['q']??'');$sql="SELECT p.id,p.nombre,p.categoria,p.stock_actual,p.stock_minimo,p.precio_venta,p.descuento,(p.precio_venta*(1-COALESCE(p.descuento,0)/100)) precio_final,p.imagen,p.estrategia_logistica,pr.nombre proveedor FROM productos p LEFT JOIN proveedores pr ON pr.id=p.proveedor_id WHERE p.estado='activo'";$params=[];
if($q!==''){$sql.=" AND (p.nombre LIKE ? OR p.categoria LIKE ?)";$like='%'.$q.'%';$params=[$like,$like];}
$sql.=' ORDER BY p.nombre ASC';$st=$pdo->prepare($sql);$st->execute($params);json_response(['productos'=>$st->fetchAll()]);
