<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/email_service.php';
$admin = require_role('admin');
$pdo = db();

/**
 * Código de bienvenida personal: 25% de descuento, un solo uso, 30 días de vigencia
 * y ligado al cliente (promociones.cliente_id), así que no aparece en la lista pública
 * ni lo puede usar otra cuenta.
 */
function generar_codigo_bienvenida(PDO $pdo, int $clienteId, string $nombre, int $adminId): array {
    $alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for ($intento = 0; $intento < 10; $intento++) {
        $codigo = 'UPSK-';
        for ($i = 0; $i < 8; $i++) $codigo .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
        $existe = $pdo->prepare('SELECT 1 FROM promociones WHERE codigo=?');
        $existe->execute([$codigo]);
        if (!$existe->fetchColumn()) break;
    }
    $st = $pdo->prepare("INSERT INTO promociones(codigo,nombre,descripcion,tipo_descuento,valor,fecha_inicio,fecha_fin,estado,usos_maximos,usos_actuales,creado_por,cliente_id) VALUES(?,?,?,'porcentaje',25.00,NOW(),DATE_ADD(NOW(),INTERVAL 30 DAY),'activo',1,0,?,?)");
    $st->execute([$codigo, mb_substr('Bienvenida ' . $nombre, 0, 120), 'Código personal de bienvenida: 25% de descuento en la primera compra. Un solo uso.', $adminId, $clienteId]);
    $q = $pdo->prepare('SELECT codigo,valor,fecha_fin FROM promociones WHERE id=?');
    $q->execute([(int)$pdo->lastInsertId()]);
    return $q->fetch();
}

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
        $clienteLookup = $pdo->prepare('SELECT id FROM clientes WHERE correo=? LIMIT 1');
        $clienteLookup->execute([$sol['correo']]);
        $clienteId = (int)$clienteLookup->fetchColumn();
        if ($clienteId > 0) $pdo->prepare('UPDATE usuarios SET cliente_id=? WHERE id=?')->execute([$clienteId,$usuarioId]);
        if ($sol['rol'] === 'alumno' && $clienteId > 0) $pdo->prepare('INSERT INTO monederos(cliente_id,saldo) VALUES(?,0.00) ON DUPLICATE KEY UPDATE cliente_id=VALUES(cliente_id)')->execute([$clienteId]);

        // Los alumnos reciben un código de descuento de un solo uso.
        $codigo = ($sol['rol'] === 'alumno' && $clienteId > 0)
            ? generar_codigo_bienvenida($pdo, $clienteId, $sol['nombre'], (int)$admin['id'])
            : null;

        $up = $pdo->prepare("UPDATE solicitudes_registro SET estado='aprobada',fecha_resolucion=NOW(),resuelto_por=? WHERE id=?");
        $up->execute([$admin['id'], $id]);
        $pdo->commit();

        // El correo se envía después de confirmar la aprobación; si falla, la cuenta ya está activa.
        $correo = correo_cuenta_aprobada($sol['correo'], $sol['nombre'], $sol['rol'], $codigo ?: null);
        json_response([
            'ok' => true,
            'estado' => 'aprobada',
            'usuario_id' => $usuarioId,
            'correo' => $sol['correo'],
            'correo_enviado' => $correo['sent'],
            'codigo' => $codigo['codigo'] ?? null
        ]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
}
json_response(['error' => 'Método no permitido.'], 405);
