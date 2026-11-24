<?php
require_once __DIR__ . '/helpers.php';
if($_SERVER['REQUEST_METHOD']!=='GET')json_response(['error'=>'Método no permitido.'],405);
$st=db()->query("SELECT codigo,nombre,descripcion,tipo_descuento,valor,fecha_fin FROM promociones WHERE estado='activo' AND NOW() BETWEEN fecha_inicio AND fecha_fin AND (usos_maximos IS NULL OR usos_actuales<usos_maximos) ORDER BY fecha_inicio DESC");json_response(['ok'=>true,'promociones'=>$st->fetchAll()]);
