<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/actividad_feed.php';

require_role('admin');
$pdo = db();
$mes = clean_string($_GET['mes'] ?? '');
$usuarioIdRaw = clean_string($_GET['usuario_id'] ?? '');
$usuarioId = null;

if ($mes !== '' && !preg_match('/^\d{4}-\d{2}$/', $mes)) {
    json_response(['error' => 'Mes inválido. Usa YYYY-MM.'], 422);
}
if ($usuarioIdRaw !== '') {
    $usuarioId = filter_var($usuarioIdRaw, FILTER_VALIDATE_INT);
    if (!$usuarioId || $usuarioId < 1) json_response(['error' => 'Filtro de usuario inválido.'], 422);
    $check = $pdo->prepare("SELECT id FROM usuarios WHERE id = ? AND rol IN ('admin','ventas') LIMIT 1");
    $check->execute([$usuarioId]);
    if (!$check->fetchColumn()) json_response(['error' => 'El usuario seleccionado no existe o no pertenece a Administración/Ventas.'], 422);
}

$actividad = obtener_actividad_sistema($pdo, $mes, $usuarioId);
$usuarios = $pdo->query("SELECT id,nombre,rol,estado FROM usuarios WHERE rol IN ('admin','ventas') ORDER BY CASE rol WHEN 'admin' THEN 1 ELSE 2 END,nombre")
    ->fetchAll(PDO::FETCH_ASSOC);

json_response(['actividad' => $actividad, 'usuarios' => $usuarios]);
