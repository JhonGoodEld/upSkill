<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/scm_helpers.php';

function require_customer(): array {
    $user = require_role('alumno');
    $pdo = db();
    $clienteId = (int)($user['cliente_id'] ?? 0);
    if ($clienteId > 0) {
        $st = $pdo->prepare('SELECT id,nombre,correo,telefono,empresa,estado FROM clientes WHERE id=? LIMIT 1');
        $st->execute([$clienteId]);
        $cliente = $st->fetch();
    } else {
        $st = $pdo->prepare('SELECT id,nombre,correo,telefono,empresa,estado FROM clientes WHERE correo=? LIMIT 1');
        $st->execute([$user['correo']]);
        $cliente = $st->fetch();
    }
    if (!$cliente) {
        $st = $pdo->prepare("INSERT INTO clientes(nombre,correo,telefono,empresa,fecha_registro,estado,etapa_crm) VALUES(?,?, '0000000000','Particular',CURDATE(),'activo','Prospecto')");
        $st->execute([$user['nombre'], $user['correo']]);
        $clienteId = (int)$pdo->lastInsertId();
    } else {
        $clienteId = (int)$cliente['id'];
    }
    $pdo->prepare('UPDATE usuarios SET cliente_id=? WHERE id=? AND (cliente_id IS NULL OR cliente_id<>?)')
        ->execute([$clienteId, $user['id'], $clienteId]);
    $user['cliente_id'] = $clienteId;
    $pdo->prepare('INSERT INTO monederos(cliente_id,saldo) VALUES(?,0.00) ON DUPLICATE KEY UPDATE cliente_id=VALUES(cliente_id)')
        ->execute([$clienteId]);
    return ['usuario' => $user, 'cliente_id' => $clienteId];
}

function require_store_staff(): array {
    return require_role('admin','soporte');
}

function store_active_cart(PDO $pdo, int $clienteId, bool $create = false): ?array {
    $st = $pdo->prepare("SELECT id,cliente_id,estado FROM carritos WHERE cliente_id=? AND estado='activo' ORDER BY id DESC LIMIT 1");
    $st->execute([$clienteId]);
    $cart = $st->fetch();
    if ($cart || !$create) return $cart ?: null;
    $st = $pdo->prepare("INSERT INTO carritos(cliente_id,estado,creado_en,actualizado_en) VALUES(?,'activo',NOW(),NOW())");
    $st->execute([$clienteId]);
    return ['id' => (int)$pdo->lastInsertId(), 'cliente_id' => $clienteId, 'estado' => 'activo'];
}

function store_product_price(array $product): float {
    $base = (float)($product['precio_venta'] ?? 0);
    $discount = max(0, min(100, (float)($product['descuento'] ?? 0)));
    return round($base * (1 - $discount / 100), 2);
}

function store_tax(PDO $pdo): float {
    $st = $pdo->query("SELECT porcentaje FROM impuestos WHERE nombre='IVA' AND estado='activo' ORDER BY id LIMIT 1");
    $value = $st->fetchColumn();
    return $value === false ? 16.0 : (float)$value;
}

function store_wallet(PDO $pdo, int $clienteId, bool $lock = false): array {
    $sql = 'SELECT id,saldo FROM monederos WHERE cliente_id=?' . ($lock ? ' FOR UPDATE' : '');
    $st = $pdo->prepare($sql);
    $st->execute([$clienteId]);
    $wallet = $st->fetch();
    if (!$wallet) {
        $pdo->prepare('INSERT INTO monederos(cliente_id,saldo) VALUES(?,0.00)')->execute([$clienteId]);
        $st = $pdo->prepare('SELECT id,saldo FROM monederos WHERE cliente_id=?' . ($lock ? ' FOR UPDATE' : ''));
        $st->execute([$clienteId]);
        $wallet = $st->fetch();
    }
    return $wallet;
}

function store_promo(PDO $pdo, string $code, bool $lock = false, int $clienteId = 0): ?array {
    if ($code === '') return null;
    // Los códigos personales (cliente_id) solo sirven para su dueño.
    $sql = "SELECT * FROM promociones WHERE codigo=? AND estado='activo' AND NOW() BETWEEN fecha_inicio AND fecha_fin AND (usos_maximos IS NULL OR usos_actuales<usos_maximos) AND (cliente_id IS NULL OR cliente_id=?) LIMIT 1" . ($lock ? ' FOR UPDATE' : '');
    $st = $pdo->prepare($sql);
    $st->execute([strtoupper($code), $clienteId]);
    return $st->fetch() ?: null;
}
