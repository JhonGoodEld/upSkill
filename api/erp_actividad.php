<?php
require_once __DIR__ . '/erp_helpers.php';
require_once __DIR__ . '/actividad_feed.php';

$user = require_erp_user();
$mes = clean_string($_GET['mes'] ?? '');
if ($mes !== '' && !preg_match('/^\d{4}-\d{2}$/', $mes)) {
    json_response(['error' => 'Mes inválido. Usa YYYY-MM.'], 422);
}

$actividad = obtener_actividad_sistema(db(), $mes, (int)$user['id']);
json_response(['actividad' => $actividad]);
