<?php
require_once __DIR__ . '/helpers.php';

function require_scm_admin(): array {
    return require_role('admin');
}

function scm_folio(PDO $pdo): string {
    $year = date('Y');
    $prefix = 'PC-' . $year . '-';
    $st = $pdo->prepare("SELECT folio FROM pedidos WHERE folio LIKE ? ORDER BY id DESC LIMIT 1");
    $st->execute([$prefix . '%']);
    $last = $st->fetchColumn();
    $n = 1;
    if ($last && preg_match('/(\\d+)$/', $last, $m)) $n = (int)$m[1] + 1;
    return $prefix . str_pad((string)$n, 4, '0', STR_PAD_LEFT);
}

function scm_maybe_generate_push_order(PDO $pdo, int $productoId, int $usuarioId): ?int {
    $st = $pdo->prepare("SELECT id,nombre,stock_actual,stock_minimo,proveedor_id,estrategia_logistica FROM productos WHERE id=? AND estado='activo' FOR UPDATE");
    $st->execute([$productoId]);
    $p = $st->fetch();
    if (!$p || $p['estrategia_logistica'] !== 'PUSH') return null;
    if ((int)$p['stock_actual'] > (int)$p['stock_minimo']) return null;

    $check = $pdo->prepare("SELECT id FROM pedidos WHERE producto_id=? AND tipo='reposición' AND estado IN ('pendiente','en_proceso') LIMIT 1");
    $check->execute([$productoId]);
    if ($check->fetch()) return null;

    // Decisión de implementación: reponer hasta 2 x stock mínimo.
    // El documento exige generar el pedido, pero no fija la cantidad automática.
    $objetivo = max((int)$p['stock_minimo'] * 2, 1);
    $cantidad = max($objetivo - (int)$p['stock_actual'], 1);
    $folio = scm_folio($pdo);
    $ins = $pdo->prepare("INSERT INTO pedidos(folio,producto_id,proveedor_id,cantidad,tipo,estado,origen,notas,creado_por) VALUES(?,?,?,?, 'reposición','pendiente','automatico_push',?,?)");
    $ins->execute([$folio,$productoId,$p['proveedor_id'],$cantidad,'Pedido automático PUSH generado al alcanzar stock mínimo.',$usuarioId]);
    return (int)$pdo->lastInsertId();
}
