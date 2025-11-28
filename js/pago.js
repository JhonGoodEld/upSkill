const metodoSelect = document.getElementById("metodoPago");

const tarjeta = document.getElementById("tarjetaSection");
const paypal = document.getElementById("paypalSection");
const tienda = document.getElementById("tiendaSection");

function ocultarTodo() {
    tarjeta.classList.add("hidden");
    paypal.classList.add("hidden");
    tienda.classList.add("hidden");
}

metodoSelect.addEventListener("change", () => {
    ocultarTodo();
    const metodo = metodoSelect.value;

    if (metodo === "Tarjeta") tarjeta.classList.remove("hidden");
    if (metodo === "PayPal") paypal.classList.remove("hidden");
    if (metodo === "Tienda") tienda.classList.remove("hidden");
});

// Evita que el formulario intente enviarse (mock)
document.getElementById("formPago")?.addEventListener("submit", (e) => {
    e.preventDefault(); // evita validaciones nativas
    window.location.href = "pago-metodo.html"; // continuar al siguiente paso
});
