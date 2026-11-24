<?php
// Configuración de conexión para XAMPP / MariaDB.
// Cambia estos valores si tu instalación utiliza otro usuario, contraseña o puerto.
define('DB_HOST', getenv('UPSKILL_DB_HOST') ?: '127.0.0.1');
define('DB_NAME', getenv('UPSKILL_DB_NAME') ?: 'upskill_crm');
define('DB_USER', getenv('UPSKILL_DB_USER') ?: 'root');
define('DB_PASS', getenv('UPSKILL_DB_PASS') !== false ? getenv('UPSKILL_DB_PASS') : '');
define('DB_CHARSET', 'utf8mb4');
define('APP_ENV', getenv('APP_ENV') ?: 'development');

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}
