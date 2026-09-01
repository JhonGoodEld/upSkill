/* ============================================================
   Login unificado — upSkill
   Autentica contra el backend (JWT) y redirige según el rol.
   ============================================================ */

const API = localStorage.getItem('crm_api') || 'http://localhost:3000/api';

// A dónde va cada rol después de entrar.
const DESTINO = {
  admin: 'crm.html',
  docente: 'crm-docente.html',
  alumno: 'alumno.html',
};

const HINT_ROL = {
  admin: 'Ingresa con tu cuenta de administrador.',
  docente: 'Ingresa con tu cuenta de docente.',
  alumno: 'Ingresa con tu cuenta de alumno.',
};

const $ = (sel) => document.querySelector(sel);
let rolElegido = 'admin';

function toast(msg, tipo = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'crm-toast show ' + tipo;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.className = 'crm-toast'), 3600);
}

/* ---------- Selección de rol (solo cambia el acento y el texto) ---------- */
document.querySelectorAll('#roleTabs button').forEach((b) => {
  b.addEventListener('click', () => {
    rolElegido = b.dataset.rol;
    document.querySelectorAll('#roleTabs button').forEach((x) => x.classList.toggle('activo', x === b));
  });
});

/* ---------- Si ya hay sesión válida, salta directo ---------- */
(async function yaLogueado() {
  const token = localStorage.getItem('crm_token');
  if (!token) return;
  try {
    const res = await fetch(API + '/auth/me', { headers: { Authorization: 'Bearer ' + token } });
    if (!res.ok) throw new Error();
    const usuario = await res.json();
    localStorage.setItem('crm_usuario', JSON.stringify(usuario));
    location.href = DESTINO[usuario.rol] || 'login.html';
  } catch {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_usuario');
  }
})();

/* ---------- Envío del formulario ---------- */
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const correo = $('#correo').value.trim();
  const password = $('#password').value;

  try {
    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);

    localStorage.setItem('crm_token', data.token);
    localStorage.setItem('crm_usuario', JSON.stringify(data.usuario));

    const rolReal = data.usuario.rol;
    if (rolReal !== rolElegido) {
      toast(`Tu cuenta es de "${rolReal}". Entrando a su panel...`);
    }
    setTimeout(() => (location.href = DESTINO[rolReal] || 'login.html'), rolReal !== rolElegido ? 900 : 0);
  } catch (err) {
    toast(err.message, 'err');
  }
});
