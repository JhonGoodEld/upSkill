<?php
require_once __DIR__ . '/helpers.php';

/**
 * Feed unificado de actividad CRM + ERP + movimientos SCM asociados a órdenes ERP.
 * Si $usuarioId es null devuelve la actividad de administradores y Ventas.
 * Si se indica un ID, limita el resultado a ese usuario.
 *
 * contacto: persona/contacto relacionado con una interacción CRM.
 * folio: folio de la orden cuando el evento procede de ERP o SCM.
 * responsable_nombre/rol: cuenta que ejecutó la acción.
 */
function obtener_actividad_sistema(PDO $pdo, string $mes = '', ?int $usuarioId = null): array {
    $filtros = [
        'i' => ['', '', []],
        'h' => ['', '', []],
        'm' => ['', '', []],
    ];

    foreach (['i', 'h', 'm'] as $alias) {
        if ($usuarioId !== null) {
            $filtros[$alias][0] .= " AND {$alias}.usuario_id = ?";
            $filtros[$alias][2][] = $usuarioId;
        }
        if ($mes !== '') {
            $filtros[$alias][1] .= " AND DATE_FORMAT({$alias}.fecha, '%Y-%m') = ?";
            $filtros[$alias][2][] = $mes;
        }
    }

    [$filtroUsuarioI, $filtroMesI, $paramsI] = $filtros['i'];
    [$filtroUsuarioH, $filtroMesH, $paramsH] = $filtros['h'];
    [$filtroUsuarioM, $filtroMesM, $paramsM] = $filtros['m'];

    $sqlI = "SELECT
        i.id AS registro_id, i.fecha,
        COALESCE(c.nombre, 'Cliente no disponible') AS cliente,
        CONCAT('Interacción · ', i.tipo) AS tipo,
        COALESCE(i.responsable, 'No especificado') AS contacto,
        NULL AS folio,
        COALESCE(u.nombre, 'Usuario no disponible') AS responsable_nombre,
        COALESCE(u.rol, 'desconocido') AS responsable_rol,
        COALESCE(u.nombre, 'Usuario no disponible') AS usuario_nombre,
        COALESCE(u.rol, 'desconocido') AS rol,
        COALESCE(i.responsable, '') AS referencia,
        i.descripcion,
        'CRM' AS modulo
      FROM interacciones i
      LEFT JOIN clientes c ON c.id = i.cliente_id
      LEFT JOIN usuarios u ON u.id = i.usuario_id
      WHERE (u.rol IN ('admin','ventas') OR u.id IS NULL) {$filtroUsuarioI} {$filtroMesI}";

    $sqlH = "SELECT
        h.id AS registro_id, h.fecha,
        COALESCE(c.nombre, 'Cliente no disponible') AS cliente,
        CONCAT('Orden ERP · ', h.estado) AS tipo,
        NULL AS contacto,
        o.folio AS folio,
        COALESCE(u.nombre, 'Usuario no disponible') AS responsable_nombre,
        COALESCE(u.rol, 'desconocido') AS responsable_rol,
        COALESCE(u.nombre, 'Usuario no disponible') AS usuario_nombre,
        COALESCE(u.rol, 'desconocido') AS rol,
        o.folio AS referencia,
        h.descripcion,
        'ERP' AS modulo
      FROM erp_orden_historial h
      INNER JOIN erp_ordenes o ON o.id = h.orden_id
      LEFT JOIN clientes c ON c.id = o.cliente_id
      LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE (u.rol IN ('admin','ventas') OR u.id IS NULL) {$filtroUsuarioH} {$filtroMesH}";

    $sqlM = "SELECT
        m.id AS registro_id, m.fecha,
        COALESCE(c.nombre, 'Cliente no disponible') AS cliente,
        CONCAT('Inventario · ', UPPER(m.tipo), ' (', m.motivo, ')') AS tipo,
        NULL AS contacto,
        o.folio AS folio,
        COALESCE(u.nombre, 'Usuario no disponible') AS responsable_nombre,
        COALESCE(u.rol, 'desconocido') AS responsable_rol,
        COALESCE(u.nombre, 'Usuario no disponible') AS usuario_nombre,
        COALESCE(u.rol, 'desconocido') AS rol,
        o.folio AS referencia,
        CONCAT('Curso: ', p.nombre, ' · Cantidad: ', m.cantidad, ' · ', COALESCE(m.detalle, 'Movimiento vinculado a una orden ERP.')) AS descripcion,
        'SCM' AS modulo
      FROM movimientos_inventario m
      INNER JOIN erp_ordenes o ON o.id = m.orden_erp_id
      INNER JOIN productos p ON p.id = m.producto_id
      LEFT JOIN clientes c ON c.id = o.cliente_id
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.orden_erp_id IS NOT NULL
        AND (u.rol IN ('admin','ventas') OR u.id IS NULL) {$filtroUsuarioM} {$filtroMesM}";

    $rows = [];
    foreach ([[$sqlI, $paramsI], [$sqlH, $paramsH], [$sqlM, $paramsM]] as [$sql, $params]) {
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $rows = array_merge($rows, $st->fetchAll(PDO::FETCH_ASSOC));
    }

    usort($rows, static function (array $a, array $b): int {
        $fa = strtotime((string)($a['fecha'] ?? '')) ?: 0;
        $fb = strtotime((string)($b['fecha'] ?? '')) ?: 0;
        if ($fa !== $fb) return $fb <=> $fa;
        return (int)$b['registro_id'] <=> (int)$a['registro_id'];
    });

    return array_slice($rows, 0, 500);
}
