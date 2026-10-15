document.addEventListener("DOMContentLoaded", () => {
  // ========== Catálogo público desde MySQL ==========
  const container = document.getElementById("cardsContainer");
  const status = document.getElementById("catalogStatus");

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  const publicImageUrl = (path = "") => {
    const v = String(path || "").trim();
    if (!v) return "../src/primer.jpg";
    if (/^https?:\/\//i.test(v) || v.startsWith("data:")) return v;
    const clean = v
      .replace(/^\.\.\/src\//, "")
      .replace(/^src\//, "")
      .replace(/^\.\.\//, "");
    return `../src/${clean}`;
  };

  let catalogRequest = 0;

  async function cargarCatalogo({silencioso = false} = {}) {
    const requestId = ++catalogRequest;
    if (!silencioso && status) {
      status.textContent = "Actualizando cursos...";
      status.classList.remove("error");
    }

    try {
      const res = await fetch(`../api/cursos_publicos.php?_=${Date.now()}`, {
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (_) {
        throw new Error(`El servidor no devolvió JSON. Detalle: ${raw.slice(0, 140)}`);
      }
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (requestId !== catalogRequest) return;

      const cursos = Array.isArray(data.cursos) ? data.cursos : [];
      if (status) {
        status.textContent = cursos.length ? `${cursos.length} cursos disponibles` : "No hay cursos disponibles actualmente.";
        status.classList.remove("error");
      }
      if (!cursos.length) {
        container.innerHTML = '<p class="empty-catalog">No hay cursos disponibles actualmente.</p>';
        return;
      }

      container.innerHTML = cursos.map((product) => {
        const precio = Number(product.precio || 0);
        const descuento = Number(product.descuento || 0);
        const precioFinal = descuento > 0 ? precio * (1 - descuento / 100) : precio;
        return `
          <div class="card" data-id="${Number(product.id)}">
            <img src="${esc(publicImageUrl(product.imagen))}" alt="${esc(product.nombre)}" onerror="this.src='../src/primer.jpg'">
            <div class="card-content">
              <h2>${esc(product.nombre)}</h2>
              <p>${esc(product.descripcion || "")}</p>
              <p><strong>Categoría:</strong> ${esc(product.categoria || "—")} | <strong>Nivel:</strong> ${esc(product.nivel || "—")}</p>
              <p><strong>Duración:</strong> ${esc(product.duracion || "—")} | <strong>Valoración:</strong> ${Number(product.valoracion || 0).toFixed(1)} ⭐</p>
              <p><strong>Disponibilidad:</strong> <span class="catalog-availability ${String(product.disponibilidad || "Disponible").toLowerCase().replace(/\s+/g, "-")}">${esc(product.disponibilidad || "Disponible")}</span></p>
              ${descuento > 0
                ? `<p><strong>Precio:</strong> <s>$${precio.toFixed(2)}</s> <strong>$${precioFinal.toFixed(2)} MXN</strong> (${descuento}% desc.)</p>`
                : `<p><strong>Precio:</strong> $${precio.toFixed(2)} MXN</p>`}
              <a href="../views/carrito.html" class="btn">Agregar al carrito</a>
            </div>
          </div>`;
      }).join("");
    } catch (err) {
      if (requestId !== catalogRequest) return;
      if (status) {
        status.textContent = "No fue posible cargar los cursos desde la base de datos.";
        status.classList.add("error");
      }
      if (!silencioso) {
        container.innerHTML = `<p class="empty-catalog">No fue posible cargar el catálogo: ${esc(err.message)}</p>`;
      }
    }
  }

  cargarCatalogo();

  // Sincronización inmediata entre pestañas del mismo navegador.
  const catalogChannel = ("BroadcastChannel" in window)
    ? new BroadcastChannel("upskill-catalogo-cursos")
    : null;
  catalogChannel?.addEventListener("message", (event) => {
    if (event.data?.type === "catalogo-actualizado") cargarCatalogo({ silencioso: true });
  });

  // Compatibilidad entre pestañas y navegadores que no soporten BroadcastChannel.
  window.addEventListener("storage", (event) => {
    if (event.key === "upskillCatalogoCursosUpdated") cargarCatalogo({ silencioso: true });
  });

  // Respaldo para cambios hechos desde otro dispositivo/sesión: refresco periódico.
  const catalogPoll = setInterval(() => cargarCatalogo({ silencioso: true }), 5000);
  window.addEventListener("beforeunload", () => clearInterval(catalogPoll));

  // ========== MODALES ==========
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
