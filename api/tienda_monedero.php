<?php
require_once __DIR__ . '/tienda_helpers.php';
$ctx=require_customer();$user=$ctx['usuario'];$clienteId=$ctx['cliente_id'];$pdo=db();$method=$_SERVER['REQUEST_METHOD'];
function wallet_payload(PDO $pdo,int $clienteId):array{
 $w=store_wallet($pdo,$clienteId);$st=$pdo->prepare('SELECT saldo_minimo_alerta FROM tienda_configuracion WHERE id=1');$st->execute();$limit=(float)($st->fetchColumn()?:100);
 $st=$pdo->prepare('SELECT id,tipo,concepto,monto,saldo_resultante,metodo_pago,referencia,fecha FROM monedero_movimientos WHERE monedero_id=? ORDER BY fecha DESC,id DESC LIMIT 100');$st->execute([$w['id']]);
 return ['saldo'=>(float)$w['saldo'],'saldo_minimo_alerta'=>$limit,'alerta'=>(float)$w['saldo']<=$limit,'movimientos'=>$st->fetchAll()];
}
if($method==='GET')json_response(['ok'=>true]+wallet_payload($pdo,$clienteId));
require_csrf();
if($method==='POST'){
 $d=body_json();$amount=round((float)($d['monto']??0),2);$methodPay=clean_string($d['metodo_pago']??'');
 if($amount<50||$amount>10000)json_response(['error'=>'La recarga debe ser de al menos $50 y como máximo $10,000 MXN.'],422);
 if(!in_array($methodPay,['tarjeta','paypal','transferencia'],true))json_response(['error'=>'Selecciona tarjeta, PayPal o transferencia simulada.'],422);
 $ref='REC-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));
 $pdo->beginTransaction();try{$w=store_wallet($pdo,$clienteId,true);$new=round((float)$w['saldo']+$amount,2);$pdo->prepare('UPDATE monederos SET saldo=?,actualizado_en=NOW() WHERE id=?')->execute([$new,$w['id']]);$pdo->prepare("INSERT INTO monedero_movimientos(monedero_id,tipo,concepto,monto,saldo_resultante,metodo_pago,referencia,usuario_id) VALUES(?,'recarga','Recarga de saldo simulada',?,?,?,?,?)")->execute([$w['id'],$amount,$new,$methodPay,$ref,$user['id']]);$pdo->commit();json_response(['ok'=>true,'mensaje'=>'Recarga simulada acreditada correctamente.','referencia'=>$ref]+wallet_payload($pdo,$clienteId),201);}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();error_log('[Upskill wallet] '.$e->getMessage());json_response(['error'=>'No fue posible registrar la recarga. Revisa el historial antes de volver a intentarlo.'],500);}
}
json_response(['error'=>'Método no permitido.'],405);
