<?php
require_once __DIR__ . '/scm_helpers.php';
require_scm_admin();$pdo=db();if($_SERVER['REQUEST_METHOD']!=='GET')json_response(['error'=>'Método no permitido.'],405);
$totProductos=(int)$pdo->query("SELECT COUNT(*) FROM productos WHERE estado='activo'")->fetchColumn();
$totProv=(int)$pdo->query("SELECT COUNT(*) FROM proveedores WHERE estado='activo'")->fetchColumn();
$pedProceso=(int)$pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado IN ('pendiente','en_proceso')")->fetchColumn();
$stockBajo=(int)$pdo->query("SELECT COUNT(*) FROM productos WHERE estado='activo' AND stock_actual<=stock_minimo")->fetchColumn();
$masVendidos=$pdo->query("SELECT p.id,p.nombre,COALESCE(SUM(m.cantidad),0) total_vendido FROM productos p LEFT JOIN movimientos_inventario m ON m.producto_id=p.id AND m.tipo='salida' AND m.motivo='venta' WHERE p.estado='activo' GROUP BY p.id,p.nombre ORDER BY total_vendido DESC,p.nombre LIMIT 5")->fetchAll();
$rotacionLenta=$pdo->query("SELECT p.id,p.nombre,p.stock_actual,MAX(CASE WHEN m.tipo='salida' THEN m.fecha END) ultima_salida FROM productos p LEFT JOIN movimientos_inventario m ON m.producto_id=p.id WHERE p.estado='activo' GROUP BY p.id,p.nombre,p.stock_actual HAVING ultima_salida IS NULL OR ultima_salida<DATE_SUB(NOW(),INTERVAL 30 DAY) ORDER BY ultima_salida IS NULL DESC,ultima_salida ASC LIMIT 10")->fetchAll();
$critico=$pdo->query("SELECT id,nombre,stock_actual,stock_minimo,estrategia_logistica FROM productos WHERE estado='activo' AND stock_actual<=stock_minimo ORDER BY (stock_minimo-stock_actual) DESC")->fetchAll();
$pushPull=$pdo->query("SELECT estrategia_logistica estrategia,COUNT(*) total FROM productos WHERE estado='activo' GROUP BY estrategia_logistica")->fetchAll();
$mensual=$pdo->query("SELECT DATE_FORMAT(fecha,'%Y-%m') mes,p.estrategia_logistica estrategia,COUNT(*) total FROM movimientos_inventario m JOIN productos p ON p.id=m.producto_id WHERE fecha>=DATE_SUB(CURDATE(),INTERVAL 5 MONTH) GROUP BY DATE_FORMAT(fecha,'%Y-%m'),p.estrategia_logistica ORDER BY mes ASC")->fetchAll();
json_response(['resumen'=>['productos'=>$totProductos,'proveedores'=>$totProv,'pedidos_proceso'=>$pedProceso,'stock_bajo'=>$stockBajo],'productos_mas_vendidos'=>$masVendidos,'rotacion_lenta'=>$rotacionLenta,'inventario_critico'=>$critico,'push_pull'=>$pushPull,'comparativa_mensual'=>$mensual]);
