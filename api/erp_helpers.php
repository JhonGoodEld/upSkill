<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/scm_helpers.php';

function require_erp_user(): array {
    return require_role('admin','ventas');
}

function erp_folio(PDO $pdo): string {
    $prefix = 'OR-' . date('Y') . '-';
    $st = $pdo->prepare("SELECT folio FROM erp_ordenes WHERE folio LIKE ? ORDER BY id DESC LIMIT 1");
    $st->execute([$prefix.'%']);
    $last = $st->fetchColumn();
    $n = 1;
    if ($last && preg_match('/(\d+)$/', $last, $m)) $n = (int)$m[1] + 1;
    return $prefix . str_pad((string)$n, 4, '0', STR_PAD_LEFT);
}

function erp_phone_valid(string $t): bool {
    return (bool)preg_match('/^(?:\d{10}|\d{3} \d{3} \d{4})$/', $t);
}
