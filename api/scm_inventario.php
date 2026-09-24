<?php
require_once __DIR__ . '/scm_helpers.php';
require_scm_admin();$pdo=db();
if($_SERVER['REQUEST_METHOD']!=='GET')json_response(['error'=>'Método no permitido.'],405);
$st=$pdo->query("SELECT i.*, pr.nombre proveedor_nombre FROM inventario i LEFT JOIN proveedores pr ON pr.id=i.proveedor_id ORDER BY i.producto_id ASC");
json_response(['inventario'=>$st->fetchAll()]);
