<?php
require_once __DIR__ . '/helpers.php';
$admin = require_role('admin');
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $estado = clean_string($_GET['estado'] ?? 'pendiente');
    if (!in_array($estado, ['pendiente','aprobada','rechazada','todos'], true)) json_response(['error' => 'Estado inválido.'], 422);
    $sql = 'SELECT id,nombre,correo,rol,telefono,empresa,especialidad,curso_solicitado,estado,fecha_solicitud,fecha_resolucion FROM solicitudes_registro';
    $params = [];
    if ($estado !== 'todos') { $sql .= ' WHERE estado=?'; $params[] = $estado; }
    $sql .= ' ORDER BY fecha_solicitud ASC, id ASC';
    $st = $pdo->prepare($sql); $st->execute($params);
    json_response(['solicitudes' => $st->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $d = body_json();
    $id = filter_var($d['id'] ?? null, FILTER_VALIDATE_INT);
    $accion = clean_string($d['accion'] ?? '');
    if (!$id || !in_array($accion, ['aprobar','rechazar'], true)) json_response(['error' => 'Solicitud inválida.'], 422);

    $pdo->beginTransaction();
    try {
        $st = $pdo->prepare("SELECT * FROM solicitudes_registro WHERE id=? AND estado='pendiente' FOR UPDATE");
        $st->execute([$id]);
        $sol = $st->fetch();
        if (!$sol) { $pdo->rollBack(); json_response(['error' => 'La solicitud no existe o ya fue resuelta.'], 404); }

        if ($accion === 'rechazar') {
            $up = $pdo->prepare("UPDATE solicitudes_registro SET estado='rechazada',fecha_resolucion=NOW(),resuelto_por=? WHERE id=?");
            $up->execute([$admin['id'], $id]);
            $pdo->commit();
            json_response(['ok' => true, 'estado' => 'rechazada']);
        }

        $exists = $pdo->prepare('SELECT id FROM usuarios WHERE correo=? LIMIT 1');
        $exists->execute([$sol['correo']]);
        if ($exists->fetch()) { $pdo->rollBack(); json_response(['error' => 'Ya existe un usuario con ese correo.'], 409); }

        $newUser = $pdo->prepare("INSERT INTO usuarios(nombre,correo,password_hash,rol,estado,especialidad,curso_solicitado,es_superadmin) VALUES(?,?,?,?, 'activo',?,?,0)");
        $newUser->execute([$sol['nombre'],$sol['correo'],$sol['password_hash'],$sol['rol'],$sol['especialidad'],$sol['curso_solicitado']]);
        $usuarioId = (int)$pdo->lastInsertId();

        $cliente = $pdo->prepare("INSERT INTO clientes(nombre,correo,telefono,empresa,fecha_registro,estado,etapa_crm) VALUES(?,?,?,?,CURRENT_DATE,'activo','Prospecto') ON DUPLICATE KEY UPDATE nombre=VALUES(nombre),telefono=VALUES(telefono),empresa=VALUES(empresa),estado='activo'");
        $cliente->execute([$sol['nombre'],$sol['correo'],$sol['telefono'],$sol['empresa']]);

        $up = $pdo->prepare("UPDATE solicitudes_registro SET estado='aprobada',fecha_resolucion=NOW(),resuelto_por=? WHERE id=?");
        $up->execute([$admin['id'], $id]);
        $pdo->commit();
        json_response(['ok' => true, 'estado' => 'aprobada', 'usuario_id' => $usuarioId]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}
json_response(['error' => 'Método no permitido.'], 405);
