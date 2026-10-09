<?php
require_once __DIR__ . '/helpers.php';
require_role('admin');
$pdo = db();

$total = (int)$pdo->query("SELECT COUNT(*) FROM clientes")->fetchColumn();
$activos = (int)$pdo->query("SELECT COUNT(*) FROM clientes WHERE estado='activo'")->fetchColumn();
$inactivos = (int)$pdo->query("SELECT COUNT(*) FROM clientes WHERE estado='inactivo'")->fetchColumn();
$interaccionesMes = (int)$pdo->query("SELECT COUNT(*) FROM interacciones WHERE fecha >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') AND fecha < DATE_ADD(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH)")->fetchColumn();
$interaccionesMesAnterior = (int)$pdo->query("SELECT COUNT(*) FROM interacciones WHERE fecha >= DATE_SUB(DATE_FORMAT(CURRENT_DATE, '%Y-%m-01'), INTERVAL 1 MONTH) AND fecha < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')")->fetchColumn();
$variacion = $interaccionesMesAnterior > 0
    ? round((($interaccionesMes - $interaccionesMesAnterior) / $interaccionesMesAnterior) * 100, 1)
    : ($interaccionesMes > 0 ? 100 : 0);
$sinReciente = (int)$pdo->query("SELECT COUNT(*) FROM clientes c WHERE NOT EXISTS (SELECT 1 FROM interacciones i WHERE i.cliente_id=c.id AND i.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY))")->fetchColumn();
$porTipo = $pdo->query("SELECT tipo, COUNT(*) total FROM interacciones GROUP BY tipo ORDER BY FIELD(tipo,'llamada','correo','reunión')")->fetchAll();
$porEtapa = $pdo->query("SELECT etapa_crm etapa, COUNT(*) total FROM clientes GROUP BY etapa_crm ORDER BY FIELD(etapa_crm,'Prospecto','Activo','Frecuente','Inactivo')")->fetchAll();
$riesgo = $pdo->query("SELECT c.id,c.nombre,c.empresa,c.correo,c.telefono,c.estado,c.etapa_crm,c.fecha_registro,MAX(i.fecha) AS ultima_interaccion FROM clientes c LEFT JOIN interacciones i ON i.cliente_id=c.id GROUP BY c.id,c.nombre,c.empresa,c.correo,c.telefono,c.estado,c.etapa_crm,c.fecha_registro HAVING MAX(i.fecha) IS NULL OR MAX(i.fecha) < DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY MAX(i.fecha) IS NOT NULL ASC, MAX(i.fecha) ASC")->fetchAll();

json_response([
 'total_clientes'=>$total,'clientes_activos'=>$activos,'clientes_inactivos'=>$inactivos,
 'interacciones_mes'=>$interaccionesMes,'interacciones_mes_anterior'=>$interaccionesMesAnterior,
 'variacion_interacciones_porcentaje'=>$variacion,'clientes_sin_interaccion_reciente'=>$sinReciente,
 'interacciones_por_tipo'=>$porTipo,'clientes_por_etapa'=>$porEtapa,'clientes_en_riesgo'=>$riesgo
]);
