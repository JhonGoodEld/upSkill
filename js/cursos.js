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
          <button>Agregar al carrito</button>
        </div>
      `;

      container.appendChild(card);
    });
  })
  .catch(err => console.error('Error al cargar JSON:', err));

