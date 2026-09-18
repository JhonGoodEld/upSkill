const API='../../api';
let usuario=null, clientes=[], clienteSeleccionado=null, metricasActuales=null, riesgosExpandidos=false;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const api=async(path,options={})=>{const res=await fetch(`${API}/${path}`,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const data=await res.json().catch(()=>({error:'Respuesta no válida del servidor.'}));if(!res.ok)throw new Error(data.error||`Error HTTP ${res.status}`);return data};
function aviso(id,msg,error=false){const el=$(id);el.className=`notice${error?' error':''}`;el.textContent=msg}
function abrir(id){$(id).classList.add('open')} function cerrar(id){$(id).classList.remove('open')}
function initials(nombre=''){return nombre.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'CL'}
function avatarColor(nombre=''){const colors=['#185FA5','#2F7BC1','#6A5ACD','#3B7A78','#8A5A9E','#4876A8','#4E7F65'];let n=0;for(const c of nombre)n=(n+c.charCodeAt(0))%colors.length;return colors[n]}
function fmtFecha(v){if(!v)return 'Sin interacciones registradas';const d=new Date(String(v).replace(' ','T'));return Number.isNaN(d.getTime())?v:d.toLocaleString()}
function telefonoValido(v){return /^(?:\d{10}|\d{3} \d{3} \d{4})$/.test(v.trim())}

async function iniciar(){
 try{
  const me=await api('me.php');usuario=me.usuario;
  if(usuario.rol!=='admin'){alert('El CRM es exclusivo para administradores.');window.location.href='Administradores/loggin.html';return}
  $('userInfo').textContent=`${usuario.nombre} · ${usuario.rol}`;$('adminName').textContent=usuario.nombre;$('adminRole').textContent='Administrador';$('adminInitials').textContent=initials(usuario.nombre);
  await cargarClientes();await cargarMetricas();await cargarActividad();
 }catch(e){console.error('Error al cargar el CRM:',e);alert('No fue posible cargar el CRM: '+e.message);if(/Sesión|permiso|autentic/i.test(e.message))window.location.href='Administradores/loggin.html'}
}

async function cargarClientes(){const d=await api('clientes.php');clientes=(d.clientes||[]).sort((a,b)=>Number(a.id)-Number(b.id));renderClientes();renderInteraccionesClientes()}
function listaFiltrada(){const q=$('buscarCliente').value.trim().toLowerCase(),estado=$('filtroEstado').value,etapa=$('filtroEtapa').value;return clientes.filter(c=>(!q||[c.id,c.nombre,c.correo,c.empresa,c.telefono,c.etapa_crm,c.estado].some(v=>String(v??'').toLowerCase().includes(q)))&&(!estado||c.estado===estado)&&(!etapa||c.etapa_crm===etapa))}
function actionButtons(c){return `<button class="action-btn ver-cliente" data-id="${c.id}" title="Ver historial">👁</button><button class="action-btn editar-cliente" data-id="${c.id}" title="Ver/editar detalles">✎</button><button class="action-btn action-danger eliminar-cliente" data-id="${c.id}" title="Eliminar cliente">🗑</button>`}
function renderClientes(){const lista=listaFiltrada();$('clientesBody').innerHTML=lista.length?lista.map(c=>`<tr><td>${c.id}</td><td>${esc(c.nombre)}</td><td>${esc(c.empresa)}</td><td>${esc(c.correo)}</td><td>${esc(c.telefono)}</td><td><span class="badge">${esc(c.etapa_crm)}</span></td><td><span class="badge ${c.estado==='activo'?'badge-active':'badge-inactive'}">${esc(c.estado)}</span></td><td>${actionButtons(c)}</td></tr>`).join(''):'<tr><td colspan="8" class="empty">No hay clientes que coincidan.</td></tr>'}
function renderInteraccionesClientes(){const q=$('globalSearch').value.trim().toLowerCase();const lista=clientes.filter(c=>!q||[c.id,c.nombre,c.correo,c.empresa,c.etapa_crm,c.estado].some(v=>String(v??'').toLowerCase().includes(q)));$('interaccionesClientesBody').innerHTML=lista.length?lista.map(c=>`<tr><td>${c.id}</td><td>${esc(c.nombre)}</td><td>${esc(c.empresa)}</td><td>${esc(c.correo)}</td><td>${esc(c.etapa_crm)}</td><td>${esc(c.estado)}</td><td><button class="action-btn ver-cliente" data-id="${c.id}" title="Ver historial">👁</button></td></tr>`).join(''):'<tr><td colspan="7" class="empty">Sin resultados.</td></tr>'}

async function cargarMetricas(){
 const m=await api('metricas.php');metricasActuales=m;
 const total=Number(m.total_clientes||0),act=Number(m.clientes_activos||0),pct=total?Math.round(act/total*100):0,delta=Number(m.variacion_interacciones_porcentaje||0);
 $('mTotal').textContent=total;$('mActivos').textContent=act;$('mInteracciones').textContent=m.interacciones_mes??0;$('mRiesgo').textContent=m.clientes_sin_interaccion_reciente??0;
 $('mActivosFoot').textContent=`${pct}% del total de clientes`;$('mInteraccionesFoot').textContent=`${delta>=0?'+':''}${delta}% vs. mes anterior`;$('mInteraccionesFoot').className=`metric-foot ${delta>=0?'positive':'negative'}`;
 renderEstadoBars(m);renderRiesgos(m.clientes_en_riesgo||[]);renderReportes(m)
}
function renderEstadoBars(m){const a=Number(m.clientes_activos||0),i=Number(m.clientes_inactivos||0),t=a+i||1;const rows=[['Activos',a,'active'],['Inactivos',i,'inactive']];$('estadoBars').innerHTML=rows.map(([tipo,n,cls])=>{const p=Math.round(n/t*100);return `<div class="bar-row"><span>${tipo}</span><div class="bar ${cls}"><span style="width:${p}%"></span></div><span class="bar-value">${n} · ${p}%</span></div>`}).join('')}
function renderRiesgos(items){const lista=riesgosExpandidos?items:items.slice(0,3);$('riskList').innerHTML=lista.length?lista.map(c=>`<div class="risk-item risk-open" data-id="${c.id}"><strong>${esc(c.nombre)}</strong><div>${esc(c.empresa||'')}</div><div class="small">${c.ultima_interaccion?'Última interacción: '+esc(fmtFecha(c.ultima_interaccion)):'Sin interacciones registradas'}</div></div>`).join(''):'<div class="empty">No hay clientes en riesgo.</div>';$('toggleRiskBtn').hidden=items.length<=3;$('toggleRiskBtn').textContent=riesgosExpandidos?'Mostrar 3':'Ver todos'}
function renderReportes(m){const total=Number(m.total_clientes||0),act=Number(m.clientes_activos||0),pct=total?Math.round(act/total*100):0,delta=Number(m.variacion_interacciones_porcentaje||0);$('reportCards').innerHTML=`<div class="card metric-card"><div class="metric-label">Total de clientes</div><div class="metric-value">${total}</div><div class="metric-foot">Todos los clientes</div></div><div class="card metric-card"><div class="metric-label">Clientes activos</div><div class="metric-value blue">${act}</div><div class="metric-foot">${pct}% del total de clientes</div></div><div class="card metric-card"><div class="metric-label">Interacciones (este mes)</div><div class="metric-value">${m.interacciones_mes||0}</div><div class="metric-foot ${delta>=0?'positive':'negative'}">${delta>=0?'+':''}${delta}% vs. mes anterior</div></div><div class="card metric-card"><div class="metric-label">Sin interacción reciente</div><div class="metric-value">${m.clientes_sin_interaccion_reciente||0}</div><div class="metric-foot">Últimos 30 días</div></div>`;renderVertical(m.interacciones_por_tipo||[]);renderPie(m.clientes_por_etapa||[])}
function renderVertical(items){const vals=items.map(x=>Number(x.total||0)),max=Math.max(10,Math.ceil((Math.max(...vals,0))/10)*10);const colors=['#1356a2','#5f8fd3','#70b7a5'];$('tipoVerticalChart').innerHTML=[...Array(max/10+1)].map((_,idx)=>`<span class="axis-label" style="bottom:${30+(idx*250/(max/10||1))}px">${idx*10}</span>`).join('')+items.map((x,idx)=>`<div class="vbar-item"><span class="vbar-value">${Number(x.total||0)}</span><div class="vbar" style="height:${Math.max(3,Number(x.total||0)/max*250)}px;background:${colors[idx%colors.length]}"></div><span class="vbar-label">${esc(x.tipo)}</span></div>`).join('')}
function renderPie(items){const colors=['#1356a2','#4f8ad0','#79b5e8','#6f7fae'];const total=items.reduce((s,x)=>s+Number(x.total||0),0)||1;let acc=0,parts=[];items.forEach((x,idx)=>{const start=acc;acc+=Number(x.total||0)/total*360;parts.push(`${colors[idx%colors.length]} ${start}deg ${acc}deg`)});$('etapaPieWrap').innerHTML=`<div class="pie" style="background:conic-gradient(${parts.join(',')||'#e5edf7 0deg 360deg'})"></div><div class="pie-legend">${items.map((x,idx)=>`<div class="legend-row"><span class="legend-dot" style="background:${colors[idx%colors.length]}"></span><span>${esc(x.etapa)}: <strong>${Number(x.total||0)}</strong></span></div>`).join('')}</div>`}

function mostrarDetalle(id){clienteSeleccionado=clientes.find(c=>Number(c.id)===Number(id));if(!clienteSeleccionado)return;const c=clienteSeleccionado;$('clienteProfileCard').innerHTML=`<div class="client-profile"><div class="client-avatar" style="background:${avatarColor(c.nombre)}">${initials(c.nombre)}</div><div><h2>${esc(c.nombre)}</h2><span class="badge ${c.estado==='activo'?'badge-active':'badge-inactive'}">${esc(c.estado)}</span></div></div><div class="client-data-grid"><div class="key">Empresa</div><div>${esc(c.empresa)}</div><div class="key">Correo</div><div>${esc(c.correo)}</div><div class="key">Teléfono</div><div>${esc(c.telefono)}</div><div class="key">Etapa CRM</div><div>${esc(c.etapa_crm)}</div><div class="key">Fecha de registro</div><div>${esc(c.fecha_registro)}</div><div class="key">ID</div><div>${c.id}</div></div>`;abrir('detalleClienteModal')}
async function mostrarHistorial(id){clienteSeleccionado=clientes.find(c=>Number(c.id)===Number(id));if(!clienteSeleccionado)return;const d=await api(`interacciones.php?cliente_id=${id}`);$('historialTitle').textContent=`Historial de interacciones - ${clienteSeleccionado.nombre}`;$('timelineContainer').innerHTML=d.interacciones.length?d.interacciones.map(i=>`<div class="timeline-item"><h4>${esc(i.tipo)}</h4><p>${esc(i.descripcion)}</p><div class="small">Responsable/contacto: ${esc(i.responsable||'No especificado')}</div><div class="small">Registrado por: ${esc(i.usuario_nombre)} · ${esc(fmtFecha(i.fecha))}</div></div>`).join(''):'<div class="empty">Sin interacciones registradas.</div>';abrir('historialModal')}
function abrirCliente(id=null){$('clienteForm').reset();$('clienteId').value=id||'';$('clienteModalTitle').textContent=id?'Editar cliente':'Nuevo cliente';$('clienteFormNotice').textContent='';if(id){const c=clientes.find(x=>Number(x.id)===Number(id));$('clienteNombre').value=c.nombre;$('clienteCorreo').value=c.correo;$('clienteTelefono').value=c.telefono;$('clienteEmpresa').value=c.empresa;$('clienteEstado').value=c.estado}abrir('clienteModal')}
async function guardarCliente(e){e.preventDefault();const id=$('clienteId').value,tel=$('clienteTelefono').value.trim();if(!telefonoValido(tel)){aviso('clienteFormNotice','El teléfono debe ser 4492255316 o 449 225 5316.',true);return}const p={nombre:$('clienteNombre').value.trim(),correo:$('clienteCorreo').value.trim(),telefono:tel,empresa:$('clienteEmpresa').value.trim(),estado:$('clienteEstado').value};try{if(id)await api(`cliente.php?id=${id}`,{method:'PUT',body:JSON.stringify(p)});else await api('clientes.php',{method:'POST',body:JSON.stringify(p)});cerrar('clienteModal');cerrar('detalleClienteModal');await cargarClientes();await cargarMetricas()}catch(e){aviso('clienteFormNotice',e.message,true)}}
async function cambiarEtapa(id,etapa){await api('etapa.php',{method:'PUT',body:JSON.stringify({id,etapa_crm:etapa})});await cargarClientes();await cargarMetricas();clienteSeleccionado=clientes.find(c=>Number(c.id)===Number(id));mostrarDetalle(id);cerrar('etapaModal')}
async function eliminarCliente(id){if(!confirm('¿Eliminar definitivamente este cliente y su historial? Esta acción no se puede deshacer.'))return;try{await api(`cliente.php?id=${id}`,{method:'DELETE'});await cargarClientes();await cargarMetricas()}catch(e){alert(e.message)}}
function prepararInteraccion(){if(!clienteSeleccionado)return;$('interaccionClienteId').value=clienteSeleccionado.id;$('interaccionFecha').value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);$('interaccionDescripcion').value='';$('interaccionResponsable').value=clienteSeleccionado.nombre;abrir('interaccionModal')}
async function guardarInteraccion(e){e.preventDefault();const p={cliente_id:Number($('interaccionClienteId').value),tipo:$('interaccionTipo').value,descripcion:$('interaccionDescripcion').value.trim(),fecha:$('interaccionFecha').value,responsable:$('interaccionResponsable').value.trim()};if(!p.responsable){aviso('interaccionNotice','Indica el responsable o contacto con quien se tuvo la interacción.',true);return}try{await api('interacciones.php',{method:'POST',body:JSON.stringify(p)});cerrar('interaccionModal');await mostrarHistorial(p.cliente_id);await cargarMetricas();await cargarActividad()}catch(e){aviso('interaccionNotice',e.message,true)}}
async function cargarActividad(){const mes=$('actividadMes').value;const d=await api(`actividad.php${mes?`?mes=${encodeURIComponent(mes)}`:''}`);$('actividadBody').innerHTML=d.actividad.length?d.actividad.map(x=>`<tr><td>${esc(fmtFecha(x.fecha))}</td><td>${esc(x.cliente)}</td><td>${esc(x.tipo)}</td><td>${esc(x.responsable||'')}</td><td>${esc(x.descripcion)}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">No hay actividades en este periodo.</td></tr>'}

function cambiarSeccion(id) { document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === id)); document.querySelectorAll('.crm-nav button[data-section]').forEach(b => b.classList.toggle('active', b.dataset.section === id)); const t = { dashboard: 'Resumen CRM', clientes: 'Clientes', interacciones: 'Interacciones', actividad: 'Mi actividad', reportes: 'Reportes', perfil: 'Mi perfil'};$('pageTitle').textContent=t[id]||'CRM';if(id==='reportes'&&metricasActuales)renderReportes(metricasActuales)}
function globalSearch(){const q=$('globalSearch').value.trim();const active=document.querySelector('.section.active')?.id;if(active==='clientes'){$('buscarCliente').value=q;renderClientes()}else if(active==='interacciones')renderInteraccionesClientes();else if(q){cambiarSeccion('clientes');$('buscarCliente').value=q;renderClientes()}}
const translations={es:{dashboard:'Dashboard',clients:'Clientes',interactions:'Interacciones',activity:'Mi actividad',reports:'Reportes',logout:'Cerrar sesión'},en:{dashboard:'Dashboard',clients:'Clients',interactions:'Interactions',activity:'My activity',reports:'Reports',logout:'Log out'}};
function applyLanguage(lang){document.documentElement.dataset.language=lang;document.querySelectorAll('[data-i18n]').forEach(el=>{const v=translations[lang]?.[el.dataset.i18n];if(v)el.textContent=v});$('languageBtn').textContent=lang==='es'?'ES':'EN';localStorage.setItem('upskillLanguage',lang)}
function toggleTheme(){document.body.classList.toggle('dark-mode');localStorage.setItem('upskillTheme',document.body.classList.contains('dark-mode')?'dark':'light');$('themeBtn').textContent=document.body.classList.contains('dark-mode')?'☀':'☾'}

async function cargarPerfil() {

    try {

        const data =
            await api('perfil.php');

        const p =
            data.perfil;

        $('perfilNombre').value =
            p.nombre || '';

        $('perfilCorreo').value =
            p.correo || '';

        $('perfilRol').value =
            p.rol || '';

        $('perfilTipo').value =
            Number(p.es_superadmin) === 1
                ? 'Administrador principal'
                : 'Administrador';

        $('perfilEstado').value =
            p.estado || '';

        $('perfilFecha').value =
            p.fecha_registro || '';

    } catch (e) {

        aviso(
            'perfilNotice',
            e.message,
            true
        );
    }
}

async function guardarPerfil(e) {

    e.preventDefault();

    const nombre =
        $('perfilNombre').value.trim();

    const correo =
        $('perfilCorreo').value.trim();

    const passwordActual =
        $('perfilPasswordActual').value;

    const passwordNueva =
        $('perfilPasswordNueva').value;

    if (!nombre || !correo) {

        return aviso(
            'perfilNotice',
            'Nombre y correo son obligatorios.',
            true
        );
    }

    try {

        const respuesta =
            await api(
                'perfil.php',
                {
                    method: 'PUT',

                    body: JSON.stringify({
                        nombre,
                        correo,

                        password_actual:
                            passwordActual,

                        password_nueva:
                            passwordNueva
                    })
                }
            );

        aviso(
            'perfilNotice',
            respuesta.mensaje
            || 'Perfil actualizado correctamente.'
        );

        /*
        |--------------------------------------------------------------------------
        | Actualizar cabecera
        |--------------------------------------------------------------------------
        */
        usuario.nombre = nombre;
        usuario.correo = correo;

        $('userInfo').textContent =
            `${nombre} · ${usuario.rol}`;

        $('adminName').textContent =
            nombre;

        $('adminInitials').textContent =
            initials(nombre);

        /*
        |--------------------------------------------------------------------------
        | Limpiar contraseñas
        |--------------------------------------------------------------------------
        */
        $('perfilPasswordActual').value =
            '';

        $('perfilPasswordNueva').value =
            '';

    } catch (e) {

        aviso(
            'perfilNotice',
            e.message,
            true
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    $('perfilForm').onsubmit =
        guardarPerfil;
 if(localStorage.getItem('upskillTheme')==='dark')document.body.classList.add('dark-mode');applyLanguage(localStorage.getItem('upskillLanguage')||'es');$('themeBtn').textContent=document.body.classList.contains('dark-mode')?'☀':'☾';
 $('themeBtn').onclick=toggleTheme;$('languageBtn').onclick=()=>applyLanguage(document.documentElement.dataset.language==='es'?'en':'es');$('backBtn').onclick=()=>history.length>1?history.back():location.href='Administradores/admin.html';$('adminPanelBtn').onclick=()=>location.href='Administradores/admin.html';$('globalSearch').addEventListener('input',globalSearch);
    document
        .querySelectorAll('.crm-nav button[data-section]')
        .forEach(b => {

            b.onclick = () => {

                const seccion =
                    b.dataset.section;

                cambiarSeccion(seccion);

                /*
                 * Si entramos a Mi actividad,
                 * actualizamos la tabla.
                 */
                if (seccion === 'actividad') {
                    cargarActividad();
                }

                /*
                 * Si entramos a Mi perfil,
                 * obtenemos los datos actuales
                 * del administrador desde MySQL.
                 */
                if (seccion === 'perfil') {
                    cargarPerfil();
                }

                /*
                 * Si entramos a Reportes,
                 * usamos las métricas actuales.
                 */
                if (
                    seccion === 'reportes'
                    && metricasActuales
                ) {
                    renderReportes(
                        metricasActuales
                    );
                }
            };
        });
 $('clientesBody').onclick = e => { const id = e.target.dataset.id; if (!id) return; if (e.target.classList.contains('ver-cliente')) mostrarHistorial(id); if (e.target.classList.contains('editar-cliente')) mostrarDetalle(id); if (e.target.classList.contains('eliminar-cliente')) eliminarCliente(id) }; $('interaccionesClientesBody').onclick = e => { if (e.target.classList.contains('ver-cliente')) mostrarHistorial(e.target.dataset.id) }; $('riskList').onclick = e => { const el = e.target.closest('.risk-open'); if (el) mostrarDetalle(el.dataset.id) }; $('toggleRiskBtn').onclick = () => { riesgosExpandidos = !riesgosExpandidos; renderRiesgos(metricasActuales?.clientes_en_riesgo || []) };
 $('volverDetalle').onclick=$('cerrarDetalle').onclick=()=>cerrar('detalleClienteModal');$('volverHistorial').onclick=$('cerrarHistorial').onclick=()=>cerrar('historialModal');$('editarDesdeDetalle').onclick=()=>{const id=clienteSeleccionado?.id;cerrar('detalleClienteModal');if(id)abrirCliente(id)};$('cambiarEtapaDesdeDetalle').onclick=()=>{if(!clienteSeleccionado)return;$('etapaSelect').value=clienteSeleccionado.etapa_crm;abrir('etapaModal')};$('guardarEtapaBtn').onclick=()=>clienteSeleccionado&&cambiarEtapa(clienteSeleccionado.id,$('etapaSelect').value);$('cancelarEtapaBtn').onclick=()=>cerrar('etapaModal');$('nuevaInteraccionBtn').onclick=prepararInteraccion;
 $('clienteTelefono').addEventListener('input',e=>{e.target.value=e.target.value.replace(/[^0-9 ]/g,'').replace(/ {2,}/g,' ').slice(0,12)});
 $('logoutBtn').onclick=async()=>{try{await api('logout.php',{method:'POST'})}finally{location.href='Administradores/loggin.html'}};
 iniciar();
});
