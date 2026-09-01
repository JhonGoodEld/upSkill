/* ============================================================
   CRM Docente — upSkill (Etapa 1)
   Pipeline de contactos del docente (prospecto -> graduado) + seguimientos.
   Se conecta a /api/docente/* del back-end. Datos aislados por docente.
   ============================================================ */

const API = localStorage.getItem('crm_api') || 'http://localhost:3000/api';
const DESTINO_ROL = { admin: 'crm.html', alumno: 'alumno.html' };

const ETAPAS = ['Prospecto', 'Inscrito', 'Al dia', 'En riesgo', 'Graduado'];
const etapaClase = (e) => 'et-' + String(e).toLowerCase().replace(/\s+/g, '-');

const state = {
  token: localStorage.getItem('crm_token') || null,
  usuario: JSON.parse(localStorage.getItem('crm_usuario') || 'null'),
  contactos: [],
  chart: null,
};

/* ---------- Utilidades ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function toast(msg, tipo = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'crm-toast show ' + tipo;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.className = 'crm-toast'), 3200);
}

function fechaCorta(iso) {
  if (!iso) return '—';
  const d = new Date(iso.replace(' ', 'T'));
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ---------- Cliente HTTP ---------- */
async function api(ruta, opciones = {}) {
  const res = await fetch(API + ruta, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: 'Bearer ' + state.token } : {}),
      ...(opciones.headers || {}),
    },
  });

  if (res.status === 401) {
    cerrarSesion();
    throw new Error('Sesión expirada, vuelve a entrar.');
  }

  let data = null;
  if (res.status !== 204) data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}

/* ---------- Sesión ---------- */
function cerrarSesion() {
  state.token = null;
  state.usuario = null;
  localStorage.removeItem('crm_token');
  localStorage.removeItem('crm_usuario');
  location.href = 'login.html';
}

function entrarApp() {
  $('#appView').classList.remove('oculto');
  $('#userNombre').textContent = state.usuario?.nombre || '';
  cambiarTab('contactos');
  cargarContactos();
}

$('#btnLogout').addEventListener('click', cerrarSesion);

/* ---------- Navegación por pestañas ---------- */
function cambiarTab(tab) {
  $$('.crm-tabs button').forEach((b) => b.classList.toggle('activo', b.dataset.tab === tab));
  $$('.crm-view').forEach((v) => v.classList.toggle('activo', v.id === 'tab-' + tab));
  if (tab === 'metricas') cargarMetricas();
}
$$('.crm-tabs button').forEach((b) => b.addEventListener('click', () => cambiarTab(b.dataset.tab)));

/* ============================================================
   CONTACTOS
   ============================================================ */
let filtroTimer;
['#fBuscar', '#fEstado', '#fEtapa'].forEach((sel) => {
  $(sel).addEventListener('input', () => {
    clearTimeout(filtroTimer);
    filtroTimer = setTimeout(cargarContactos, 250);
  });
});

async function cargarContactos() {
  const params = new URLSearchParams();
  if ($('#fBuscar').value.trim()) params.set('buscar', $('#fBuscar').value.trim());
  if ($('#fEstado').value) params.set('estado', $('#fEstado').value);
  if ($('#fEtapa').value) params.set('etapa', $('#fEtapa').value);

  try {
    state.contactos = await api('/docente/contactos?' + params.toString());
    renderContactos();
  } catch (err) {
    toast(err.message, 'err');
  }
}

function renderContactos() {
  const tb = $('#tbodyContactos');
  tb.innerHTML = '';
  $('#contactosVacio').classList.toggle('oculto', state.contactos.length > 0);

  state.contactos.forEach((c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${esc(c.nombre)}</td>
      <td>${esc(c.correo)}</td>
      <td>${esc(c.telefono || '—')}</td>
      <td>${esc(c.curso || '—')}</td>
      <td><span class="pill ${c.estado}">${c.estado}</span></td>
      <td>
        <select class="etapa-select" data-id="${c.id}">
          ${ETAPAS.map((e) => `<option value="${e}" ${e === c.etapa ? 'selected' : ''}>${e}</option>`).join('')}
        </select>
      </td>
      <td class="acciones">
        <button class="btn mini secundario" data-accion="seguimiento" data-id="${c.id}">Seguimiento</button>
        <button class="btn mini secundario" data-accion="editar" data-id="${c.id}">Editar</button>
        <button class="btn mini peligro" data-accion="eliminar" data-id="${c.id}">Eliminar</button>
      </td>`;
    tb.appendChild(tr);
  });
}

$('#tbodyContactos').addEventListener('change', async (e) => {
  const sel = e.target.closest('.etapa-select');
  if (!sel) return;
  try {
    await api(`/docente/contactos/${sel.dataset.id}/etapa`, {
      method: 'PUT',
      body: JSON.stringify({ etapa: sel.value }),
    });
    toast('Etapa actualizada', 'ok');
    const c = state.contactos.find((x) => x.id == sel.dataset.id);
    if (c) c.etapa = sel.value;
  } catch (err) {
    toast(err.message, 'err');
    cargarContactos();
  }
});

$('#tbodyContactos').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-accion]');
  if (!btn) return;
  const contacto = state.contactos.find((x) => x.id == btn.dataset.id);
  if (btn.dataset.accion === 'editar') abrirModalContacto(contacto);
  if (btn.dataset.accion === 'seguimiento') abrirSeguimiento(contacto);
  if (btn.dataset.accion === 'eliminar') eliminarContacto(contacto);
});

async function eliminarContacto(c) {
  if (!confirm(`¿Eliminar a "${c.nombre}"? Se borrarán también sus seguimientos.`)) return;
  try {
    await api('/docente/contactos/' + c.id, { method: 'DELETE' });
    toast('Contacto eliminado', 'ok');
    cargarContactos();
  } catch (err) {
    toast(err.message, 'err');
  }
}

/* ---------- Modal contacto (alta / edición) ---------- */
function abrirModalContacto(c = null) {
  $('#modalContactoTitulo').textContent = c ? 'Editar contacto' : 'Nuevo contacto';
  $('#cId').value = c?.id || '';
  $('#cNombre').value = c?.nombre || '';
  $('#cCorreo').value = c?.correo || '';
  $('#cTelefono').value = c?.telefono || '';
  $('#cCurso').value = c?.curso || '';
  $('#cEstado').value = c?.estado || 'activo';
  $('#cEtapa').value = c?.etapa || 'Prospecto';
  abrirModal('#modalContacto');
}

$('#formContacto').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#cId').value;
  const body = {
    nombre: $('#cNombre').value.trim(),
    correo: $('#cCorreo').value.trim(),
    telefono: $('#cTelefono').value.trim(),
    curso: $('#cCurso').value.trim(),
    estado: $('#cEstado').value,
    etapa: $('#cEtapa').value,
  };
  try {
    await api(id ? '/docente/contactos/' + id : '/docente/contactos', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(body),
    });
    toast(id ? 'Contacto actualizado' : 'Contacto creado', 'ok');
    cerrarModal('#modalContacto');
    cargarContactos();
  } catch (err) {
    toast(err.message, 'err');
  }
});

$('#btnNuevo').addEventListener('click', () => abrirModalContacto());

/* ============================================================
   SEGUIMIENTOS
   ============================================================ */
async function abrirSeguimiento(c) {
  $('#segTitulo').textContent = 'Seguimiento — ' + c.nombre;
  $('#sContactoId').value = c.id;
  abrirModal('#modalSeguimiento');
  await refrescarTimeline(c.id);
}

async function refrescarTimeline(contactoId) {
  try {
    const rows = await api(`/docente/contactos/${contactoId}/seguimientos`);
    const ul = $('#timeline');
    ul.innerHTML = '';
    $('#segVacio').classList.toggle('oculto', rows.length > 0);
    rows.forEach((s) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="tipo">${esc(s.tipo)}</div>
        <div>${esc(s.descripcion)}</div>
        <div class="meta">${fechaCorta(s.fecha)}</div>`;
      ul.appendChild(li);
    });
  } catch (err) {
    toast(err.message, 'err');
  }
}

$('#formSeguimiento').addEventListener('submit', async (e) => {
  e.preventDefault();
  const contactoId = $('#sContactoId').value;
  try {
    await api('/docente/seguimientos', {
      method: 'POST',
      body: JSON.stringify({
        contacto_id: Number(contactoId),
        tipo: $('#sTipo').value,
        descripcion: $('#sDescripcion').value.trim(),
      }),
    });
    $('#sDescripcion').value = '';
    toast('Seguimiento registrado', 'ok');
    refrescarTimeline(contactoId);
  } catch (err) {
    toast(err.message, 'err');
  }
});

/* ============================================================
   MÉTRICAS
   ============================================================ */
async function cargarMetricas() {
  try {
    const m = await api('/docente/metricas');
    const porEtapa = Object.fromEntries(m.por_etapa.map((e) => [e.etapa, e.n]));

    $('#cardsMetricas').innerHTML = [
      ['Contactos', m.totales.contactos],
      ['Inscritos', porEtapa['Inscrito'] || 0],
      ['Al día', porEtapa['Al dia'] || 0],
      ['En riesgo', porEtapa['En riesgo'] || 0],
      ['Graduados', porEtapa['Graduado'] || 0],
      ['Sin seguimiento', m.totales.sin_seguimiento],
    ].map(([lbl, num]) => `<div class="crm-card"><div class="num">${num}</div><div class="lbl">${lbl}</div></div>`).join('');

    $('#riesgoDias').textContent = `(> ${m.dias_sin_contacto} días)`;

    const tb = $('#tbodyRiesgo');
    tb.innerHTML = '';
    $('#riesgoVacio').classList.toggle('oculto', m.sin_seguimiento.length > 0);
    m.sin_seguimiento.forEach((c) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${esc(c.nombre)}</td>
        <td><span class="pill ${etapaClase(c.etapa)}">${c.etapa}</span></td>
        <td>${c.ultimo_seguimiento ? fechaCorta(c.ultimo_seguimiento) : 'Nunca'}</td>`;
      tb.appendChild(tr);
    });

    dibujarChart(m.por_etapa);
  } catch (err) {
    toast(err.message, 'err');
  }
}

function dibujarChart(porEtapa) {
  const ctx = $('#chartEtapas').getContext('2d');
  // Ordena las etapas siguiendo el pipeline.
  const orden = ETAPAS.filter((e) => porEtapa.some((x) => x.etapa === e));
  const mapa = Object.fromEntries(porEtapa.map((e) => [e.etapa, e.n]));
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: orden,
      datasets: [{
        data: orden.map((e) => mapa[e]),
        backgroundColor: ['#818cf8', '#60a5fa', '#4ade80', '#f87171', '#facc15'],
      }],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
  });
}

/* ============================================================
   MODALES (helpers)
   ============================================================ */
function abrirModal(sel) { $(sel).classList.remove('oculto'); }
function cerrarModal(sel) { $(sel).classList.add('oculto'); }

$$('.crm-modal').forEach((m) => {
  m.addEventListener('click', (e) => {
    if (e.target === m || e.target.hasAttribute('data-cerrar')) m.classList.add('oculto');
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') $$('.crm-modal').forEach((m) => m.classList.add('oculto'));
});

/* ============================================================
   ARRANQUE
   ============================================================ */
(async function init() {
  if (!state.token) {
    location.href = 'login.html';
    return;
  }
  try {
    state.usuario = await api('/auth/me');
    localStorage.setItem('crm_usuario', JSON.stringify(state.usuario));
    if (state.usuario.rol !== 'docente') {
      location.href = DESTINO_ROL[state.usuario.rol] || 'login.html';
      return;
    }
    entrarApp();
  } catch {
    cerrarSesion();
  }
})();
