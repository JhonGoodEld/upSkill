(() => {
  let csrfPromise = null;
  // Cada página indica dónde está la API (data-api-base); views/ERP/* usa ../../api.
  const baseDefault = () => (document.body && document.body.dataset.apiBase) || '../api';
  async function token(base = baseDefault()) {
    if (!csrfPromise) {
      csrfPromise = fetch(`${base}/csrf.php`, { credentials: 'same-origin', cache: 'no-store' })
        .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'No se pudo iniciar la sesión segura.'); return d.csrf_token; })
        .catch(err => { csrfPromise = null; throw err; });
    }
    return csrfPromise;
  }
  async function request(path, options = {}, base = baseDefault()) {
    const method = String(options.method || 'GET').toUpperCase();
    const headers = { ...(options.headers || {}) };
    let body = options.body;
    if (body && typeof body !== 'string') { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    if (!['GET','HEAD','OPTIONS'].includes(method)) headers['X-CSRF-Token'] = await token(base);
    const response = await fetch(`${base}/${path}`, { ...options, method, body, headers, credentials: 'same-origin', cache: 'no-store' });
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : {}; } catch { throw new Error(`Respuesta no válida del servidor: ${raw.slice(0,160)}`); }
    if (!response.ok) { if (response.status === 419) csrfPromise = null; const error = new Error(data.error || `Error HTTP ${response.status}`); error.status = response.status; throw error; }
    return data;
  }
  window.TiendaAPI = { request, token };
})();
