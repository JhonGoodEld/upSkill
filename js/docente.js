    document.addEventListener("DOMContentLoaded", () => {
    // ===============================
    // 🎓 Panel Docente - Lógica principal
    // ===============================

    fetch("../../../database/productos.json")
        .then((res) => res.json())
        .then((data) => {
        // === CURSOS ADMINISTRADOS ===
        const cursosContainer = document.getElementById("cursosDocente");
        const cursosAleatorios = obtenerCursosAleatorios(data, 2);
        if (cursosAleatorios.length < 2) throw new Error("No hay suficientes cursos disponibles para el panel docente");

        cursosAleatorios.forEach((curso) => {
            const card = document.createElement("div");
            card.className = "card-docente";
            card.innerHTML = `
            <img src="${curso.imagen}" alt="${curso.nombre}">
            <div class="card-info">
                <h3>${curso.nombre}</h3>
                <p><strong>Categoría:</strong> ${curso.categoria}</p>
                <p><strong>Nivel:</strong> ${curso.nivel}</p>
            </div>
            <div class="progreso-container">
                <div class="progreso-barra" style="width: ${Math.floor(Math.random() * 100)}%;"></div>
            </div>
            <p class="porcentaje">${Math.floor(Math.random() * 100)}% completado</p>
            `;
            cursosContainer?.appendChild(card);
        });

        // === TAREAS POR REVISAR ===
        const tareasList = document.getElementById("tareasPorRevisar");
        const tareasEjemplo = generarTareas(cursosAleatorios, 6);
        tareasEjemplo.forEach((t) => {
            const li = document.createElement("li");
            li.innerHTML = `
            <span><strong>${t.alumno}</strong> "${t.tarea}" (${t.curso})</span>
            <span class="estado ${t.estado.toLowerCase()}">${t.estado}</span>
            `;
            tareasList?.appendChild(li);
        });

        // === ASIGNACIONES ===
        const asignacionesContainer = document.getElementById("asignaciones");
        const alumnosFicticios = ["Ana López", "Luis Hernández", "María Torres", "Carlos Ruiz", "Sofía Díaz"];
        const asignaciones = [
            { tipo: "Tarea", nombre: "Práctica sobre " + cursosAleatorios[0].nombre },
            { tipo: "Examen", nombre: "Evaluación final de " + cursosAleatorios[1].nombre },
        ];

        asignaciones.forEach((a) => {
            const div = document.createElement("div");
            div.className = "asignacion-item";
            div.innerHTML = `
            <h4>${a.tipo}: ${a.nombre}</h4>
            <div class="radios">
                ${alumnosFicticios
                .map(
                    (al) => `
                <label><input type="radio" name="${a.nombre}" value="${al}"> ${al}</label>
                `
                )
                .join("")}
            </div>
            <button class="btn-asignar">Asignar</button>
            `;
            asignacionesContainer?.appendChild(div);
        });

        // === MENSAJES ===
        const mensajesContainer = document.getElementById("mensajesDocente");
        const mensajes = [
            { emisor: "Tú", receptor: "Ana López", texto: "Revisa el formato del proyecto, por favor." },
            { emisor: "Tú", receptor: "Luis Hernández", texto: "La entrega fue recibida correctamente, buen trabajo." },
            { emisor: "María Torres", receptor: "Tú", texto: "Profe, ¿me da permiso de subir más tarde el proyecto?" },
        ];

        mensajes.forEach((m) => {
            const msg = document.createElement("div");
            msg.className = "mensaje";
            msg.innerHTML = `
            <p><strong>${m.emisor}</strong> → ${m.receptor}</p>
            <p>${m.texto}</p>
            `;
            mensajesContainer?.appendChild(msg);
        });
        })
        .catch((err) => {
        console.error("Error al cargar productos:", err);
        const ids = ["cursosDocente", "tareasPorRevisar", "asignaciones", "mensajesDocente"];
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = "<p>No fue posible cargar esta sección en este momento.</p>";
        });
    });

    // === Funciones auxiliares ===
    function obtenerCursosAleatorios(lista, cantidad) {
        const copia = Array.isArray(lista) ? [...lista] : [];
        const seleccionados = [];
        for (let i = 0; i < cantidad; i++) {
        const index = Math.floor(Math.random() * copia.length);
        seleccionados.push(copia.splice(index, 1)[0]);
        }
        return seleccionados;
    }

    function generarTareas(cursos, cantidad) {
        const estados = ["Pendiente", "Entregado", "Fuera de tiempo"];
        const alumnos = ["Ana López", "Luis Hernández", "María Torres", "Carlos Ruiz", "Sofía Díaz", "Pedro Gómez"];
        const tareas = [];

        for (let i = 0; i < cantidad; i++) {
        const curso = cursos[Math.floor(Math.random() * cursos.length)].nombre;
        const alumno = alumnos[Math.floor(Math.random() * alumnos.length)];
        const tarea = `Actividad ${i + 1}`;
        const estado = estados[Math.floor(Math.random() * estados.length)];
        tareas.push({ curso, alumno, tarea, estado });
        }

        return tareas;
    }

    // === MODALES ===
    const terminosModal = document.getElementById("terminosModal");
    const openTerminos = document.getElementById("openTerminos");
    const cerrarTerminos = document.getElementById("cerrarTerminos");

    const privacidadModal = document.getElementById("privacidadModal");
    const openPrivacidad = document.getElementById("openPrivacidad");
    const cerrarPrivacidad = document.getElementById("cerrarPrivacidad");

    const closeIcons = document.querySelectorAll(".close");

    openTerminos?.addEventListener("click", (e) => {
        e.preventDefault();
        terminosModal.style.display = "flex";
    });

    openPrivacidad?.addEventListener("click", (e) => {
        e.preventDefault();
        privacidadModal.style.display = "flex";
    });

    cerrarTerminos?.addEventListener("click", () => {
        terminosModal.style.display = "none";
    });

    cerrarPrivacidad?.addEventListener("click", () => {
        privacidadModal.style.display = "none";
    });

    closeIcons.forEach((icon) => {
        icon.addEventListener("click", () => {
        icon.parentElement.parentElement.style.display = "none";
        });
    });

    window.addEventListener("click", (event) => {
        if (event.target === terminosModal || event.target === privacidadModal) {
        event.target.style.display = "none";
        }
    });
    });
