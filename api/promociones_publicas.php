<?php
require_once __DIR__ . '/helpers.php';
if($_SERVER['REQUEST_METHOD']!=='GET')json_response(['error'=>'Método no permitido.'],405);
// Promociones públicas + (si un alumno inició sesión) sus códigos personales de bienvenida.
$clienteId=0;
if(($_SESSION['usuario']['rol']??'')==='alumno')$clienteId=(int)($_SESSION['usuario']['cliente_id']??0);
$st=db()->prepare("SELECT codigo,nombre,descripcion,tipo_descuento,valor,fecha_fin,(cliente_id IS NOT NULL) AS personal FROM promociones WHERE estado='activo' AND NOW() BETWEEN fecha_inicio AND fecha_fin AND (usos_maximos IS NULL OR usos_actuales<usos_maximos) AND (cliente_id IS NULL OR cliente_id=?) ORDER BY personal DESC,fecha_inicio DESC");
$st->execute([$clienteId]);
json_response(['ok'=>true,'promociones'=>$st->fetchAll()]);
