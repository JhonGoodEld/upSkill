<?php
require_once __DIR__ . '/helpers.php';
$user=require_role('admin'); $mes=clean_string($_GET['mes']??''); $params=[$user['id']];
$sql='SELECT i.id,i.fecha,c.id AS cliente_id,c.nombre AS cliente,i.tipo,i.descripcion,i.responsable FROM interacciones i INNER JOIN clientes c ON c.id=i.cliente_id WHERE i.usuario_id=?';
if($mes!==''){if(!preg_match('/^\d{4}-\d{2}$/',$mes))json_response(['error'=>'Mes inválido. Usa YYYY-MM.'],422);$sql.=" AND DATE_FORMAT(i.fecha,'%Y-%m')=?";$params[]=$mes;}
$sql.=' ORDER BY i.fecha DESC,i.id DESC LIMIT 200';$st=db()->prepare($sql);$st->execute($params);json_response(['actividad'=>$st->fetchAll()]);
