/* ============================================================
   CRM upSkill — Front-end (Etapa 1)
   Se conecta al back-end de /backend (Node + Express + SQLite).
   ============================================================ */

const API = localStorage.getItem('crm_api') || 'http://localhost:3000/api';

const state = {
  token: localStorage.getItem('crm_token') || null,
  usuario: JSON.parse(localStorage.getItem('crm_usuario') || 'null'),
  clientes: [],
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
  if (res.status !== 204) {
    data = await res.json().catch(() => null);
  }
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}

/* ---------- Sesión ---------- */
function guardarSesion({ token, usuario }) {
  state.token = token;
  state.usuario = usuario;
  localStorage.setItem('crm_token', token);
  localStorage.setItem('crm_usuario', JSON.stringify(usuario));
}

function cerrarSesion() {
  state.token = null;
  state.usuario = null;
  localStorage.removeItem('crm_token');
  localStorage.removeItem('crm_usuario');
  $('#appView').classList.add('oculto');
  $('#loginView').classList.remove('oculto');
}

function entrarApp() {
  $('#loginView').classList.add('oculto');
  $('#appView').classList.remove('oculto');
  $('#userNombre').textContent = state.usuario?.nombre || '';
  $('#userRol').textContent = state.usuario?.rol || '';
  cambiarTab('clientes');
  cargarClientes();
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        correo: $('#loginCorreo').value.trim(),
        password: $('#loginPassword').value,
      }),
    });
    guardarSesion(data);
    entrarApp();
  } catch (err) {
    toast(err.message, 'err');
  }
});

$('#btnLogout').addEventListener('click', cerrarSesion);

/* ---------- Navegación por pestañas ---------- */
function cambiarTab(tab) {
  $$('.crm-tabs button').forEach((b) => b.classList.toggle('activo', b.dataset.tab === tab));
  $$('.crm-view').forEach((v) => v.classList.toggle('activo', v.id === 'tab-' + tab));
  if (tab === 'metricas') cargarMetricas();
  if (tab === 'actividad') cargarActividad();
}
$$('.crm-tabs button').forEach((b) => b.addEventListener('click', () => cambiarTab(b.dataset.tab)));

/* ============================================================
   CLIENTES
   ============================================================ */
let filtroTimer;
['#fBuscar', '#fEstado', '#fEtapa'].forEach((sel) => {
  $(sel).addEventListener('input', () => {
    clearTimeout(filtroTimer);
    filtroTimer = setTimeout(cargarClientes, 250);
  });
});

async function cargarClientes() {
  const params = new URLSearchParams();
  if ($('#fBuscar').value.trim()) params.set('buscar', $('#fBuscar').value.trim());
  if ($('#fEstado').value) params.set('estado', $('#fEstado').value);
  if ($('#fEtapa').value) params.set('etapa', $('#fEtapa').value);

  try {
    state.clientes = await api('/clientes?' + params.toString());
    renderClientes();
  } catch (err) {
    toast(err.message, 'err');
  }
}

const ETAPAS = ['Prospecto', 'Activo', 'Frecuente', 'Inactivo'];
const esAdmin = () => state.usuario?.rol === 'admin';

function renderClientes() {
  const tb = $('#tbodyClientes');
  tb.innerHTML = '';
  $('#clientesVacio').classList.toggle('oculto', state.clientes.length > 0);

  state.clientes.forEach((c) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${esc(c.nombre)}</td>
      <td>${esc(c.correo)}</td>
      <td>${esc(c.telefono || '—')}</td>
      <td>${esc(c.empresa || '—')}</td>
      <td><span class="pill ${c.estado}">${c.estado}</span></td>
      <td>
        <select class="etapa-select" data-id="${c.id}">
          ${ETAPAS.map((e) => `<option value="${e}" ${e === c.etapa_crm ? 'selected' : ''}>${e}</option>`).join('')}
        </select>
      </td>
      <td class="acciones">
        <button class="btn mini secundario" data-accion="historial" data-id="${c.id}">Historial</button>
        <button class="btn mini secundario" data-accion="editar" data-id="${c.id}">Editar</button>
        ${esAdmin() ? `<button class="btn mini peligro" data-accion="eliminar" data-id="${c.id}">Eliminar</button>` : ''}
      </td>`;
    tb.appendChild(tr);
  });
}

$('#tbodyClientes').addEventListener('change', async (e) => {
  const sel = e.target.closest('.etapa-select');
  if (!sel) return;
  try {
    await api(`/clientes/${sel.dataset.id}/etapa`, {
      method: 'PUT',
      body: JSON.stringify({ etapa_crm: sel.value }),
    });
    toast('Etapa actualizada', 'ok');
    const c = state.clientes.find((x) => x.id == sel.dataset.id);
    if (c) c.etapa_crm = sel.value;
  } catch (err) {
    toast(err.message, 'err');
    cargarClientes();
  }
});

$('#tbodyClientes').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-accion]');
  if (!btn) return;
  const id = btn.dataset.id;
  const cliente = state.clientes.find((x) => x.id == id);
  if (btn.dataset.accion === 'editar') abrirModalCliente(cliente);
  if (btn.dataset.accion === 'historial') abrirHistorial(cliente);
  if (btn.dataset.accion === 'eliminar') eliminarCliente(cliente);
});

async function eliminarCliente(c) {
  if (!confirm(`¿Eliminar al cliente "${c.nombre}"? Se borrarán también sus interacciones.`)) return;
  try {
    await api('/clientes/' + c.id, { method: 'DELETE' });
    toast('Cliente eliminado', 'ok');
    cargarClientes();
  } catch (err) {
    toast(err.message, 'err');
  }
}

/* ---------- Modal cliente (alta / edición) ---------- */
function abrirModalCliente(c = null) {
  $('#modalClienteTitulo').textContent = c ? 'Editar cliente' : 'Nuevo cliente';
  $('#cId').value = c?.id || '';
  $('#cNombre').value = c?.nombre || '';
  $('#cCorreo').value = c?.correo || '';
  $('#cTelefono').value = c?.telefono || '';
  $('#cEmpresa').value = c?.empresa || '';
  $('#cEstado').value = c?.estado || 'activo';
  $('#cEtapa').value = c?.etapa_crm || 'Prospecto';
  abrirModal('#modalCliente');
}

$('#formCliente').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#cId').value;
  const body = {
    nombre: $('#cNombre').value.trim(),
    correo: $('#cCorreo').value.trim(),
    telefono: $('#cTelefono').value.trim(),
    empresa: $('#cEmpresa').value.trim(),
    estado: $('#cEstado').value,
    etapa_crm: $('#cEtapa').value,
  };
  try {
    await api(id ? '/clientes/' + id : '/clientes', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(body),
    });
    toast(id ? 'Cliente actualizado' : 'Cliente creado', 'ok');
    cerrarModal('#modalCliente');
    cargarClientes();
  } catch (err) {
    toast(err.message, 'err');
  }
});

$('#btnNuevoCliente').addEventListener('click', () => abrirModalCliente());

/* ============================================================
   HISTORIAL DE INTERACCIONES
   ============================================================ */
async function abrirHistorial(c) {
  $('#histTitulo').textContent = 'Historial — ' + c.nombre;
  $('#iClienteId').value = c.id;
  abrirModal('#modalHistorial');
  await refrescarTimeline(c.id);
}

async function refrescarTimeline(clienteId) {
  try {
    const rows = await api(`/clientes/${clienteId}/interacciones`);
    const ul = $('#timeline');
    ul.innerHTML = '';
    $('#histVacio').classList.toggle('oculto', rows.length > 0);
    rows.forEach((i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="tipo">${esc(i.tipo)}</div>
        <div>${esc(i.descripcion)}</div>
        <div class="meta">${fechaCorta(i.fecha)} · ${esc(i.usuario_nombre || 'usuario')}</div>`;
      ul.appendChild(li);
    });
  } catch (err) {
    toast(err.message, 'err');
  }
}

$('#formInteraccion').addEventListener('submit', async (e) => {
  e.preventDefault();
  const clienteId = $('#iClienteId').value;
  try {
    await api('/interacciones', {
      method: 'POST',
      body: JSON.stringify({
        cliente_id: Number(clienteId),
        tipo: $('#iTipo').value,
        descripcion: $('#iDescripcion').value.trim(),
      }),
    });
    $('#iDescripcion').value = '';
    toast('Interacción registrada', 'ok');
    refrescarTimeline(clienteId);
  } catch (err) {
    toast(err.message, 'err');
  }
});

/* ============================================================
   MÉTRICAS
   ============================================================ */
async function cargarMetricas() {
  try {
    const m = await api('/metricas');

    $('#cardsMetricas').innerHTML = [
      ['Clientes', m.totales.clientes],
      ['Activos', m.totales.activos],
      ['Inactivos', m.totales.inactivos],
      ['Interacciones', m.totales.interacciones],
      ['En riesgo', m.totales.clientes_en_riesgo],
    ].map(([lbl, num]) => `<div class="crm-card"><div class="num">${num}</div><div class="lbl">${lbl}</div></div>`).join('');

    $('#riesgoDias').textContent = `(> ${m.dias_sin_contacto} días sin contacto)`;

    const tb = $('#tbodyRiesgo');
    tb.innerHTML = '';
    $('#riesgoVacio').classList.toggle('oculto', m.clientes_en_riesgo.length > 0);
    m.clientes_en_riesgo.forEach((c) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${esc(c.nombre)}</td>
        <td><span class="pill etapa-${c.etapa_crm}">${c.etapa_crm}</span></td>
        <td>${c.ultima_interaccion ? fechaCorta(c.ultima_interaccion) : 'Nunca'}</td>`;
      tb.appendChild(tr);
    });

    dibujarChart(m.por_etapa);
  } catch (err) {
    toast(err.message, 'err');
  }
}

function dibujarChart(porEtapa) {
  const ctx = $('#chartEtapas').getContext('2d');
  const labels = porEtapa.map((e) => e.etapa_crm);
  const data = porEtapa.map((e) => e.n);
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#818cf8', '#4ade80', '#facc15', '#94a3b8'],
      }],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
  });
}

/* ============================================================
   MI ACTIVIDAD
   ============================================================ */
async function cargarActividad() {
  try {
    const rows = await api('/interacciones/mias');
    const tb = $('#tbodyActividad');
    tb.innerHTML = '';
    $('#actividadVacio').classList.toggle('oculto', rows.length > 0);
    rows.forEach((i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${fechaCorta(i.fecha)}</td>
        <td>${esc(i.cliente_nombre || '')}</td>
        <td>${esc(i.tipo)}</td>
        <td>${esc(i.descripcion)}</td>`;
      tb.appendChild(tr);
    });
  } catch (err) {
    toast(err.message, 'err');
  }
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
  if (!state.token) return;
  try {
    // Valida el token guardado.
    state.usuario = await api('/auth/me');
    localStorage.setItem('crm_usuario', JSON.stringify(state.usuario));
    entrarApp();
  } catch {
    cerrarSesion();
  }
})();
