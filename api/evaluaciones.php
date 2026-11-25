<?php
require_once __DIR__ . '/helpers.php';
$user = require_role('admin');
$pdo = db();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $clienteId = filter_input(INPUT_GET, 'cliente_id', FILTER_VALIDATE_INT);
    if (!$clienteId) json_response(['error' => 'cliente_id es obligatorio.'], 422);
    $stmt = $pdo->prepare('SELECT e.id, e.cliente_id, e.calificacion, e.comentario, e.fecha, e.usuario_id, u.nombre usuario_nombre FROM evaluaciones e INNER JOIN usuarios u ON u.id=e.usuario_id WHERE e.cliente_id=? ORDER BY e.fecha DESC, e.id DESC');
    $stmt->execute([$clienteId]);
    json_response(['evaluaciones' => $stmt->fetchAll()]);
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = body_json();
    $clienteId = filter_var($data['cliente_id'] ?? null, FILTER_VALIDATE_INT);
    $calificacion = filter_var($data['calificacion'] ?? null, FILTER_VALIDATE_INT);
    $comentario = clean_string($data['comentario'] ?? '');
    if (!$clienteId || $calificacion === false || $calificacion < 1 || $calificacion > 5 || $comentario === '') json_response(['error' => 'Cliente, calificación de 1 a 5 y comentario son obligatorios.'], 422);
    $stmt = $pdo->prepare('INSERT INTO evaluaciones (cliente_id, usuario_id, calificacion, comentario) VALUES (?, ?, ?, ?)');
    $stmt->execute([$clienteId, $user['id'], $calificacion, $comentario]);
    json_response(['ok' => true], 201);
}
json_response(['error' => 'Método no permitido.'], 405);
