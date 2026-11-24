<?php
require_once __DIR__ . '/tienda_helpers.php';
$ctx = require_customer(); $user = $ctx['usuario']; $clienteId = $ctx['cliente_id']; $pdo = db();
$method = $_SERVER['REQUEST_METHOD'];

function cart_payload(PDO $pdo, int $clienteId): array {
    $cart = store_active_cart($pdo, $clienteId, false);
    if (!$cart) return ['carrito_id'=>null,'items'=>[],'subtotal'=>0.0,'cantidad'=>0];
    $st = $pdo->prepare("SELECT d.id AS item_id,d.producto_id,d.cantidad,p.nombre,p.descripcion,p.imagen,p.stock_actual,p.precio_venta,p.descuento,p.estado,
        ROUND(p.precio_venta*(1-LEAST(GREATEST(COALESCE(p.descuento,0),0),100)/100),2) AS precio_actual
        FROM carrito_detalle d JOIN productos p ON p.id=d.producto_id WHERE d.carrito_id=? ORDER BY d.id");
    $st->execute([$cart['id']]); $items=$st->fetchAll(); $subtotal=0; $cantidad=0;
    foreach($items as &$it){$it['cantidad']=(int)$it['cantidad'];$it['stock_actual']=(int)$it['stock_actual'];$it['precio_actual']=(float)$it['precio_actual'];$it['subtotal']=round($it['precio_actual']*$it['cantidad'],2);$subtotal+=$it['subtotal'];$cantidad+=$it['cantidad'];} unset($it);
    return ['carrito_id'=>(int)$cart['id'],'items'=>$items,'subtotal'=>round($subtotal,2),'cantidad'=>$cantidad];
}

if ($method === 'GET') json_response(['ok'=>true] + cart_payload($pdo,$clienteId));
require_csrf();

if ($method === 'POST') {
    $d=body_json();$productId=filter_var($d['producto_id']??null,FILTER_VALIDATE_INT);$qty=filter_var($d['cantidad']??1,FILTER_VALIDATE_INT);
    if(!$productId||!$qty||$qty<1||$qty>50)json_response(['error'=>'Producto o cantidad inválida.'],422);
    $st=$pdo->prepare("SELECT id,nombre,precio_venta,descuento,stock_actual,estado FROM productos WHERE id=? LIMIT 1");$st->execute([$productId]);$p=$st->fetch();
    if(!$p||$p['estado']!=='activo')json_response(['error'=>'El curso ya no está disponible.'],404);
    if((int)$p['stock_actual']<$qty)json_response(['error'=>'No hay licencias suficientes para esa cantidad.'],409);
    if(store_product_price($p)<=0)json_response(['error'=>'Este curso no tiene un precio válido para compra.'],422);
    $cart=store_active_cart($pdo,$clienteId,true);
    $st=$pdo->prepare('SELECT id,cantidad FROM carrito_detalle WHERE carrito_id=? AND producto_id=?');$st->execute([$cart['id'],$productId]);$existing=$st->fetch();
    $newQty=$qty+(int)($existing['cantidad']??0);if($newQty>(int)$p['stock_actual'])json_response(['error'=>'La cantidad acumulada supera las licencias disponibles.'],409);
    if($existing){$pdo->prepare('UPDATE carrito_detalle SET cantidad=?,precio_unitario=?,actualizado_en=NOW() WHERE id=?')->execute([$newQty,store_product_price($p),$existing['id']]);}
    else{$pdo->prepare('INSERT INTO carrito_detalle(carrito_id,producto_id,cantidad,precio_unitario) VALUES(?,?,?,?)')->execute([$cart['id'],$productId,$qty,store_product_price($p)]);}
    $pdo->prepare('UPDATE carritos SET actualizado_en=NOW() WHERE id=?')->execute([$cart['id']]);
    json_response(['ok'=>true,'mensaje'=>'Curso agregado al carrito.']+cart_payload($pdo,$clienteId),201);
}

if ($method === 'PUT') {
    $d=body_json();$itemId=filter_var($d['item_id']??null,FILTER_VALIDATE_INT);$qty=filter_var($d['cantidad']??null,FILTER_VALIDATE_INT);
    if(!$itemId||!$qty||$qty<1||$qty>50)json_response(['error'=>'Cantidad inválida.'],422);
    $st=$pdo->prepare("SELECT d.id,d.carrito_id,d.producto_id,p.stock_actual,p.precio_venta,p.descuento FROM carrito_detalle d JOIN carritos c ON c.id=d.carrito_id JOIN productos p ON p.id=d.producto_id WHERE d.id=? AND c.cliente_id=? AND c.estado='activo'");$st->execute([$itemId,$clienteId]);$item=$st->fetch();
    if(!$item)json_response(['error'=>'El artículo no pertenece a tu carrito activo.'],404);
    if($qty>(int)$item['stock_actual'])json_response(['error'=>'La cantidad supera el inventario disponible.'],409);
    $price=store_product_price($item);if($price<=0)json_response(['error'=>'El precio actual del curso no es válido.'],422);
    $pdo->prepare('UPDATE carrito_detalle SET cantidad=?,precio_unitario=?,actualizado_en=NOW() WHERE id=?')->execute([$qty,$price,$itemId]);
    json_response(['ok'=>true]+cart_payload($pdo,$clienteId));
}

if ($method === 'DELETE') {
    $d=body_json();$itemId=(int)($d['item_id']??0);$empty=!empty($d['vaciar']);$cart=store_active_cart($pdo,$clienteId,false);
    if($cart){if($empty)$pdo->prepare('DELETE FROM carrito_detalle WHERE carrito_id=?')->execute([$cart['id']]);elseif($itemId)$pdo->prepare('DELETE d FROM carrito_detalle d JOIN carritos c ON c.id=d.carrito_id WHERE d.id=? AND c.cliente_id=? AND c.estado=\'activo\'')->execute([$itemId,$clienteId]);else json_response(['error'=>'Indica el artículo que deseas eliminar o solicita vaciar el carrito.'],422);}
    json_response(['ok'=>true]+cart_payload($pdo,$clienteId));
}
json_response(['error'=>'Método no permitido.'],405);
