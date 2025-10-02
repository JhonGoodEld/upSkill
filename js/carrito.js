document.addEventListener("DOMContentLoaded", () => {
  // Recuperar carrito del localStorage
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const tbody = document.querySelector("#tablaCarrito tbody");
  const totalElement = document.getElementById("total");

  // Función para renderizar la tabla del carrito
  function renderCarrito() {
    tbody.innerHTML = "";
    let total = 0;

    carrito.forEach((item, index) => {
      total += item.precio;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.nombre}</td>
        <td>${item.categoria}</td>
        <td>$${item.precio} MXN</td>
        <td><button class="btn-eliminar" data-index="${index}">Eliminar</button></td>
      `;
      tbody.appendChild(row);
    });

    totalElement.textContent = `Total: $${total} MXN`;

    // Agregar event listener a los botones "Eliminar"
    document.querySelectorAll(".btn-eliminar").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = e.target.getAttribute("data-index");
        eliminarDelCarrito(idx);
      });
    });
  }

  // Función para eliminar un curso del carrito
  function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderCarrito();
  }

  // Inicializar render
  renderCarrito();
});
