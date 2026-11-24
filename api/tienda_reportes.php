<?php
require_once __DIR__ . '/helpers.php';
require_role('admin','ventas');$pdo=db();if($_SERVER['REQUEST_METHOD']!=='GET')json_response(['error'=>'Método no permitido.'],405);
$summary=$pdo->query("SELECT COUNT(*) monederos,COALESCE(SUM(saldo),0) saldo_total FROM monederos")->fetch();
$mov=$pdo->query("SELECT COALESCE(SUM(CASE WHEN tipo='recarga' THEN monto ELSE 0 END),0) recargas,COALESCE(SUM(CASE WHEN tipo='compra' THEN ABS(monto) ELSE 0 END),0) consumos,COALESCE(SUM(CASE WHEN tipo='reembolso' THEN monto ELSE 0 END),0) reembolsos,COUNT(*) movimientos FROM monedero_movimientos")->fetch();
$top=$pdo->query("SELECT c.nombre,c.correo,m.saldo FROM monederos m JOIN clientes c ON c.id=m.cliente_id ORDER BY m.saldo DESC LIMIT 10")->fetchAll();
$monthly=$pdo->query("SELECT DATE_FORMAT(fecha,'%Y-%m') mes,COALESCE(SUM(CASE WHEN tipo='recarga' THEN monto ELSE 0 END),0) recargas,COALESCE(SUM(CASE WHEN tipo='compra' THEN ABS(monto) ELSE 0 END),0) consumos,COALESCE(SUM(CASE WHEN tipo='reembolso' THEN monto ELSE 0 END),0) reembolsos FROM monedero_movimientos WHERE fecha>=DATE_SUB(CURDATE(),INTERVAL 6 MONTH) GROUP BY DATE_FORMAT(fecha,'%Y-%m') ORDER BY mes")->fetchAll();
json_response(['ok'=>true,'resumen'=>['monederos'=>(int)$summary['monederos'],'saldo_total'=>(float)$summary['saldo_total'],'recargas'=>(float)$mov['recargas'],'consumos'=>(float)$mov['consumos'],'reembolsos'=>(float)$mov['reembolsos'],'movimientos'=>(int)$mov['movimientos']],'saldos_por_cliente'=>$top,'movimientos_por_mes'=>$monthly]);
