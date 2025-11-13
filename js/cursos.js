// Cargar el JSON y generar tarjetas
fetch('../data/productos.json')
  .then(res => res.json())
  .then(data => {
    console.log("JSON cargado:", data); // <-- prueba
    const container = document.getElementById('cardsContainer');
    data.forEach(product => {
      const card = document.createElement('div');
      card.className = 'card';

      card.innerHTML = `
        <img src="${product.imagen}" alt="${product.nombre}">
        <div class="card-content">
          <h2>${product.nombre}</h2>
          <p>${product.descripcion}</p>
          <p><strong>Categoría:</strong> ${product.categoria} | <strong>Nivel:</strong> ${product.nivel}</p>
          <p><strong>Duración:</strong> ${product.duracion} | <strong>Valoración:</strong> ${product.valoracion} ⭐</p>
          <p><strong>Precio:</strong> $${product.precio} MXN</p>
          <a href="../views/carrito.html" class="btn">Agregar al carrito</a>
        </div>
      `;

      container.appendChild(card);
    });
  })
  .catch(err => console.error('Error al cargar JSON:', err));

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
