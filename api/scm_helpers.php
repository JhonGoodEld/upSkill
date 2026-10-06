<?php
require_once __DIR__ . '/helpers.php';

/**
 * Acceso completo al SCM para administradores y usuarios de logística.
 * No concede permisos sobre CRM ni panel administrativo.
 */
function require_scm_admin(): array {
    return require_role('admin', 'logistica');
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
    if (empty($p['proveedor_id'])) return null;

    /*
     * Si ya existe un pedido PUSH pendiente/en proceso, no duplicamos la reposición.
     * Los nuevos pedidos PUSH creados por esta versión se surten de inmediato.
     */
    $check = $pdo->prepare("SELECT id FROM pedidos WHERE producto_id=? AND origen='automatico_push' AND estado IN ('pendiente','en_proceso') LIMIT 1");
    $check->execute([$productoId]);
    if ($check->fetch()) return null;

    // Objetivo de reposición: 2 x stock mínimo.
    $objetivo = max((int)$p['stock_minimo'] * 2, 1);
    $cantidad = max($objetivo - (int)$p['stock_actual'], 1);
    $folio = scm_folio($pdo);

    // El pedido automático queda surtido en la misma transacción.
    $ins = $pdo->prepare("INSERT INTO pedidos(folio,producto_id,proveedor_id,cantidad,tipo,estado,origen,estrategia_origen,notas,fecha,creado_por,actualizado_en) VALUES(?,?,?,?, 'reposición','surtido','automatico_push','PUSH',?,NOW(),?,NOW())");
    $ins->execute([
        $folio,
        $productoId,
        $p['proveedor_id'],
        $cantidad,
        'Pedido automático PUSH generado y surtido al alcanzar el mínimo de licencias disponibles.',
        $usuarioId
    ]);
    $pedidoId = (int)$pdo->lastInsertId();

    $nuevoStock = (int)$p['stock_actual'] + $cantidad;
    $pdo->prepare("UPDATE productos SET stock_actual=?,actualizado_en=NOW() WHERE id=?")
        ->execute([$nuevoStock,$productoId]);

    $pdo->prepare("INSERT INTO movimientos_inventario(producto_id,tipo,cantidad,motivo,detalle,fecha,usuario_id,pedido_id) VALUES(?,'entrada',?,'reposición',?,NOW(),?,?)")
        ->execute([
            $productoId,
            $cantidad,
            'Entrada automática de licencias por reposición PUSH. Pedido '.$folio.' surtido automáticamente.',
            $usuarioId,
            $pedidoId
        ]);

    return $pedidoId;
}
