document.addEventListener('DOMContentLoaded', async () => {
  const container=document.getElementById('carrito');
  const subtotalEl=document.getElementById('subtotal'), ivaEl=document.getElementById('iva'), totalEl=document.getElementById('total');
  const btn=document.getElementById('btnPagar');
  const notice=document.getElementById('cartNotice');
  const money=n=>`$${Number(n||0).toFixed(2)} MXN`;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const show=(m,ok=false)=>{if(notice){notice.textContent=m;notice.classList.toggle('store-notice--ok',ok);}};
  let cart=null;
  async function load(){
    try{
      const pending=Number(sessionStorage.getItem('upskillPendingCartProduct')||0);
      if(pending){await TiendaAPI.request('tienda_carrito.php',{method:'POST',body:{producto_id:pending,cantidad:1}});sessionStorage.removeItem('upskillPendingCartProduct');}
      cart=await TiendaAPI.request('tienda_carrito.php');
      render();
    }catch(e){show(e.message);if(container){if(e.status===401||e.status===403)container.innerHTML='<div class="empty-cart"><p>Inicia sesión como alumno para consultar tu carrito.</p><a class="btn" href="logalumno.html?redirect=carrito.html">Iniciar sesión</a></div>';else container.innerHTML=`<p class="empty-cart">${String(e.message).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}</p>`;}if(btn)btn.disabled=true;}
  }
  function render(){
    if(!container)return;
    if(!cart.items.length){container.innerHTML='<div class="empty-cart"><h2>Tu carrito está vacío</h2><p>Explora el catálogo y agrega los cursos que quieras adquirir.</p><a class="btn" href="cursos.html">Ver cursos</a></div>';btn&&(btn.disabled=true);}
    else{
      btn&&(btn.disabled=false);
      container.innerHTML=cart.items.map(i=>`<article class="cart-item"><div class="cart-item-info"><h3>${esc(i.nombre)}</h3><small>Precio actual: ${money(i.precio_actual)} · Disponibles: ${i.stock_actual}</small></div><label>Cantidad <input class="cart-qty" type="number" min="1" max="${i.stock_actual}" value="${i.cantidad}" data-item="${i.item_id}"></label><strong>${money(i.subtotal)}</strong><button class="cart-remove" data-remove="${i.item_id}" type="button">Quitar</button></article>`).join('');
    }
    const subtotal=Number(cart.subtotal||0);TiendaAPI.request('tienda_checkout.php').then(d=>{const iva=subtotal*Number(d.iva_porcentaje||16)/100;subtotalEl.textContent=money(subtotal);ivaEl.textContent=money(iva);totalEl.textContent=money(subtotal+iva);const label=document.getElementById('ivaLabel');if(label)label.textContent=`IVA (${Number(d.iva_porcentaje).toFixed(2)} %):`;}).catch(()=>{subtotalEl.textContent=money(subtotal);ivaEl.textContent=money(subtotal*.16);totalEl.textContent=money(subtotal*1.16);});
  }
  container?.addEventListener('change',async e=>{const input=e.target.closest('.cart-qty');if(!input)return;try{cart=await TiendaAPI.request('tienda_carrito.php',{method:'PUT',body:{item_id:Number(input.dataset.item),cantidad:Number(input.value)}});render();}catch(err){show(err.message);load();}});
  container?.addEventListener('click',async e=>{const b=e.target.closest('[data-remove]');if(!b)return;try{cart=await TiendaAPI.request('tienda_carrito.php',{method:'DELETE',body:{item_id:Number(b.dataset.remove)}});render();}catch(err){show(err.message);}});
  const empty=document.getElementById('btnVaciarCarrito');empty?.addEventListener('click',async()=>{try{cart=await TiendaAPI.request('tienda_carrito.php',{method:'DELETE',body:{vaciar:true}});render();show('Carrito vaciado.',true);}catch(e){show(e.message);}});
  btn?.addEventListener('click',()=>{if(cart?.items?.length)location.href='checkout.html';});
  await load();
  const policy=document.getElementById('politicasModal');
  document.getElementById('openPoliticas')?.addEventListener('click',e=>{e.preventDefault();if(policy)policy.style.display='flex';});
  document.getElementById('cerrarPoliticas')?.addEventListener('click',()=>{if(policy)policy.style.display='none';});
  policy?.querySelector('.close')?.addEventListener('click',()=>{policy.style.display='none';});
  window.addEventListener('click',e=>{if(e.target===policy)policy.style.display='none';});
});
