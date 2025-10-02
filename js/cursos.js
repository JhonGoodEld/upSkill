// Cargar el JSON y generar tarjetas
fetch('../data/productos.json')
  .then(res => res.json())
  .then(data => {
    console.log("JSON cargado:", data); // <-- prueba
    const container = document.getElementById('cardsContainer');
    data.forEach(product => {
      const card = document.createElement('div');
      card.className = 'card';

            // Al generar las tarjetas en cursos.js
            card.innerHTML = `
              <img src="${product.imagen}" alt="${product.nombre}">
              <div class="card-content">
                <h2>${product.nombre}</h2>
                <p>${product.descripcion}</p>
                <p><strong>Categoría:</strong> ${product.categoria} | <strong>Nivel:</strong> ${product.nivel}</p>
                <p><strong>Duración:</strong> ${product.duracion} | <strong>Valoración:</strong> ${product.valoracion} ⭐</p>
                <p class="price"><strong>Precio:</strong> $${product.precio} MXN</p>
                <button onclick='agregarAlCarrito(${JSON.stringify(product)})'>Agregar al carrito</button>
              </div>
            `;


      container.appendChild(card);
    });
  })
  .catch(err => console.error('Error al cargar JSON:', err));
function agregarAlCarrito(producto) {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  carrito.push(producto);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  alert(`${producto.nombre} agregado al carrito`);
}

