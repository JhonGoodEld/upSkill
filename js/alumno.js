document.addEventListener("DOMContentLoaded", () => {
  // ========== Cargar cursos al azar ==========
  fetch("../data/productos.json")
    .then((res) => res.json())
    .then((data) => {
      const cursosContainer = document.querySelector("#cursosContainer");
      const cursosAleatorios = data.sort(() => 0.5 - Math.random()).slice(0, 4);

      cursosAleatorios.forEach((curso) => {
        const card = document.createElement("div");
        card.classList.add("curso-card");
        card.innerHTML = `
          <img src="${curso.imagen}" alt="${curso.nombre}">
          <h3>${curso.nombre}</h3>
          <p><strong>Duración:</strong> ${curso.duracion}</p>
          <p><strong>Precio:</strong> $${curso.precio} MXN</p>
          <div class="progreso-container">
            <div class="progreso-barra" style="width: ${Math.floor(Math.random() * 100)}%;"></div>
          </div>
          <p class="porcentaje">${Math.floor(Math.random() * 100)}% completado</p>
        `;
        cursosContainer.appendChild(card);
      });

      generarTareas(cursosAleatorios);
    })
    .catch((err) => console.error("Error al cargar los cursos:", err));

  // ========== Tareas Pendientes ==========
  function generarTareas(cursos) {
    const listaTareas = document.querySelector("#listaTareas");
    const estados = ["pendiente", "entregada", "vencida"];
    const ejemplos = [
      "Investigación sobre fundamentos",
      "Ejercicio práctico",
      "Desarrollo de proyecto",
      "Examen parcial",
      "Cuestionario",
      "Entrega final",
    ];

    for (let i = 0; i < 6; i++) {
      const curso = cursos[Math.floor(Math.random() * cursos.length)];
      const tarea = document.createElement("li");
      const estado = estados[Math.floor(Math.random() * estados.length)];
      const nombreTarea = ejemplos[i % ejemplos.length];

      tarea.classList.add("tarea", estado);
      tarea.innerHTML = `
        <h4>${nombreTarea} — <em>${curso.nombre}</em></h4>
        <p>Estado: <strong>${estado.toUpperCase()}</strong></p>
      `;
      listaTareas.appendChild(tarea);
    }
  }

  // ========== Centro de Mensajes ==========
  const mensajes = [
    {
      remitente: "Prof. Laura Martínez",
      mensaje: "Recuerden subir el proyecto antes del viernes.",
      hora: "Hoy, 09:12 a.m.",
    },
    {
      remitente: "Carlos López (compañero)",
      mensaje: "¿Ya terminaste la tarea del módulo 2?",
      hora: "Ayer, 8:45 p.m.",
    },
    {
      remitente: "Ana Rivera (compañera)",
      mensaje: "Podríamos formar equipo para el trabajo final 😄",
      hora: "Ayer, 6:20 p.m.",
    },
  ];

  const mensajesContainer = document.querySelector("#mensajesContainer");
  mensajes.forEach((msg) => {
    const div = document.createElement("div");
    div.classList.add("mensaje");
    div.innerHTML = `
      <strong>${msg.remitente}</strong>
      <p>${msg.mensaje}</p>
      <small>${msg.hora}</small>
    `;
    mensajesContainer.appendChild(div);
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

  if (openTerminos && terminosModal) {
    openTerminos.addEventListener("click", (e) => {
      e.preventDefault();
      terminosModal.style.display = "flex";
    });
  }

  if (openPrivacidad && privacidadModal) {
    openPrivacidad.addEventListener("click", (e) => {
      e.preventDefault();
      privacidadModal.style.display = "flex";
    });
  }

  if (cerrarTerminos) {
    cerrarTerminos.addEventListener("click", () => {
      terminosModal.style.display = "none";
    });
  }

  if (cerrarPrivacidad) {
    cerrarPrivacidad.addEventListener("click", () => {
      privacidadModal.style.display = "none";
    });
  }

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




