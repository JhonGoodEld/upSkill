
(function () {
  'use strict';

  const API = '../../../api';

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));

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

    function showNotice(
        id,
        message,
        error = false
    ) {
        const el = document.getElementById(id);

        if (!el) return;

        el.className =
            error
                ? 'admin-notice error'
                : 'admin-notice success';

        el.textContent = message;

        clearTimeout(el._noticeTimer);

        el._noticeTimer = setTimeout(() => {
            el.textContent = '';
            el.className = 'admin-notice';
        }, 5000);
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

      const data = await request('solicitudes.php?estado=pendiente');
      const solicitudes = Array.isArray(data.solicitudes) ? data.solicitudes : [];

      if (!solicitudes.length) {
        table.innerHTML = '<tr><td colspan="10">No hay solicitudes pendientes.</td></tr>';
        return;
      }

      table.innerHTML = solicitudes.map(u => `
        <tr>
          <td>${esc(u.id)}</td>
          <td>${esc(u.nombre)}</td>
          <td>${esc(u.correo)}</td>
          <td>${esc(u.telefono)}</td>
          <td>${esc(u.empresa)}</td>
          <td>${esc(u.rol)}</td>
          <td>${esc(u.especialidad || '—')}</td>
          <td>${esc(u.curso_solicitado || '—')}</td>
          <td>${esc(u.fecha_solicitud)}</td>
          <td>
            <button type="button" class="approval-btn approve-btn" data-id="${esc(u.id)}" data-action="aprobar">Aprobar</button>
            <button type="button" class="approval-btn reject-btn" data-id="${esc(u.id)}" data-action="rechazar">Rechazar</button>
          </td>
        </tr>`).join('');

    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      table.innerHTML = `<tr><td colspan="10" class="admin-error-cell">No fue posible cargar las solicitudes: ${esc(error.message)}</td></tr>`;
      showNotice('solicitudesNotice', `No fue posible cargar las solicitudes: ${error.message}`, true);
    }

    table.addEventListener('click', async (event) => {
      const btn = event.target.closest('[data-action][data-id]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = Number(btn.dataset.id);
      const label = action === 'aprobar' ? 'Aprobar' : 'Rechazar';
      if (!confirm(`${label} esta solicitud?`)) return;

      btn.disabled = true;
      try {
        await request('solicitudes.php', {
          method: 'PUT',
          body: JSON.stringify({id, accion: action})
        });
        showNotice('solicitudesNotice', `Solicitud ${action === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente.`);
        await initSolicitudesReloadOnly();
      } catch (error) {
        showNotice('solicitudesNotice', error.message, true);
        btn.disabled = false;
      }
    }, {once: true});
  }

  async function initSolicitudesReloadOnly() {
    const table = document.querySelector('#tablaSolicitudes tbody');
    if (!table) return;
    try {
      const data = await request('solicitudes.php?estado=pendiente');
      const solicitudes = Array.isArray(data.solicitudes) ? data.solicitudes : [];
      table.innerHTML = solicitudes.length ? solicitudes.map(u => `
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
    } catch (error) {
      table.innerHTML = `<tr><td colspan="10" class="admin-error-cell">${esc(error.message)}</td></tr>`;
    }
  }

    function confirmacionVisual(titulo, mensaje) {

        return new Promise(resolve => {

            const modal =
                document.getElementById('confirmAdminModal');

            const title =
                document.getElementById('confirmAdminTitle');

            const text =
                document.getElementById('confirmAdminText');

            const accept =
                document.getElementById('confirmAdminAccept');

            const cancel =
                document.getElementById('confirmAdminCancel');

            /*
             * Protección por si falta algún elemento
             * del modal en admin.html.
             */
            if (
                !modal ||
                !title ||
                !text ||
                !accept ||
                !cancel
            ) {
                console.error(
                    'No se encontraron los elementos del modal de confirmación.'
                );

                resolve(false);
                return;
            }

            title.textContent = titulo;
            text.textContent = mensaje;

            modal.classList.add('open');

            const cerrar = resultado => {

                modal.classList.remove('open');

                accept.onclick = null;
                cancel.onclick = null;

                resolve(resultado);
            };

            accept.onclick =
                () => cerrar(true);

            cancel.onclick =
                () => cerrar(false);
        });
    }

  async function initSuperAdmin() {
    const section = document.getElementById('adminSuperSection');
    const table = document.querySelector('#tablaAdministradores tbody');
    const form = document.getElementById('formAdministrador');
      const editarModal =
          document.getElementById('editarAdminModal');

      const editarForm =
          document.getElementById('editarAdminForm');

      const editarId =
          document.getElementById('editarAdminId');

      const editarNombre =
          document.getElementById('editarAdminNombre');

      const editarCorreo =
          document.getElementById('editarAdminCorreo');

      const editarPassword =
          document.getElementById('editarAdminPassword');

      const editarConfirmPassword =
          document.getElementById(
              'editarAdminConfirmPassword'
          );

      const cancelarEditar =
          document.getElementById(
              'cancelarEditarAdmin'
          );

    if (!section || !table || !form) return;

    try {
      const me = await request('me.php');
      if (!me.usuario || me.usuario.rol !== 'admin' || Number(me.usuario.es_superadmin) !== 1) {
        section.hidden = true;
        return;
      }
      section.hidden = false;

      async function loadAdmins() {
        const data = await request('administradores.php');
        const admins = Array.isArray(data.administradores) ? data.administradores : [];
        table.innerHTML = admins.length ? admins.map(a => `
          <tr>
            <td>${esc(a.id)}</td><td>${esc(a.nombre)}</td><td>${esc(a.correo)}</td>
            <td>${Number(a.es_superadmin) === 1 ? 'Principal' : 'Administrador'}</td>
            <td>${esc(a.estado)}</td><td>${esc(a.fecha_registro)}</td>
            <td>${Number(a.es_superadmin) === 1
                ? '<span>Protegido</span>'
                : `
                <button
                  type="button"
                  class="approval-btn edit-admin-btn"
                  data-id="${esc(a.id)}"
                  data-nombre="${esc(a.nombre)}"
                  data-correo="${esc(a.correo)}"
                >
                  Editar
                </button>

                <button
                  type="button"
                  class="approval-btn
                  ${a.estado === 'activo'
                            ? 'reject-btn'
                            : 'approve-btn'}
                  admin-state-btn"
                  data-id="${esc(a.id)}"
                  data-state="${a.estado === 'activo'
                            ? 'inactivo'
                            : 'activo'}"
                >
                  ${a.estado === 'activo'
                            ? 'Desactivar'
                            : 'Activar'}
                </button>
              `
              }
            </td>
          </tr>`).join('') : '<tr><td colspan="7">No hay administradores registrados.</td></tr>';
      }

      form.addEventListener('submit', async e => {
        e.preventDefault();
        const fd = new FormData(form);
        const nombre = String(fd.get('nombre') || '').trim();
        const correo = String(fd.get('correo') || '').trim();
        const password = String(fd.get('password') || '');
        const confirmPassword = String(fd.get('confirmPassword') || '');
        if (!nombre || !correo || !password || !confirmPassword) return showNotice('administradoresNotice','Completa todos los campos.',true);
        if (password !== confirmPassword) return showNotice('administradoresNotice','Las contraseñas no coinciden.',true);
        try {
          await request('administradores.php',{method:'POST',body:JSON.stringify({nombre,correo,password})});
          form.reset();
          showNotice('administradoresNotice','Administrador creado correctamente.');
          await loadAdmins();
        } catch (error) { showNotice('administradoresNotice',error.message,true); }
      });

        table.addEventListener(
            'click',
            async e => {

                /*
                |--------------------------------------------------------------------------
                | EDITAR ADMINISTRADOR
                |--------------------------------------------------------------------------
                */

                const editBtn =
                    e.target.closest(
                        '.edit-admin-btn'
                    );

                if (editBtn) {

                    editarId.value =
                        editBtn.dataset.id;

                    editarNombre.value =
                        editBtn.dataset.nombre;

                    editarCorreo.value =
                        editBtn.dataset.correo;

                    editarPassword.value = '';

                    editarConfirmPassword.value = '';

                    const notice =
                        document.getElementById(
                            'editarAdminNotice'
                        );

                    if (notice) {
                        notice.textContent = '';
                        notice.className =
                            'admin-notice';
                    }

                    editarModal.classList.add(
                        'open'
                    );

                    return;
                }

                /*
                |--------------------------------------------------------------------------
                | ACTIVAR / DESACTIVAR ADMINISTRADOR
                |--------------------------------------------------------------------------
                */

                const btn =
                    e.target.closest(
                        '.admin-state-btn'
                    );

                if (!btn) {
                    return;
                }

                const nuevoEstado =
                    btn.dataset.state;

                /*
                |--------------------------------------------------------------------------
                | Confirmación mediante modal propio
                |--------------------------------------------------------------------------
                */

                const confirmado =
                    await confirmacionVisual(

                        nuevoEstado === 'activo'
                            ? 'Activar administrador'
                            : 'Desactivar administrador',

                        nuevoEstado === 'activo'
                            ? '¿Deseas activar esta cuenta administrativa? El administrador podrá volver a iniciar sesión.'
                            : '¿Deseas desactivar esta cuenta administrativa? El usuario dejará de poder iniciar sesión.'
                    );

                if (!confirmado) {
                    return;
                }

                /*
                |--------------------------------------------------------------------------
                | Enviar modificación al backend
                |--------------------------------------------------------------------------
                */

                try {

                    btn.disabled = true;

                    const respuesta =
                        await request(
                            'administradores.php',
                            {
                                method: 'PUT',

                                body:
                                    JSON.stringify({
                                        id:
                                            Number(
                                                btn.dataset.id
                                            ),

                                        estado:
                                            nuevoEstado
                                    })
                            }
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | Notificación de éxito
                    |--------------------------------------------------------------------------
                    */

                    showNotice(
                        'administradoresNotice',

                        respuesta.mensaje ||
                        (
                            nuevoEstado === 'activo'
                                ? 'Administrador activado correctamente.'
                                : 'Administrador desactivado correctamente.'
                        )
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | Recargar tabla
                    |--------------------------------------------------------------------------
                    */

                    await loadAdmins();

                } catch (error) {

                    btn.disabled = false;

                    /*
                    |--------------------------------------------------------------------------
                    | Notificación de error
                    |--------------------------------------------------------------------------
                    */

                    showNotice(
                        'administradoresNotice',
                        error.message,
                        true
                    );
                }
            }
        );

        cancelarEditar.addEventListener(
            'click',
            () => {
                editarModal.classList.remove('open');
            }
        );

        editarForm.addEventListener(
            'submit',
            async e => {

                e.preventDefault();

                const id =
                    Number(editarId.value);

                const nombre =
                    editarNombre.value.trim();

                const correo =
                    editarCorreo.value.trim();

                const password =
                    editarPassword.value;

                const confirmPassword =
                    editarConfirmPassword.value;

                if (!nombre || !correo) {
                    return showNotice(
                        'editarAdminNotice',
                        'Nombre y correo son obligatorios.',
                        true
                    );
                }

                if (password !== confirmPassword) {
                    return showNotice(
                        'editarAdminNotice',
                        'Las contraseñas no coinciden.',
                        true
                    );
                }

                try {

                    const payload = {
                        id,
                        nombre,
                        correo
                    };

                    if (password !== '') {
                        payload.password = password;
                    }

                    const respuesta =
                        await request(
                            'administradores.php',
                            {
                                method: 'PUT',
                                body:
                                    JSON.stringify(payload)
                            }
                        );

                    showNotice(
                        'administradoresNotice',
                        respuesta.mensaje
                        || 'Administrador actualizado correctamente.'
                    );

                    editarModal.classList.remove('open');

                    await loadAdmins();

                } catch (error) {

                    showNotice(
                        'editarAdminNotice',
                        error.message,
                        true
                    );
                }
            }
        );

      await loadAdmins();
    } catch (error) {
      section.hidden = true;
      console.error('Error de superadministrador:', error);
    }
  }

  function start() {
    initSolicitudes();
    initSuperAdmin();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
