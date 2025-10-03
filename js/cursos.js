document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("cardsContainer");

  // Cargar el JSON de cursos
  fetch("../data/productos.json") // <- ajustamos la ruta
    .then(res => res.json())
    .then(data => {
      data.forEach(curso => {
        const card = document.createElement("div");
        card.classList.add("card");

        // Asegúrate que las imágenes estén en "src" dentro del repo
        card.innerHTML = `
          <img src="/src/${curso.imagen.split('/').pop()}" alt="${curso.nombre}">
          <h2>${curso.nombre}</h2>
          <p>${curso.descripcion}</p>
          <p><strong>Categoría:</strong> ${curso.categoria}</p>
          <p><strong>Precio:</strong> $${curso.precio} MXN</p>
          <button class="btn-agregar">Agregar al carrito</button>
        `;

        // Botón "Agregar al carrito"
        card.querySelector(".btn-agregar").addEventListener("click", () => {
          agregarAlCarrito(curso);
        });

        container.appendChild(card);
      });
    })
    .catch(err => console.error("Error al cargar productos:", err));

  // Función para guardar en localStorage
  function agregarAlCarrito(curso) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    carrito.push({
      nombre: curso.nombre,
      categoria: curso.categoria,
      precio: curso.precio
    });

    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert(`"${curso.nombre}" agregado al carrito ✅`);
  }
});
