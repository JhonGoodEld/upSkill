(function () {
  'use strict';

  const API = '../../../api';
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  async function request(path, options = {}) {
    const response = await fetch(`${API}/${path}`, {
      credentials: 'same-origin',
      headers: {'Content-Type':'application/json', ...(options.headers || {})},
      ...options
    });
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : {}; }
    catch (_) { throw new Error(`Respuesta no JSON desde ${path}: ${raw.slice(0,180)}`); }
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  function showNotice(id, message, error = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = error ? 'admin-notice error' : 'admin-notice success';
    el.textContent = message;
    clearTimeout(el._noticeTimer);
    el._noticeTimer = setTimeout(() => {
      el.textContent = '';
      el.className = 'admin-notice';
    }, 5000);
  }

  function confirmacionVisual(titulo, mensaje) {
    return new Promise(resolve => {
      const modal = document.getElementById('confirmAdminModal');
      const title = document.getElementById('confirmAdminTitle');
      const text = document.getElementById('confirmAdminText');
      const accept = document.getElementById('confirmAdminAccept');
      const cancel = document.getElementById('confirmAdminCancel');
      if (!modal || !title || !text || !accept || !cancel) return resolve(false);
      title.textContent = titulo;
      text.textContent = mensaje;
      modal.classList.add('open');
      const cerrar = r => {
        modal.classList.remove('open');
        accept.onclick = null;
        cancel.onclick = null;
        resolve(r);
      };
      accept.onclick = () => cerrar(true);
      cancel.onclick = () => cerrar(false);
    });
  }

  function solicitudRows(solicitudes) {
    return solicitudes.length ? solicitudes.map(u => `
      <tr>
        <td>${esc(u.id)}</td><td>${esc(u.nombre)}</td><td>${esc(u.correo)}</td>
        <td>${esc(u.telefono)}</td><td>${esc(u.empresa)}</td><td>${esc(u.rol)}</td>
        <td>${esc(u.especialidad || '—')}</td><td>${esc(u.curso_solicitado || '—')}</td>
        <td>${esc(u.fecha_solicitud)}</td>
        <td>
          <button type="button" class="approval-btn approve-btn" data-id="${esc(u.id)}" data-action="aprobar">Aprobar</button>
          <button type="button" class="approval-btn reject-btn" data-id="${esc(u.id)}" data-action="rechazar">Rechazar</button>
        </td>
      </tr>`).join('') : '<tr><td colspan="10">No hay solicitudes pendientes.</td></tr>';
  }

  async function recargarSolicitudes() {
    const table = document.querySelector('#tablaSolicitudes tbody');
    if (!table) return;
    try {
      const data = await request('solicitudes.php?estado=pendiente');
      table.innerHTML = solicitudRows(Array.isArray(data.solicitudes) ? data.solicitudes : []);
    } catch (error) {
      table.innerHTML = `<tr><td colspan="10" class="admin-error-cell">${esc(error.message)}</td></tr>`;
      showNotice('solicitudesNotice', error.message, true);
    }
  }

  async function initSolicitudes() {
    const table = document.querySelector('#tablaSolicitudes tbody');
    if (!table) return;
    table.innerHTML = '<tr><td colspan="10">Cargando solicitudes...</td></tr>';
    try {
      const me = await request('me.php');
      if (!me.usuario || me.usuario.rol !== 'admin') {
        window.location.href = 'loggin.html';
        return;
      }
      await recargarSolicitudes();
    } catch (error) {
      showNotice('solicitudesNotice', `No fue posible cargar las solicitudes: ${error.message}`, true);
      return;
    }

    table.closest('table').addEventListener('click', async event => {
      const btn = event.target.closest('[data-action][data-id]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = Number(btn.dataset.id);
      const ok = await confirmacionVisual(
        action === 'aprobar' ? 'Aprobar solicitud' : 'Rechazar solicitud',
        action === 'aprobar' ? '¿Deseas aprobar esta solicitud y crear sus registros de usuario y cliente?' : '¿Deseas rechazar esta solicitud?'
      );
      if (!ok) return;
      btn.disabled = true;
      try {
        await request('solicitudes.php', {method:'PUT', body:JSON.stringify({id, accion:action})});
        showNotice('solicitudesNotice', `Solicitud ${action === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente.`);
        await recargarSolicitudes();
      } catch (error) {
        showNotice('solicitudesNotice', error.message, true);
        btn.disabled = false;
      }
    });
  }

  async function initSuperAdmin() {
    const section = document.getElementById('adminSuperSection');
    const adminTable = document.querySelector('#tablaAdministradores tbody');
    const adminForm = document.getElementById('formAdministrador');
    const logisticsTable = document.querySelector('#tablaLogistica tbody');
    const logisticsForm = document.getElementById('formLogistica');
    if (!section || !adminTable || !adminForm) return;

    try {
      const me = await request('me.php');
      if (!me.usuario || me.usuario.rol !== 'admin' || Number(me.usuario.es_superadmin) !== 1) {
        section.hidden = true;
        return;
      }
      section.hidden = false;
    } catch (e) {
      section.hidden = true;
      return;
    }

    async function loadAdmins() {
      const data = await request('administradores.php');
      const admins = Array.isArray(data.administradores) ? data.administradores : [];
      adminTable.innerHTML = admins.length ? admins.map(a => `
        <tr>
          <td>${esc(a.id)}</td><td>${esc(a.nombre)}</td><td>${esc(a.correo)}</td>
          <td>${Number(a.es_superadmin) === 1 ? 'Principal' : 'Administrador'}</td>
          <td>${esc(a.estado)}</td><td>${esc(a.fecha_registro)}</td>
          <td>${Number(a.es_superadmin) === 1 ? '<span>Protegido</span>' : `
            <button type="button" class="approval-btn edit-admin-btn" data-id="${esc(a.id)}" data-nombre="${esc(a.nombre)}" data-correo="${esc(a.correo)}">Editar</button>
            <button type="button" class="approval-btn ${a.estado === 'activo' ? 'reject-btn' : 'approve-btn'} admin-state-btn" data-id="${esc(a.id)}" data-state="${a.estado === 'activo' ? 'inactivo' : 'activo'}">${a.estado === 'activo' ? 'Desactivar' : 'Activar'}</button>
          `}</td>
        </tr>`).join('') : '<tr><td colspan="7">No hay administradores registrados.</td></tr>';
    }

    async function loadLogistics() {
      if (!logisticsTable) return;
      const data = await request('usuarios_logistica.php');
      const rows = Array.isArray(data.usuarios_logistica) ? data.usuarios_logistica : [];
      logisticsTable.innerHTML = rows.length ? rows.map(u => `
        <tr>
          <td>${esc(u.id)}</td><td>${esc(u.nombre)}</td><td>${esc(u.correo)}</td><td>Logística</td>
          <td>${esc(u.estado)}</td><td>${esc(u.fecha_registro)}</td>
          <td>
            <button type="button" class="approval-btn edit-logistica-btn" data-id="${esc(u.id)}" data-nombre="${esc(u.nombre)}" data-correo="${esc(u.correo)}">Editar</button>
            <button type="button" class="approval-btn ${u.estado === 'activo' ? 'reject-btn' : 'approve-btn'} logistica-state-btn" data-id="${esc(u.id)}" data-state="${u.estado === 'activo' ? 'inactivo' : 'activo'}">${u.estado === 'activo' ? 'Desactivar' : 'Activar'}</button>
          </td>
        </tr>`).join('') : '<tr><td colspan="7">No hay usuarios de logística registrados.</td></tr>';
    }

    adminForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(adminForm);
      const nombre = String(fd.get('nombre') || '').trim();
      const correo = String(fd.get('correo') || '').trim();
      const password = String(fd.get('password') || '');
      const confirmPassword = String(fd.get('confirmPassword') || '');
      if (!nombre || !correo || !password || !confirmPassword) return showNotice('administradoresNotice','Completa todos los campos.',true);
      if (password !== confirmPassword) return showNotice('administradoresNotice','Las contraseñas no coinciden.',true);
      try {
        const d = await request('administradores.php',{method:'POST',body:JSON.stringify({nombre,correo,password})});
        adminForm.reset(); showNotice('administradoresNotice',d.mensaje || 'Administrador creado correctamente.'); await loadAdmins();
      } catch (error) { showNotice('administradoresNotice',error.message,true); }
    });

    const toggleLog = document.getElementById('toggleLogisticaForm');
    if (toggleLog && logisticsForm) toggleLog.onclick = () => { logisticsForm.hidden = !logisticsForm.hidden; if (!logisticsForm.hidden) logisticsForm.querySelector('input')?.focus(); };

    if (logisticsForm) logisticsForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(logisticsForm);
      const nombre=String(fd.get('nombre')||'').trim(), correo=String(fd.get('correo')||'').trim(), password=String(fd.get('password')||''), confirmPassword=String(fd.get('confirmPassword')||'');
      if(!nombre||!correo||!password||!confirmPassword) return showNotice('logisticaNotice','Completa todos los campos.',true);
      if(password!==confirmPassword) return showNotice('logisticaNotice','Las contraseñas no coinciden.',true);
      try{
        const d=await request('usuarios_logistica.php',{method:'POST',body:JSON.stringify({nombre,correo,password})});
        logisticsForm.reset(); logisticsForm.hidden=true; showNotice('logisticaNotice',d.mensaje||'Usuario de logística creado correctamente.'); await loadLogistics();
      }catch(error){showNotice('logisticaNotice',error.message,true);}
    });

    const editarAdminModal=document.getElementById('editarAdminModal'), editarAdminForm=document.getElementById('editarAdminForm');
    adminTable.closest('table').addEventListener('click', async e => {
      const edit=e.target.closest('.edit-admin-btn');
      if(edit){
        document.getElementById('editarAdminId').value=edit.dataset.id;
        document.getElementById('editarAdminNombre').value=edit.dataset.nombre;
        document.getElementById('editarAdminCorreo').value=edit.dataset.correo;
        document.getElementById('editarAdminPassword').value=''; document.getElementById('editarAdminConfirmPassword').value='';
        editarAdminModal?.classList.add('open'); return;
      }
      const btn=e.target.closest('.admin-state-btn'); if(!btn)return;
      const ok=await confirmacionVisual(btn.dataset.state==='activo'?'Activar administrador':'Desactivar administrador',btn.dataset.state==='activo'?'¿Deseas activar esta cuenta administrativa?':'¿Deseas desactivar esta cuenta administrativa? El usuario dejará de poder iniciar sesión.');
      if(!ok)return;
      try{const d=await request('administradores.php',{method:'PUT',body:JSON.stringify({id:Number(btn.dataset.id),estado:btn.dataset.state})});showNotice('administradoresNotice',d.mensaje||'Estado actualizado.');await loadAdmins();}catch(error){showNotice('administradoresNotice',error.message,true);}
    });
    document.getElementById('cancelarEditarAdmin')?.addEventListener('click',()=>editarAdminModal?.classList.remove('open'));
    editarAdminForm?.addEventListener('submit',async e=>{
      e.preventDefault(); const id=Number(document.getElementById('editarAdminId').value),nombre=document.getElementById('editarAdminNombre').value.trim(),correo=document.getElementById('editarAdminCorreo').value.trim(),password=document.getElementById('editarAdminPassword').value,confirmPassword=document.getElementById('editarAdminConfirmPassword').value;
      if(!nombre||!correo)return showNotice('editarAdminNotice','Nombre y correo son obligatorios.',true); if(password!==confirmPassword)return showNotice('editarAdminNotice','Las contraseñas no coinciden.',true);
      try{const payload={id,nombre,correo};if(password)payload.password=password;const d=await request('administradores.php',{method:'PUT',body:JSON.stringify(payload)});editarAdminModal?.classList.remove('open');showNotice('administradoresNotice',d.mensaje||'Administrador actualizado.');await loadAdmins();}catch(error){showNotice('editarAdminNotice',error.message,true);}
    });

    const editarLogModal=document.getElementById('editarLogisticaModal'), editarLogForm=document.getElementById('editarLogisticaForm');
    logisticsTable?.closest('table')?.addEventListener('click', async e=>{
      const edit=e.target.closest('.edit-logistica-btn');
      if(edit){
        document.getElementById('editarLogisticaId').value=edit.dataset.id;
        document.getElementById('editarLogisticaNombre').value=edit.dataset.nombre;
        document.getElementById('editarLogisticaCorreo').value=edit.dataset.correo;
        document.getElementById('editarLogisticaPassword').value='';document.getElementById('editarLogisticaConfirmPassword').value='';
        editarLogModal?.classList.add('open');return;
      }
      const btn=e.target.closest('.logistica-state-btn');if(!btn)return;
      const ok=await confirmacionVisual(btn.dataset.state==='activo'?'Activar usuario de logística':'Desactivar usuario de logística',btn.dataset.state==='activo'?'¿Deseas permitir nuevamente el acceso al SCM?':'¿Deseas desactivar esta cuenta? Ya no podrá iniciar sesión en el SCM.');
      if(!ok)return;
      try{const d=await request('usuarios_logistica.php',{method:'PUT',body:JSON.stringify({id:Number(btn.dataset.id),estado:btn.dataset.state})});showNotice('logisticaNotice',d.mensaje||'Estado actualizado.');await loadLogistics();}catch(error){showNotice('logisticaNotice',error.message,true);}
    });
    document.getElementById('cancelarEditarLogistica')?.addEventListener('click',()=>editarLogModal?.classList.remove('open'));
    editarLogForm?.addEventListener('submit',async e=>{
      e.preventDefault(); const id=Number(document.getElementById('editarLogisticaId').value),nombre=document.getElementById('editarLogisticaNombre').value.trim(),correo=document.getElementById('editarLogisticaCorreo').value.trim(),password=document.getElementById('editarLogisticaPassword').value,confirmPassword=document.getElementById('editarLogisticaConfirmPassword').value;
      if(!nombre||!correo)return showNotice('editarLogisticaNotice','Nombre y correo son obligatorios.',true);if(password!==confirmPassword)return showNotice('editarLogisticaNotice','Las contraseñas no coinciden.',true);
      try{const payload={id,nombre,correo};if(password)payload.password=password;const d=await request('usuarios_logistica.php',{method:'PUT',body:JSON.stringify(payload)});editarLogModal?.classList.remove('open');showNotice('logisticaNotice',d.mensaje||'Usuario de logística actualizado.');await loadLogistics();}catch(error){showNotice('editarLogisticaNotice',error.message,true);}
    });

    await Promise.all([loadAdmins(), loadLogistics()]);
  }

  function start(){initSolicitudes();initSuperAdmin();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
