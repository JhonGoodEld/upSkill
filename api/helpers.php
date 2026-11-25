<?php
require_once __DIR__ . '/config.php';

// Cabeceras defensivas para todas las respuestas de la API.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");

if (session_status() === PHP_SESSION_NONE) {
    session_name('UPSKILL_CRM_V2');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/upSkillNue/api/index.php');
    $basePath = preg_replace('~/api/[^/]*$~', '/', $script) ?: '/';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => $basePath,
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// En producción no se deben imprimir trazas, consultas SQL ni rutas del servidor.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
set_exception_handler(static function (Throwable $e): void {
    error_log('[Upskill API] ' . $e->getMessage());
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
    }
    echo json_encode(['error' => 'Ocurrió un error interno al procesar la solicitud. Revisa el registro del servidor.'], JSON_UNESCAPED_UNICODE);
    exit;
});
register_shutdown_function(static function (): void {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        error_log('[Upskill API fatal] ' . $error['message'] . ' en ' . $error['file'] . ':' . $error['line']);
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-store');
            echo json_encode(['error' => 'Error interno del servidor. Revisa el registro de Apache/PHP.'], JSON_UNESCAPED_UNICODE);
        }
    }
});

function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function require_csrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || $token === '' || empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        json_response(['error' => 'La sesión de seguridad expiró. Actualiza la página e inténtalo de nuevo.'], 419);
    }
}

// Todas las operaciones que modifican datos requieren token CSRF.
if (in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['POST','PUT','PATCH','DELETE'], true)) {
    require_csrf();
}


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
    if (empty($_SESSION['usuario']['id'])) {
        json_response(['error' => 'Sesión no autenticada.'], 401);
    }

    /*
     * La sesión no es la fuente definitiva del rol. Se vuelve a consultar
     * MySQL en cada petición protegida para evitar sesiones obsoletas si el
     * administrador cambió roles/estado mientras la sesión seguía abierta.
     */
    $id = (int)$_SESSION['usuario']['id'];
    $st = db()->prepare('SELECT id,nombre,correo,rol,estado,es_superadmin,cliente_id FROM usuarios WHERE id=? LIMIT 1');
    $st->execute([$id]);
    $user = $st->fetch();

    if (!$user) {
        unset($_SESSION['usuario']);
        json_response(['error' => 'La cuenta asociada a esta sesión ya no existe.'], 401);
    }

    if ($user['estado'] !== 'activo') {
        unset($_SESSION['usuario']);
        json_response(['error' => 'La cuenta no está activa.'], 403);
    }

    /* Un superadministrador nunca debe quedar clasificado como logística. */
    if ((int)$user['es_superadmin'] === 1 && $user['rol'] !== 'admin') {
        db()->prepare("UPDATE usuarios SET rol='admin', actualizado_en=NOW() WHERE id=?")
            ->execute([$id]);
        $user['rol'] = 'admin';
    }

    $_SESSION['usuario'] = [
        'id' => (int)$user['id'],
        'nombre' => $user['nombre'],
        'correo' => $user['correo'],
        'rol' => $user['rol'],
        'es_superadmin' => (int)$user['es_superadmin'],
        'cliente_id' => isset($user['cliente_id']) ? (int)$user['cliente_id'] : null
    ];

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
