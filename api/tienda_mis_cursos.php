<?php
require_once __DIR__ . '/tienda_helpers.php';
$ctx=require_customer();if($_SERVER['REQUEST_METHOD']!=='GET')json_response(['error'=>'Método no permitido.'],405);
$st=db()->prepare("SELECT p.id,p.nombre,p.descripcion,p.imagen,p.duracion,p.categoria,SUM(d.cantidad) AS licencias,MAX(o.fecha) AS ultima_compra FROM erp_orden_detalle d JOIN erp_ordenes o ON o.id=d.orden_id JOIN productos p ON p.id=d.producto_id WHERE o.cliente_id=? AND o.usuario_cliente_id=? AND o.origen='tienda' AND o.estado IN ('procesada','entregada') GROUP BY p.id,p.nombre,p.descripcion,p.imagen,p.duracion,p.categoria ORDER BY ultima_compra DESC");$st->execute([$ctx['cliente_id'],$ctx['usuario']['id']]);json_response(['ok'=>true,'cursos'=>$st->fetchAll()]);
