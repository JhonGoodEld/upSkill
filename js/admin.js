        // ======== Acordeón =========
    document.querySelectorAll(".accordion").forEach(btn => {
    btn.addEventListener("click", () => {
        const panel = btn.nextElementSibling;
        panel.style.display = panel.style.display === "block" ? "none" : "block";
    });
    });

    // ======== Mock: Inventario de cursos =========
    const cursos = [
    { id: 1, nombre: "JavaScript", categoria: "Programación", precio: 499, estado: "Activo" },
    { id: 2, nombre: "Python", categoria: "Programación", precio: 599, estado: "Activo" },
    { id: 3, nombre: "Excel Avanzado", categoria: "Ofimática", precio: 299, estado: "Inactivo" },
    ];

    const tbodyCursos = document.querySelector("#tablaCursos tbody");

    function renderCursos() {
    tbodyCursos.innerHTML = "";
    cursos.forEach(c => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
        <td>${c.id}</td>
        <td>${c.nombre}</td>
        <td>${c.categoria}</td>
        <td>$${c.precio}</td>
        <td>${c.estado}</td>
        <td><button class="btn-toggle" data-id="${c.id}">${c.estado === "Activo" ? "Desactivar" : "Activar"}</button></td>
        `;
        tbodyCursos.appendChild(fila);
    });
    }
    renderCursos();

    // Evento de activación/inactivación
    tbodyCursos.addEventListener("click", e => {
    if (e.target.classList.contains("btn-toggle")) {
        const id = e.target.getAttribute("data-id");
        const curso = cursos.find(c => c.id == id);
        curso.estado = curso.estado === "Activo" ? "Inactivo" : "Activo";
        renderCursos();
    }
    });

        document.addEventListener("DOMContentLoaded", () => {
    // ======== Mock: Docentes registrados =========
    const docentes = [
        { nombre: "Laura Hernández", especialidad: "Desarrollo Web" },
        { nombre: "Miguel Torres", especialidad: "Ciencia de Datos" },
        { nombre: "Carla López", especialidad: "Ciberseguridad" },
        { nombre: "Roberto Díaz", especialidad: "Inteligencia Artificial" }
    ];

    const listaDocentes = document.getElementById("listaDocentes");
    const formDocente = document.getElementById("formDocente");

    // Mostrar docentes iniciales
    function mostrarDocentes() {
        listaDocentes.innerHTML = "";
        docentes.forEach(d => {
        const li = document.createElement("li");
        li.textContent = `${d.nombre} — ${d.especialidad}`;
        listaDocentes.appendChild(li);
        });
    }

    mostrarDocentes();

    // Registrar docente (sin validaciones)
    formDocente.addEventListener("submit", (e) => {
        e.preventDefault();

        const nombre = formDocente.querySelector('input[placeholder="Nombre completo"]').value || "Docente genérico";
        const especialidad = formDocente.querySelector('input[placeholder="Especialidad"]').value || "Sin especialidad";
        const correo = formDocente.querySelector('input[placeholder="Correo institucional"]').value || "correo@institucion.mx";

        // Agregar al mock local
        docentes.push({ nombre, especialidad, correo });
        mostrarDocentes();

        // Crear modal de éxito
        const modal = document.createElement("div");
        modal.className = "modal-mensaje";
        modal.innerHTML = `
        <div class="modal-contenido">
            <h3>✅ Registro exitoso</h3>
            <p>El docente ha sido registrado correctamente.</p>
            <button id="cerrarModal">Aceptar</button>
        </div>
        `;
        document.body.appendChild(modal);

            const btnCerrar = modal.querySelector("#cerrarModal");
    btnCerrar.addEventListener("click", () => {
        modal.remove();
    });


        // Limpiar formulario
        formDocente.reset();
    });
    });


    // ======== Mock: Estudiantes =========
    const estudiantes = [
    { nombre: "Ana Torres", curso: "JavaScript", pago: "Completo", estado: "Activo" },
    { nombre: "Carlos Vega", curso: "Python", pago: "Pendiente", estado: "Suspendido" },
    { nombre: "Luis Herrera", curso: "Excel Avanzado", pago: "Completo", estado: "Activo" }
    ];

    const tbodyEstudiantes = document.querySelector("#tablaEstudiantes tbody");
    estudiantes.forEach(e => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
        <td>${e.nombre}</td>
        <td>${e.curso}</td>
        <td>${e.pago}</td>
        <td>${e.estado}</td>
    `;
    tbodyEstudiantes.appendChild(fila);
    });

    // ======== Mock: Crear planes de carrera con toast =========
    const formPlan = document.querySelector("#formPlan");
    const toast = document.querySelector("#toast");

    formPlan.addEventListener("submit", e => {
    e.preventDefault();

    // Se omite validación — permite crear sin datos
    mostrarToast("✅ Plan de carrera creado con éxito");
    formPlan.reset();
    });

    function mostrarToast(mensaje) {
    toast.textContent = mensaje;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000); // desaparece tras 3 segundos
    }



    // ======== Mock: Modificar cursos =========
    const modificarContainer = document.querySelector("#modificarCursos");
    cursos.forEach(c => {
    const div = document.createElement("div");
    div.innerHTML = `
        <strong>${c.nombre}</strong> — $${c.precio}</strong> — $${c.categoria}</strong> — $${c.estado}
        <button>Editar</button>
    `;
    modificarContainer.appendChild(div);
    });


    /* escript de lo que viene siendoo la barra de progreso*/

    document.addEventListener("DOMContentLoaded", () => {
    // Porcentaje del docente
    const porcentajeDocente = Math.floor(Math.random() * 51) + 50; // entre 50 y 100
    // El grupo no puede superar al docente
    const porcentajeGrupo = Math.floor(Math.random() * (porcentajeDocente + 1));

    const barraDocente = document.getElementById("barraDocente");
    const barraGrupo = document.getElementById("barraGrupo");
    const textoDocente = document.getElementById("porcentajeDocente");
    const textoGrupo = document.getElementById("porcentajeGrupo");

    // Asignar valores visuales
    barraDocente.style.width = `${porcentajeDocente}%`;
    barraGrupo.style.width = `${porcentajeGrupo}%`;

    textoDocente.textContent = `${porcentajeDocente}% completado`;
    textoGrupo.textContent = `${porcentajeGrupo}% completado`;
});

/* escript de las estadisticas*/
 
    document.addEventListener("DOMContentLoaded", () => {
    // 🔹 Generar estadísticas aleatorias
    const visitas = Math.floor(Math.random() * 9000) + 1000; // 1,000 - 10,000
    const sesiones = Math.floor(visitas * (0.8 + Math.random() * 0.4)); // 80%–120% de visitas
    const usuarios = Math.floor(sesiones * (0.5 + Math.random() * 0.3)); // 50%–80%
    const duracion = (Math.random() * 5 + 1).toFixed(2); // 1.00–6.00 min
    const navegadores = Math.floor(Math.random() * 6) + 1; // 1–6 navegadores distintos
    const redes = Math.floor(visitas * (0.1 + Math.random() * 0.3)); // 10%–40% de visitas desde redes

    // 🔹 Mostrar en el HTML
    document.getElementById("visitas").textContent = visitas.toLocaleString();
    document.getElementById("sesiones").textContent = sesiones.toLocaleString();
    document.getElementById("usuarios").textContent = usuarios.toLocaleString();
    document.getElementById("duracion").textContent = `${duracion} min`;
    document.getElementById("navegadores").textContent = `${navegadores}`;
    document.getElementById("redes").textContent = redes.toLocaleString();

    // 🔹 Crear gráfico de crecimiento mensual (Chart.js)
    const ctx = document.getElementById("graficoCrecimiento").getContext("2d");

    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const datosMensuales = meses.map(() => Math.floor(Math.random() * 9000) + 1000);

    new Chart(ctx, {
        type: "line",
        data: {
        labels: meses,
        datasets: [{
            label: "Visitas mensuales",
            data: datosMensuales,
            borderColor: "#2196F3",
            backgroundColor: "rgba(33, 150, 243, 0.2)",
            fill: true,
            tension: 0.3,
        }]
        },
        options: {
        responsive: true,
        scales: {
            y: {
            beginAtZero: true,
            }
        }
        }
    });
    });


    // === MODAL: Términos y Condiciones ===
const terminosModal = document.getElementById("terminosModal");
const openTerminos = document.getElementById("openTerminos");
const cerrarTerminos = document.getElementById("cerrarTerminos");

// === MODAL: Aviso de Privacidad ===
const privacidadModal = document.getElementById("privacidadModal");
const openPrivacidad = document.getElementById("openPrivacidad");
const cerrarPrivacidad = document.getElementById("cerrarPrivacidad");

// Botones e íconos de cierre
const closeIcons = document.querySelectorAll(".close");

openTerminos.addEventListener("click", (e) => {
  e.preventDefault();
  terminosModal.style.display = "flex";
});

openPrivacidad.addEventListener("click", (e) => {
  e.preventDefault();
  privacidadModal.style.display = "flex";
});

cerrarTerminos.addEventListener("click", () => {
  terminosModal.style.display = "none";
});

cerrarPrivacidad.addEventListener("click", () => {
  privacidadModal.style.display = "none";
});

closeIcons.forEach(icon => {
  icon.addEventListener("click", () => {
    icon.parentElement.parentElement.style.display = "none";
  });
});

window.addEventListener("click", (event) => {
  if (event.target === terminosModal || event.target === privacidadModal) {
    event.target.style.display = "none";
  }
});
