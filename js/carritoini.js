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

    fetch("../data/productos.json")
        .then(res => res.json())
        .then(data => {
        const seleccionados = obtenerProductosAleatorios(data);
        let subtotal = 0;

        carritoContainer.innerHTML = ""; // limpiar contenedor

        seleccionados.forEach(product => {
            subtotal += product.precio;

            const card = document.createElement("div");
            card.className = "card";

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
        })
        .catch(err => console.error("Error al cargar productos:", err));

    // === Redirección del botón "Realizar pago" ===
    btnPagar.addEventListener("click", () => {
        window.location.href = "../views/registro.html";
    });

    // === Botones del modal (solo en caso de que aún lo uses en otro contexto) ===
    btnCancelar.addEventListener("click", () => {
        modal.style.display = "none";
    });

    btnConfirmar.addEventListener("click", () => {
        const correo = document.getElementById("correo").value.trim() || "No especificado";
        alert(`Datos de facturación enviados a: ${correo}`);
        modal.style.display = "none";
    });
    });

    // === Modal Políticas ===
    const modalPoliticas = document.getElementById("politicasModal");
    const openPoliticas = document.getElementById("openPoliticas");
    const closePoliticas = document.getElementById("cerrarPoliticas");
    const spanClose = document.querySelector(".close");

    openPoliticas.addEventListener("click", (e) => {
    e.preventDefault();
    modalPoliticas.style.display = "flex";
    });

    closePoliticas.addEventListener("click", () => {
    modalPoliticas.style.display = "none";
    });

    spanClose.addEventListener("click", () => {
    modalPoliticas.style.display = "none";
    });

    window.addEventListener("click", (event) => {
    if (event.target === modalPoliticas) {
        modalPoliticas.style.display = "none";
    }
    });
