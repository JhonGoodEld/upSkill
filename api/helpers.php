<?php
require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_name('UPSKILL_CRM');
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function json_response($data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function body_json(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    $data = json_decode($raw, true);
    if (!is_array($data)) json_response(['error' => 'JSON inválido.'], 400);
    return $data;
}

function require_login(): array {
    if (empty($_SESSION['usuario'])) {
        json_response(['error' => 'Sesión no autenticada.'], 401);
    }
    return $_SESSION['usuario'];
}

function require_role(string ...$roles): array {
    $user = require_login();
    if (!in_array($user['rol'], $roles, true)) {
        json_response(['error' => 'No tienes permisos para realizar esta operación.'], 403);
    }
    return $user;
}


function require_superadmin(): array {
    $user = require_role('admin');
    if (empty($user['es_superadmin'])) {
        json_response(['error' => 'Solo el administrador principal puede realizar esta operación.'], 403);
    }
    return $user;
}

function clean_string($value): string {
    return trim((string)$value);
}

function validate_email(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false && !preg_match('/\s/', $email);
}

function validate_name(string $name): bool {
    return (bool)preg_match('/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:[ ]+[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/u', $name);
}
