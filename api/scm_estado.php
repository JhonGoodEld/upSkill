<?php
require_once __DIR__ . '/scm_helpers.php';
$user = require_scm_admin();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'];

function scm_level_from_percent(int $p): string {
    if ($p >= 67) return 'Optimizado';
    if ($p >= 34) return 'En desarrollo';
    return 'Inicial';
}

if ($method === 'GET') {
    $cfg = $pdo->query("SELECT * FROM scm_configuracion WHERE id=1")->fetch();

    // Estos conteos sirven como evidencia contextual para el profesor,
    // pero NO marcan automáticamente el checklist.
    $counts = [];
    $counts['productos'] = (int)$pdo->query("SELECT COUNT(*) FROM productos WHERE estado='activo'")->fetchColumn();
    $counts['proveedores'] = (int)$pdo->query("SELECT COUNT(*) FROM proveedores WHERE estado='activo'")->fetchColumn();
    $counts['inventario'] = (int)$pdo->query("SELECT COUNT(*) FROM productos WHERE estado='activo' AND unidad_inventario='Licencia'")->fetchColumn();
    $counts['movimientos'] = (int)$pdo->query("SELECT COUNT(*) FROM movimientos_inventario")->fetchColumn();
    $counts['push'] = (int)$pdo->query("SELECT COUNT(*) FROM productos WHERE estado='activo' AND estrategia_logistica='PUSH'")->fetchColumn();
    $counts['pull'] = (int)$pdo->query("SELECT COUNT(*) FROM productos WHERE estado='activo' AND estrategia_logistica='PULL'")->fetchColumn();
    $counts['pedidos'] = (int)$pdo->query("SELECT COUNT(*) FROM pedidos")->fetchColumn();

    $check = [
        'productos_proveedores' => !empty($cfg['check_productos_proveedores']),
        'inventario' => !empty($cfg['check_inventario']),
        'trazabilidad' => !empty($cfg['check_trazabilidad']),
        'push_pull' => !empty($cfg['check_push_pull']),
        'reportes' => !empty($cfg['check_reportes'])
    ];
    $cumplidos = count(array_filter($check));
    $total = count($check);
    $porcentajeChecklist = $total ? (int)round(($cumplidos / $total) * 100) : 0;

    json_response([
        'estado' => $cfg,
        'checklist' => $check,
        'conteos' => $counts,
        'avance_manual' => [
            'cumplidos' => $cumplidos,
            'total' => $total,
            'porcentaje' => $porcentajeChecklist
        ]
    ]);
}

if ($method === 'PUT') {
    $d = body_json();
    $porcentaje = max(0, min(100, (int)($d['nivel_porcentaje'] ?? 0)));
    $nivel = scm_level_from_percent($porcentaje);
    $desc = clean_string($d['descripcion'] ?? '');
    $check = is_array($d['checklist'] ?? null) ? $d['checklist'] : [];

    $vals = [
        !empty($check['productos_proveedores']) ? 1 : 0,
        !empty($check['inventario']) ? 1 : 0,
        !empty($check['trazabilidad']) ? 1 : 0,
        !empty($check['push_pull']) ? 1 : 0,
        !empty($check['reportes']) ? 1 : 0
    ];

    $st = $pdo->prepare("UPDATE scm_configuracion SET nivel_scm=?,nivel_porcentaje=?,descripcion=?,check_productos_proveedores=?,check_inventario=?,check_trazabilidad=?,check_push_pull=?,check_reportes=?,actualizado_por=? WHERE id=1");
    $st->execute([$nivel,$porcentaje,$desc,...$vals,$user['id']]);

    json_response([
        'ok' => true,
        'mensaje' => 'Progreso SCM guardado correctamente.',
        'nivel_scm' => $nivel,
        'nivel_porcentaje' => $porcentaje,
        'checklist' => [
            'productos_proveedores'=>(bool)$vals[0],
            'inventario'=>(bool)$vals[1],
            'trazabilidad'=>(bool)$vals[2],
            'push_pull'=>(bool)$vals[3],
            'reportes'=>(bool)$vals[4]
        ]
    ]);
}

json_response(['error'=>'Método no permitido.'],405);
