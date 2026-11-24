document.addEventListener('DOMContentLoaded', async()=>{
 const $=id=>document.getElementById(id),money=n=>`$${Number(n||0).toFixed(2)} MXN`,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 let data=null,profile=null;
 const notice=m=>{$('checkoutNotice').textContent=m;};
 try{
  [data,profile]=await Promise.all([TiendaAPI.request('tienda_checkout.php'),TiendaAPI.request('tienda_cuenta.php')]);
  $('checkoutNombre').value=profile.cliente.nombre;$('checkoutCorreo').value=profile.cliente.correo;
  $('checkoutItems').innerHTML=data.items.map(i=>`<div class="store-summary-row"><span>${esc(i.nombre)} × ${i.cantidad}</span><strong>${money(i.subtotal)}</strong></div>`).join('')||'<p>El carrito está vacío.</p>';
  $('checkoutSubtotal').textContent=money(data.subtotal);$('checkoutIvaRate').textContent=Number(data.iva_porcentaje).toFixed(2);const tax=data.subtotal*data.iva_porcentaje/100;$('checkoutIVA').textContent=money(tax);$('checkoutDiscount').textContent=money(0);$('checkoutTotal').textContent=money(data.subtotal+tax);
  $('checkoutWalletLabel').textContent=`(Saldo: ${money(data.saldo_monedero)})`;
  if(data.direcciones.length){$('checkoutDireccion').innerHTML='<option value="">Selecciona una dirección</option>'+data.direcciones.map(a=>`<option value="${a.id}" ${a.es_predeterminada==1?'selected':''}>${esc(a.etiqueta)} — ${esc(a.calle)} ${esc(a.numero_exterior)}, ${esc(a.colonia)}, ${esc(a.municipio)}</option>`).join('');}
  else{$('checkoutNewAddress').classList.remove('store-hidden');$('toggleNewAddress').classList.add('store-hidden');}
  if(data.alerta_monedero)$('checkoutWalletAlert').innerHTML=`<div class="store-alert">Tu monedero tiene un saldo bajo (umbral ${money(data.saldo_minimo_alerta)}). Puedes recargarlo desde Mi cuenta.</div>`;
  if(!data.items.length){$('confirmarCompra').disabled=true;notice('Agrega al menos un curso antes de continuar.');}
 }catch(e){notice(e.message);$('confirmarCompra').disabled=true;return;}
 $('applyPromo').addEventListener('click',async()=>{const code=$('checkoutPromo').value.trim();$('promoNotice').textContent='';if(!code)return;try{const p=await TiendaAPI.request(`tienda_promocion_validar.php?codigo=${encodeURIComponent(code)}`);$('checkoutDiscount').textContent=money(p.descuento);$('checkoutIVA').textContent=money(p.iva);$('checkoutTotal').textContent=money(p.total);$('promoNotice').textContent=`Código ${p.codigo} aplicado.`;}catch(e){$('promoNotice').textContent=e.message;$('checkoutDiscount').textContent=money(0);const tax=data.subtotal*Number(data.iva_porcentaje||16)/100;$('checkoutIVA').textContent=money(tax);$('checkoutTotal').textContent=money(data.subtotal+tax);}});
 $('toggleNewAddress').addEventListener('click',()=>{$('checkoutNewAddress').classList.toggle('store-hidden');$('checkoutDireccion').value='';});
 const paymentDetails={tarjeta:'<h3>Tarjeta (simulada)</h3><p>No se capturan datos bancarios reales. Se generará una autorización ficticia para fines de demostración.</p><p><strong>Tarjeta de prueba:</strong> •••• •••• •••• 4242 · <strong>Banco:</strong> BBVA (demo)</p>',paypal:'<h3>PayPal (simulado)</h3><p>Cuenta de demostración: comprador-demo@example.com. La operación se marcará como aprobada simulada.</p>',transferencia:'<h3>Transferencia bancaria (simulada)</h3><p><strong>Banco:</strong> BBVA (entorno de demostración)<br><strong>Titular:</strong> Upskill Academy (cuenta ficticia)<br><strong>Cuenta:</strong> 0000000000 (dato no bancario)<br><strong>CLABE:</strong> 000000000000000000 (dato no válido, solo simulación)<br><strong>Concepto:</strong> Pago de cursos Upskill Academy<br><strong>Referencia:</strong> se generará al confirmar el pedido.</p>',monedero:`<h3>Pago con monedero</h3><p>Saldo disponible: <strong>${money(data.saldo_monedero)}</strong>. El importe se descontará del saldo en el servidor.</p>`};
 document.querySelectorAll('[name="metodoPago"]').forEach(r=>r.addEventListener('change',()=>{$('paymentDetails').classList.remove('store-hidden');$('paymentDetails').innerHTML=paymentDetails[r.value]||'';}));
 $('confirmarCompra').addEventListener('click',async()=>{
  const payment=document.querySelector('[name="metodoPago"]:checked')?.value;if(!payment){notice('Selecciona un método de pago.');return;}
  let addressId=Number($('checkoutDireccion').value||0),address=null;
  if(!$('checkoutNewAddress').classList.contains('store-hidden')){address={etiqueta:$('dirEtiqueta').value,calle:$('dirCalle').value,numero_exterior:$('dirExterior').value,numero_interior:$('dirInterior').value,colonia:$('dirColonia').value,municipio:$('dirMunicipio').value,estado:$('dirEstado').value,codigo_postal:$('dirCP').value,pais:$('dirPais').value,referencias:$('dirReferencias').value};if(!address.calle||!address.numero_exterior||!address.colonia||!address.municipio||!address.estado||!address.codigo_postal){notice('Completa todos los campos obligatorios de la dirección.');return;}}
  else if(!addressId){notice('Selecciona una dirección o agrega una nueva.');return;}
  $('confirmarCompra').disabled=true;notice('Procesando pago y validando inventario...');
  try{const result=await TiendaAPI.request('tienda_checkout.php',{method:'POST',body:{metodo_pago:payment,direccion_id:addressId||null,direccion:address,codigo_promocion:$('checkoutPromo').value.trim()}});sessionStorage.setItem('upskillLastOrder',JSON.stringify(result.pedido));location.href=`pedido-confirmado.html?id=${result.pedido.id}`;}
  catch(e){notice(e.message);$('confirmarCompra').disabled=false;}
 });
});
