<?php
require_once __DIR__ . '/scm_helpers.php';
$user = require_scm_admin();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'];

function scm_normalize_image_path(string $value): string {
    $value = trim(str_replace('\\', '/', $value));
    if ($value === '') return 'src/primer.jpg';
    if (preg_match('#^https?://#i', $value) || str_starts_with($value, 'data:')) return $value;
    $value = preg_replace('#^(?:\.\./)+#', '', $value);
    $value = preg_replace('#^src/#', '', $value);
    $value = ltrim(preg_replace('#/+#', '/', $value), '/');
    if ($value === '' || str_contains($value, '..')) return 'src/primer.jpg';
    return 'src/' . $value;
}

function scm_product_payload(array $d): array {
    return [
        'nombre'=>clean_string($d['nombre']??''),
        'descripcion'=>clean_string($d['descripcion']??''),
        'categoria'=>clean_string($d['categoria']??''),
        'nivel'=>clean_string($d['nivel']??''),
        'duracion'=>clean_string($d['duracion']??''),
        'valoracion'=>(float)($d['valoracion']??0),
        'tags'=>clean_string($d['tags']??''),
        'descuento'=>(float)($d['descuento']??0),
        'fecha_publicacion'=>clean_string($d['fecha_publicacion']??''),
        'imagen'=>scm_normalize_image_path(clean_string($d['imagen']??'')),
        'precio_venta'=>(float)($d['precio_venta']??0),
        'costo_unitario'=>(float)($d['costo_unitario']??0),
        'stock_actual'=>(int)($d['stock_actual']??0),
        'stock_minimo'=>(int)($d['stock_minimo']??0),
        'unidad_inventario'=>clean_string($d['unidad_inventario']??'Licencia') ?: 'Licencia',
        'proveedor_id'=>(int)($d['proveedor_id']??0),
        'estrategia_logistica'=>clean_string($d['estrategia_logistica']??'PULL')
    ];
}

function validate_scm_product(array $p, array $raw, PDO $pdo): void {
    if ($p['nombre']==='' || $p['categoria']==='') json_response(['error'=>'Nombre y categoría son obligatorios.'],422);
    if ($p['nivel']==='') json_response(['error'=>'El nivel es obligatorio.'],422);
    if ($p['duracion']==='') json_response(['error'=>'La duración es obligatoria.'],422);
    if ($p['fecha_publicacion']==='') json_response(['error'=>'La fecha de publicación es obligatoria.'],422);
    $date = DateTime::createFromFormat('Y-m-d', $p['fecha_publicacion']);
    if (!$date || $date->format('Y-m-d') !== $p['fecha_publicacion']) json_response(['error'=>'La fecha de publicación no es válida.'],422);
    if (!array_key_exists('descuento',$raw) || $raw['descuento']==='') json_response(['error'=>'El descuento es obligatorio. Usa 0 si el curso no tiene descuento.'],422);
    if ($p['proveedor_id'] <= 0) json_response(['error'=>'Debes seleccionar un proveedor.'],422);
    $st=$pdo->prepare("SELECT id FROM proveedores WHERE id=? AND estado='activo' LIMIT 1");$st->execute([$p['proveedor_id']]);
    if(!$st->fetchColumn()) json_response(['error'=>'El proveedor seleccionado no existe o está inactivo.'],422);
    if($p['stock_actual']<0||$p['stock_minimo']<0||$p['costo_unitario']<0||$p['precio_venta']<0) json_response(['error'=>'Los valores numéricos no pueden ser negativos.'],422);
    if($p['valoracion']<0||$p['valoracion']>5) json_response(['error'=>'La valoración debe estar entre 0 y 5.'],422);
    if($p['descuento']<0||$p['descuento']>100) json_response(['error'=>'El descuento debe estar entre 0 y 100.'],422);
    if(!in_array($p['estrategia_logistica'],['PUSH','PULL'],true)) json_response(['error'=>'Estrategia inválida.'],422);
}

if($method==='GET'){
    $estrategia=clean_string($_GET['estrategia']??'');
    $sql="SELECT p.*,pr.nombre proveedor_nombre FROM productos p LEFT JOIN proveedores pr ON pr.id=p.proveedor_id WHERE p.estado='activo'";$params=[];
    if($estrategia!==''){if(!in_array($estrategia,['PUSH','PULL'],true))json_response(['error'=>'Estrategia inválida.'],422);$sql.=" AND p.estrategia_logistica=?";$params[]=$estrategia;}
    $sql.=" ORDER BY p.id ASC";$st=$pdo->prepare($sql);$st->execute($params);json_response(['productos'=>$st->fetchAll()]);
}

if($method==='POST'){
    $raw=body_json();$p=scm_product_payload($raw);validate_scm_product($p,$raw,$pdo);$prov=$p['proveedor_id'];
    try{
        $pdo->beginTransaction();
        $st=$pdo->prepare("INSERT INTO productos(nombre,descripcion,categoria,nivel,duracion,valoracion,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,proveedor_id,estrategia_logistica) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $st->execute([$p['nombre'],$p['descripcion'],$p['categoria'],$p['nivel'],$p['duracion'],$p['valoracion'],$p['tags'],$p['descuento'],$p['fecha_publicacion'],$p['imagen'],$p['precio_venta'],$p['costo_unitario'],$p['stock_actual'],$p['stock_minimo'],$p['unidad_inventario'],$prov,$p['estrategia_logistica']]);
        $id=(int)$pdo->lastInsertId();$mov=null;
        if($p['stock_actual']>0){$pdo->prepare("INSERT INTO movimientos_inventario(producto_id,tipo,cantidad,motivo,detalle,fecha,usuario_id) VALUES(?,'entrada',?,'ajuste','Inventario inicial registrado al dar de alta el curso.',NOW(),?)")->execute([$id,$p['stock_actual'],$user['id']]);$mov=['tipo'=>'entrada','cantidad'=>$p['stock_actual'],'descripcion'=>'Inventario inicial del curso.'];}
        $pedido=scm_maybe_generate_push_order($pdo,$id,(int)$user['id']);
        $pdo->commit();json_response(['ok'=>true,'id'=>$id,'movimiento'=>$mov,'pedido_push_generado'=>$pedido,'mensaje'=>$pedido?'Curso creado y reposición PUSH generada y surtida automáticamente.':'Curso SCM creado correctamente.'],201);
    }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();json_response(['error'=>$e->getMessage()],422);}
}

if($method==='PUT'){
    $id=filter_var($_GET['id']??null,FILTER_VALIDATE_INT);if(!$id)json_response(['error'=>'ID inválido.'],422);
    $raw=body_json();$p=scm_product_payload($raw);validate_scm_product($p,$raw,$pdo);$prov=$p['proveedor_id'];
    try{
        $pdo->beginTransaction();
        $old=$pdo->prepare("SELECT nombre,stock_actual FROM productos WHERE id=? AND estado='activo' FOR UPDATE");$old->execute([$id]);$prev=$old->fetch();if(!$prev)throw new RuntimeException('Curso no encontrado o dado de baja.');
        $st=$pdo->prepare("UPDATE productos SET nombre=?,descripcion=?,categoria=?,nivel=?,duracion=?,valoracion=?,tags=?,descuento=?,fecha_publicacion=?,imagen=?,precio_venta=?,costo_unitario=?,stock_actual=?,stock_minimo=?,unidad_inventario=?,proveedor_id=?,estrategia_logistica=?,actualizado_en=NOW() WHERE id=? AND estado='activo'");
        $st->execute([$p['nombre'],$p['descripcion'],$p['categoria'],$p['nivel'],$p['duracion'],$p['valoracion'],$p['tags'],$p['descuento'],$p['fecha_publicacion'],$p['imagen'],$p['precio_venta'],$p['costo_unitario'],$p['stock_actual'],$p['stock_minimo'],$p['unidad_inventario'],$prov,$p['estrategia_logistica'],$id]);
        $mov=null;$before=(int)$prev['stock_actual'];$after=(int)$p['stock_actual'];
        if($before!==$after){$tipo=$after>$before?'entrada':'salida';$cant=abs($after-$before);$desc="Ajuste de inventario desde edición del curso: $before → $after licencias.";$pdo->prepare("INSERT INTO movimientos_inventario(producto_id,tipo,cantidad,motivo,detalle,fecha,usuario_id) VALUES(?,?,?,'ajuste',?,NOW(),?)")->execute([$id,$tipo,$cant,$desc,$user['id']]);$mov=['tipo'=>$tipo,'cantidad'=>$cant,'descripcion'=>$desc,'stock_actual'=>$after];}
        $pedido=scm_maybe_generate_push_order($pdo,$id,(int)$user['id']);
        $pdo->commit();json_response(['ok'=>true,'movimiento'=>$mov,'pedido_push_generado'=>$pedido,'mensaje'=>$pedido?'Curso actualizado y reposición PUSH generada y surtida automáticamente.':'Curso SCM actualizado correctamente.']);
    }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();json_response(['error'=>$e->getMessage()],422);}
}

if($method==='DELETE'){
    $id=filter_var($_GET['id']??null,FILTER_VALIDATE_INT);if(!$id)json_response(['error'=>'ID inválido.'],422);
    $st=$pdo->prepare("UPDATE productos SET estado='inactivo',actualizado_en=NOW() WHERE id=? AND estado='activo'");$st->execute([$id]);
    json_response(['ok'=>true,'mensaje'=>'Curso dado de baja de forma lógica. El registro permanece en la base de datos.']);
}
json_response(['error'=>'Método no permitido.'],405);
