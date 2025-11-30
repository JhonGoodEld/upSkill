// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
const metodo = params.get("metodo"); // SOLO el método

// Elementos del DOM
const metodoElegido = document.getElementById("metodoElegido");
const listaProductos = document.getElementById("listaProductos");
const subResumen = document.getElementById("subResumen");
const ivaResumen = document.getElementById("ivaResumen");
const totalResumen = document.getElementById("totalResumen");
const contenidoMetodo = document.getElementById("contenidoMetodo");

// Colocar método
metodoElegido.textContent = metodo ? metodo : "No seleccionado";

// Recuperar productos
const productos = JSON.parse(localStorage.getItem("carritoProductos")) || [];
const subtotal = parseFloat(localStorage.getItem("subtotal")) || 0;
const iva = parseFloat(localStorage.getItem("iva")) || 0;
const total = parseFloat(localStorage.getItem("total")) || 0;

// Mostrar productos
productos.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.nombre} — $${p.precio} MXN`;
    listaProductos.appendChild(li);
});

// Resumen numérico
subResumen.textContent = `$${subtotal.toFixed(2)} MXN`;
ivaResumen.textContent = `$${iva.toFixed(2)} MXN`;
totalResumen.textContent = `$${total.toFixed(2)} MXN`;

// ====== GENERACIÓN DINÁMICA SEGÚN MÉTODO ======

function generarDetalles() {
    let html = "";

    if (metodo === "Tarjeta") {
        const ultimos = Math.floor(1000 + Math.random() * 9000);
        const auth = "AUTH-" + Math.floor(100000 + Math.random() * 900000);

        html = `
            <p><strong>Banco:</strong> ${["BBVA","Banorte","HSBC","Santander"][Math.floor(Math.random()*4)]}</p>
            <p><strong>Tarjeta:</strong> •••• ${ultimos}</p>
            <p><strong>Autorización:</strong> ${auth}</p>
            <p><strong>Cobro estimado:</strong> $${total.toFixed(2)} MXN</p>
        `;
    }

    if (metodo === "PayPal") {
        const tx = "PAY-" + Math.floor(Math.random()*9000000);

        html = `
            <p><strong>ID de Transacción:</strong> ${tx}</p>
            <p><strong>Cuenta:</strong> usuario@example.com</p>
            <p><strong>Estado:</strong> Aprobado (simulado)</p>
            <p><strong>Total:</strong> $${total.toFixed(2)} MXN</p>
        `;
    }

    if (metodo === "Tienda") {
        const ref = "OXXO-" + Math.floor(100000 + Math.random() * 900000);
        let fecha = new Date();
        fecha.setDate(fecha.getDate() + 2);

        html = `
            <p><strong>CLABE:</strong> 0021 8000 1234 5678 90</p>
            <p><strong>Referencia:</strong> ${ref}</p>
            <p><strong>Fecha límite:</strong> ${fecha.toLocaleDateString()}</p>
            <p><strong>Monto:</strong> $${total.toFixed(2)} MXN</p>
        `;
    }

    if (!metodo) {
        html = "<p>No se seleccionó ningún método</p>";
    }

    contenidoMetodo.innerHTML = html;
}

generarDetalles();

// ===== BOTÓN CONFIRMAR PAGO =====
document.getElementById("btnConfirmarPago").addEventListener("click", () => {
    window.location.href = "confirmacion.html?metodo=" + metodo;
});
