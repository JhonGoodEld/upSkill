<?php
require_once __DIR__ . '/scm_helpers.php';
require_scm_admin();$pdo=db();$method=$_SERVER['REQUEST_METHOD'];
if($method==='GET'){$st=$pdo->query("SELECT * FROM proveedores WHERE estado='activo' ORDER BY id ASC");json_response(['proveedores'=>$st->fetchAll()]);}
if($method==='POST'||$method==='PUT'){
 $d=body_json();$nombre=clean_string($d['nombre']??'');$contacto=clean_string($d['contacto']??'');$correo=clean_string($d['correo']??'');$telefono=clean_string($d['telefono']??'');$direccion=clean_string($d['direccion']??'');
 if($nombre===''||$contacto===''||$correo===''||$telefono===''||$direccion==='')json_response(['error'=>'Nombre, contacto, correo, teléfono y dirección son obligatorios.'],422);
 if(!validate_email($correo))json_response(['error'=>'Correo inválido.'],422);
 if(!preg_match('/^[0-9 ]{10,15}$/',$telefono))json_response(['error'=>'El teléfono solo puede contener números y espacios.'],422);
 if($method==='POST'){$st=$pdo->prepare("INSERT INTO proveedores(nombre,contacto,correo,telefono,direccion) VALUES(?,?,?,?,?)");$st->execute([$nombre,$contacto,$correo,$telefono,$direccion]);json_response(['ok'=>true,'id'=>(int)$pdo->lastInsertId(),'mensaje'=>'Proveedor creado correctamente.'],201);}
 $id=filter_var($_GET['id']??null,FILTER_VALIDATE_INT);if(!$id)json_response(['error'=>'ID inválido.'],422);$st=$pdo->prepare("UPDATE proveedores SET nombre=?,contacto=?,correo=?,telefono=?,direccion=?,actualizado_en=NOW() WHERE id=? AND estado='activo'");$st->execute([$nombre,$contacto,$correo,$telefono,$direccion,$id]);json_response(['ok'=>true,'mensaje'=>'Proveedor actualizado correctamente.']);
}
//if($method==='DELETE'){$id=filter_var($_GET['id']??null,FILTER_VALIDATE_INT);if(!$id)json_response(['error'=>'ID inválido.'],422);$pdo->prepare("UPDATE proveedores SET estado='inactivo',actualizado_en=NOW() WHERE id=?")->execute([$id]);json_response(['ok'=>true,'mensaje'=>'Proveedor desactivado correctamente.']);}
if ($method === 'DELETE') {

    $id = filter_var(
        $_GET['id'] ?? null,
        FILTER_VALIDATE_INT
    );

    if (!$id) {
        json_response([
            'error' => 'ID inválido.'
        ], 422);
    }


    /*
    |--------------------------------------------------------------------------
    | Verificar proveedor
    |--------------------------------------------------------------------------
    */

    $st = $pdo->prepare("
        SELECT
            id,
            nombre,
            estado
        FROM proveedores
        WHERE id = ?
        LIMIT 1
    ");

    $st->execute([$id]);

    $proveedor = $st->fetch();

    if (!$proveedor) {
        json_response([
            'error' =>
                'El proveedor no existe.'
        ], 404);
    }


    if ($proveedor['estado'] === 'inactivo') {

        json_response([
            'error' =>
                'El proveedor ya se encuentra dado de baja.'
        ], 422);
    }


    /*
    |--------------------------------------------------------------------------
    | Buscar cursos activos asociados
    |--------------------------------------------------------------------------
    */

    $st = $pdo->prepare("
        SELECT COUNT(*)
        FROM productos
        WHERE proveedor_id = ?
          AND estado = 'activo'
    ");

    $st->execute([$id]);

    $cursosActivos =
        (int) $st->fetchColumn();


    /*
    |--------------------------------------------------------------------------
    | Impedir baja si todavía tiene cursos
    |--------------------------------------------------------------------------
    */

    if ($cursosActivos > 0) {

        json_response([
            'error' =>
                "No es posible dar de baja al proveedor "
                . $proveedor['nombre']
                . " porque tiene "
                . $cursosActivos
                . " curso(s) activo(s) asociado(s). "
                . "Primero reasigna esos cursos a otro proveedor "
                . "o dales de baja."
        ], 409);
    }


    /*
    |--------------------------------------------------------------------------
    | Baja lógica
    |--------------------------------------------------------------------------
    */

    $st = $pdo->prepare("
        UPDATE proveedores

        SET
            estado = 'inactivo',
            actualizado_en = NOW()

        WHERE id = ?
          AND estado = 'activo'
    ");

    $st->execute([$id]);


    json_response([
        'ok' => true,

        'mensaje' =>
            'Proveedor dado de baja correctamente. '
            . 'El registro permanece en la base de datos.'
    ]);
}
json_response(['error'=>'Método no permitido.'],405);
