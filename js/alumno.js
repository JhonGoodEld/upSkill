document.addEventListener("DOMContentLoaded", () => {
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[c]));
  const resolveCourseImage = value => {
    const raw = String(value || "").trim();
    if (/^https?:\/\//i.test(raw)) return raw;
    const clean = raw.replace(/^\.\.\/src\//, "").replace(/^src\//, "").replace(/^\.\.\//, "");
    return `../src/${clean || "primer.jpg"}`;
  };
  // ========== Mis cursos adquiridos desde ERP/SCM ==========
  fetch("../api/tienda_mis_cursos.php", { credentials: "same-origin", cache: "no-store" })
    .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "No fue posible consultar tus cursos."); return data.cursos || []; })
    .then(cursos => {
      const cursosContainer = document.querySelector("#cursosContainer");
      if (!cursosContainer) return;
      cursosContainer.innerHTML = "";
      cursos.forEach(curso => {
        const card = document.createElement("div");
        card.classList.add("curso-card");
        const image = resolveCourseImage(curso.imagen);
        card.innerHTML = `
          <img src="${escapeHtml(image)}" alt="${escapeHtml(curso.nombre)}">
          <h3>${escapeHtml(curso.nombre)}</h3>
          <p><strong>Duración:</strong> ${escapeHtml(curso.duracion || "No especificada")}</p>
          <p><strong>Licencias adquiridas:</strong> ${Number(curso.licencias || 0)}</p>
          <p><strong>Última compra:</strong> ${escapeHtml(new Date(String(curso.ultima_compra).replace(" ", "T")).toLocaleDateString())}</p>
          <a href="cursos.html">Ver catálogo</a>
        `;
        cursosContainer.appendChild(card);
      });
      if (cursos.length === 0) cursosContainer.innerHTML = '<p>Aún no has adquirido cursos. <a href="cursos.html">Explora el catálogo</a> para comenzar.</p>';
      else generarTareas(cursos);
    })
    .catch(err => {
      console.error("Error al cargar cursos adquiridos:", err);
      const cont = document.querySelector("#cursosContainer");
      if (cont) cont.innerHTML = "<p>No fue posible cargar tus cursos en este momento.</p>";
    });

  // ========== Tareas Pendientes ==========
  function generarTareas(cursos) {
    const listaTareas = document.querySelector("#listaTareas");
    if (!listaTareas || !cursos.length) return;
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
        <h4>${escapeHtml(nombreTarea)} — <em>${escapeHtml(curso.nombre)}</em></h4>
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
  if (!mensajesContainer) return;
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




