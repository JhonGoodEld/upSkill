document.addEventListener("DOMContentLoaded", () => {
  const carritoContainer = document.getElementById("carrito");
  const subtotalSpan = document.getElementById("subtotal");
  const ivaSpan = document.getElementById("iva");
  const totalSpan = document.getElementById("total");
  const btnPagar = document.getElementById("btnPagar");
  const modal = document.getElementById("modal");
  const btnConfirmar = document.getElementById("btnConfirmar");
  const btnCancelar = document.getElementById("btnCancelar");

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

      carritoContainer.innerHTML = ""; // limpiar contenedor

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

      // Calcular totales
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

  // === Modal ===
  btnPagar.addEventListener("click", () => {
    modal.style.display = "flex";
  });

  btnCancelar.addEventListener("click", () => {
    modal.style.display = "none";
  });

    btnConfirmar.addEventListener("click", () => {
    const correo = document.getElementById("correo").value.trim() || "No especificado";

    alert(`Datos de facturación enviados a: ${correo}`);
    modal.style.display = "none";
  });


  // === Modal Políticas ===
const modalPoliticas = document.getElementById("politicasModal");
const openPoliticas = document.getElementById("openPoliticas");
const cerrarPoliticas = document.getElementById("cerrarPoliticas");
// Este close es el de la X dentro del modal
const closeIconPoliticas = modalPoliticas ? modalPoliticas.querySelector(".close") : null;

if (openPoliticas && modalPoliticas) {
  openPoliticas.addEventListener("click", (e) => {
    e.preventDefault();
    modalPoliticas.style.display = "block";
  });
}

if (cerrarPoliticas && modalPoliticas) {
  cerrarPoliticas.addEventListener("click", () => {
    modalPoliticas.style.display = "none";
  });
}

if (closeIconPoliticas && modalPoliticas) {
  closeIconPoliticas.addEventListener("click", () => {
    modalPoliticas.style.display = "none";
  });
}

window.addEventListener("click", (event) => {
  if (event.target === modalPoliticas) {
    modalPoliticas.style.display = "none";
  }
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


});

