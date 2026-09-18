<?php
require_once __DIR__ . '/helpers.php';
require_role('admin');
$pdo=db();
try {
    $exists=$pdo->query("SHOW TABLES LIKE 'solicitudes_registro'")->fetchColumn();
    if(!$exists) json_response(['ok'=>false,'error'=>'La tabla solicitudes_registro no existe. Ejecuta sql/migracion_crm_2026_09.sql.'],500);
    $total=(int)$pdo->query("SELECT COUNT(*) FROM solicitudes_registro")->fetchColumn();
    $pend=(int)$pdo->query("SELECT COUNT(*) FROM solicitudes_registro WHERE estado='pendiente'")->fetchColumn();
    json_response(['ok'=>true,'tabla'=>'solicitudes_registro','total'=>$total,'pendientes'=>$pend]);
} catch(Throwable $e) { json_response(['ok'=>false,'error'=>$e->getMessage()],500); }
