document.addEventListener("DOMContentLoaded", () => {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const tbody = document.querySelector("#tablaCarrito tbody");
  const totalElement = document.getElementById("total");

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
        <td><button onclick="eliminarDelCarrito(${index})">Eliminar</button></td>
      `;
      tbody.appendChild(row);
    });

    totalElement.textContent = `Total: $${total} MXN`;
  }

  window.eliminarDelCarrito = (index) => {
    carrito.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderCarrito();
  };

  renderCarrito();
});
