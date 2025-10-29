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
