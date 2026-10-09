<?php

require_once __DIR__ . '/helpers.php';

$user = require_role('admin');
$pdo = db();

/*
|--------------------------------------------------------------------------
| GET
| Obtener perfil propio
|--------------------------------------------------------------------------
*/
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $st = $pdo->prepare("
        SELECT
            id,
            nombre,
            correo,
            rol,
            estado,
            es_superadmin,
            fecha_registro,
            actualizado_en
        FROM usuarios
        WHERE id = ?
        LIMIT 1
    ");

    $st->execute([
        $user['id']
    ]);

    $perfil = $st->fetch();

    if (!$perfil) {
        json_response([
            'error' => 'Usuario no encontrado.'
        ], 404);
    }

    json_response([
        'perfil' => $perfil
    ]);
}

/*
|--------------------------------------------------------------------------
| PUT
| Editar solamente el perfil propio
|--------------------------------------------------------------------------
*/
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {

    $d = body_json();

    $nombre = clean_string($d['nombre'] ?? '');
    $correo = clean_string($d['correo'] ?? '');

    $passwordActual = (string)($d['password_actual'] ?? '');
    $passwordNueva = (string)($d['password_nueva'] ?? '');

    if ($nombre === '' || $correo === '') {
        json_response([
            'error' => 'Nombre y correo son obligatorios.'
        ], 422);
    }

    if (!validate_name($nombre)) {
        json_response([
            'error' => 'El nombre solo puede contener letras y espacios.'
        ], 422);
    }

    if (!validate_email($correo)) {
        json_response([
            'error' => 'El correo no tiene un formato válido.'
        ], 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Evitar correo duplicado
    |--------------------------------------------------------------------------
    */
    $check = $pdo->prepare("
        SELECT id
        FROM usuarios
        WHERE correo = ?
          AND id <> ?
        LIMIT 1
    ");

    $check->execute([
        $correo,
        $user['id']
    ]);

    if ($check->fetch()) {
        json_response([
            'error' => 'Ese correo ya pertenece a otro usuario.'
        ], 409);
    }

    /*
    |--------------------------------------------------------------------------
    | Obtener contraseña actual
    |--------------------------------------------------------------------------
    */
    $st = $pdo->prepare("
        SELECT password_hash
        FROM usuarios
        WHERE id = ?
        LIMIT 1
    ");

    $st->execute([
        $user['id']
    ]);

    $actual = $st->fetch();

    if (!$actual) {
        json_response([
            'error' => 'Usuario no encontrado.'
        ], 404);
    }

    /*
    |--------------------------------------------------------------------------
    | Cambio de contraseña
    |--------------------------------------------------------------------------
    */
    if ($passwordNueva !== '') {

        if ($passwordActual === '') {
            json_response([
                'error' => 'Debes indicar tu contraseña actual para establecer una nueva.'
            ], 422);
        }

        if (!password_verify($passwordActual, $actual['password_hash'])) {
            json_response([
                'error' => 'La contraseña actual es incorrecta.'
            ], 401);
        }

        if (
            preg_match('/\s/', $passwordNueva)
            || strlen($passwordNueva) < 8
        ) {
            json_response([
                'error' => 'La nueva contraseña debe tener al menos 8 caracteres y no contener espacios.'
            ], 422);
        }

        $up = $pdo->prepare("
            UPDATE usuarios
            SET
                nombre = ?,
                correo = ?,
                password_hash = ?,
                actualizado_en = NOW()
            WHERE id = ?
              AND rol = 'admin'
        ");

        $up->execute([
            $nombre,
            $correo,
            password_hash($passwordNueva, PASSWORD_DEFAULT),
            $user['id']
        ]);

    } else {

        $up = $pdo->prepare("
            UPDATE usuarios
            SET
                nombre = ?,
                correo = ?,
                actualizado_en = NOW()
            WHERE id = ?
              AND rol = 'admin'
        ");

        $up->execute([
            $nombre,
            $correo,
            $user['id']
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Actualizar la sesión
    |--------------------------------------------------------------------------
    */
    $_SESSION['usuario']['nombre'] = $nombre;
    $_SESSION['usuario']['correo'] = $correo;

    /*
    |--------------------------------------------------------------------------
    | IMPORTANTE:
    | No se modifica:
    | rol
    | es_superadmin
    | estado
    |--------------------------------------------------------------------------
    */

    json_response([
        'ok' => true,
        'mensaje' => 'Perfil actualizado correctamente.',
        'usuario' => $_SESSION['usuario']
    ]);
}

json_response([
    'error' => 'Método no permitido.'
], 405);