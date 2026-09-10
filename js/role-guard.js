document.addEventListener('DOMContentLoaded', async () => {
  const b=document.body, role=b.dataset.requiredRole, api=b.dataset.apiBase, login=b.dataset.loginUrl;
  if(!role||!api||!login)return;
  try{const r=await fetch(`${api}/me.php`,{credentials:'same-origin'});const d=await r.json();if(!r.ok||d.usuario?.rol!==role)throw new Error('Acceso no autorizado');}
  catch(e){window.location.href=login;}
});
