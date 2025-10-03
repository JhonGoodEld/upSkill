// Contenedor
const carritoContainer = document.getElementById("carrito");

// Función: seleccionar 3 productos distintos al azar
function obtenerProductosAleatorios(lista) {
  let copia = [...lista];
  let seleccionados = [];
  for (let i = 0; i < 3; i++) {
    let index = Math.floor(Math.random() * copia.length);
    seleccionados.push(copia[index]);
    copia.splice(index, 1); // evita repetir
  }
  return seleccionados;
}

fetch('../data/productos.json')
  .then(res => res.json())
  .then(data => {
    console.log("JSON cargado:", data);

    
    const seleccionados = obtenerProductosAleatorios(data);

    seleccionados.forEach(product => {
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
          <button>50% off</button> 
        </div>
      `;

      carritoContainer.appendChild(card);
    });
  })
  .catch(err => console.error("Error al cargar productos:", err));

