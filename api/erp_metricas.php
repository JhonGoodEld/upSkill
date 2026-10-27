<?php
require_once __DIR__ . '/erp_helpers.php';require_erp_user();$pdo=db();if($_SERVER['REQUEST_METHOD']!=='GET')json_response(['error'=>'Método no permitido.'],405);
$clientes=(int)$pdo->query("SELECT COUNT(*) FROM clientes WHERE estado='activo'")->fetchColumn();
$ordenes=(int)$pdo->query("SELECT COUNT(*) FROM erp_ordenes")->fetchColumn();
$procesadas=(int)$pdo->query("SELECT COUNT(*) FROM erp_ordenes WHERE estado='procesada'")->fetchColumn();
$ventas=(float)$pdo->query("SELECT COALESCE(SUM(total),0) FROM erp_ordenes WHERE estado='procesada'")->fetchColumn();
$vendidos=(int)$pdo->query("SELECT COALESCE(SUM(d.cantidad),0) FROM erp_orden_detalle d JOIN erp_ordenes o ON o.id=d.orden_id WHERE o.estado='procesada'")->fetchColumn();
$inventario=(int)$pdo->query("SELECT COALESCE(SUM(stock_actual),0) FROM productos WHERE estado='activo'")->fetchColumn();
$top=$pdo->query("SELECT p.nombre,SUM(d.cantidad) total FROM erp_orden_detalle d JOIN erp_ordenes o ON o.id=d.orden_id JOIN productos p ON p.id=d.producto_id WHERE o.estado='procesada' GROUP BY p.id,p.nombre ORDER BY total DESC,p.nombre LIMIT 8")->fetchAll();
$meses=$pdo->query("SELECT DATE_FORMAT(fecha,'%Y-%m') mes,COUNT(*) ordenes,COALESCE(SUM(total),0) ventas FROM erp_ordenes WHERE estado='procesada' AND fecha>=DATE_SUB(CURDATE(),INTERVAL 5 MONTH) GROUP BY DATE_FORMAT(fecha,'%Y-%m') ORDER BY mes")->fetchAll();
$estados=$pdo->query("SELECT estado,COUNT(*) total FROM erp_ordenes GROUP BY estado ORDER BY estado")->fetchAll();
json_response(['resumen'=>['clientes_activos'=>$clientes,'ordenes'=>$ordenes,'ordenes_procesadas'=>$procesadas,'ventas_totales'=>$ventas,'productos_vendidos'=>$vendidos,'inventario_disponible'=>$inventario],'productos_mas_vendidos'=>$top,'ventas_por_mes'=>$meses,'ordenes_por_estado'=>$estados]);
