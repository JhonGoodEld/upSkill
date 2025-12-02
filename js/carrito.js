document.addEventListener("DOMContentLoaded", () => {

  /* ==========================================================
      SECCIÓN 1: CARRITO (solo se activa si existe en la página)
  ========================================================== */
  const carritoContainer = document.getElementById("carrito");
  const subtotalSpan = document.getElementById("subtotal");
  const ivaSpan = document.getElementById("iva");
  const totalSpan = document.getElementById("total");
  const btnPagar = document.getElementById("btnPagar");
  const modal = document.getElementById("modal");
  const btnConfirmar = document.getElementById("btnConfirmar");
  const btnCancelar = document.getElementById("btnCancelar");

  if (carritoContainer) {
      function obtenerProductosAleatorios(lista) {
        let copia = [...lista];
        let seleccionados = [];
        for (let i = 0; i < 3; i++) {
          let index = Math.floor(Math.random() * copia.length);
          seleccionados.push(copia[index]);
          copia.splice(index, 1);
        }
        return seleccionados;
      }

      fetch('../data/productos.json')
        .then(res => res.json())
        .then(data => {
          const seleccionados = obtenerProductosAleatorios(data);
          let subtotal = 0;

          carritoContainer.innerHTML = ""; 

          seleccionados.forEach(product => {
            subtotal += product.precio;

            const card = document.createElement('div');
            card.className = 'card';

            card.innerHTML = `
              <img src="${product.imagen}" alt="${product.nombre}">
              <div class="card-content">
                <h2>${product.nombre}</h2>
                <p>${product.descripcion}</p>
                <p><strong>Categoría:</strong> ${product.categoria}</p>
                <p><strong>Nivel:</strong> ${product.nivel}</p>
                <p><strong>Precio:</strong> $${product.precio} MXN</p>
                <button>50% off</button> 
              </div>
            `;

            carritoContainer.appendChild(card);
          });

          const iva = subtotal * 0.16;
          const total = subtotal + iva;

          subtotalSpan.textContent = `$${subtotal.toFixed(2)} MXN`;
          ivaSpan.textContent = `$${iva.toFixed(2)} MXN`;
          totalSpan.textContent = `$${total.toFixed(2)} MXN`;

          localStorage.setItem("carritoProductos", JSON.stringify(seleccionados));
          localStorage.setItem("subtotal", subtotal);
          localStorage.setItem("iva", subtotal * 0.16);
          localStorage.setItem("total", subtotal * 1.16);
        })
        .catch(err => console.error("Error al cargar productos:", err));

      // === MODAL DEL CARRITO ===
      if (btnPagar) {
        btnPagar.addEventListener("click", () => modal.style.display = "flex");
      }
      if (btnCancelar) {
        btnCancelar.addEventListener("click", () => modal.style.display = "none");
      }
      if (btnConfirmar) {
        btnConfirmar.addEventListener("click", () => {
          const correo = document.getElementById("correo").value.trim() || "No especificado";
          alert(`Datos de facturación enviados a: ${correo}`);
          modal.style.display = "none";
        });
      }
  }

  /* ==========================================================
     SECCIÓN 2: MODAL POLÍTICAS (funciona en TODAS las páginas)
  ========================================================== */
  const modalPoliticas = document.getElementById("politicasModal");
  const openPoliticas = document.getElementById("openPoliticas");
  const cerrarPoliticas = document.getElementById("cerrarPoliticas");
  const closeIconPoliticas = modalPoliticas ? modalPoliticas.querySelector(".close") : null;

  if (openPoliticas && modalPoliticas) {
    openPoliticas.addEventListener("click", (e) => {
      e.preventDefault();
      modalPoliticas.style.display = "flex";
    });
  }

  if (cerrarPoliticas) {
    cerrarPoliticas.addEventListener("click", () => {
      modalPoliticas.style.display = "none";
    });
  }

  if (closeIconPoliticas) {
    closeIconPoliticas.addEventListener("click", () => {
      modalPoliticas.style.display = "none";
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target === modalPoliticas) {
      modalPoliticas.style.display = "none";
    }
  });

});
