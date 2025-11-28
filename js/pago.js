const metodoSelect = document.getElementById("metodoPago");

const tarjeta = document.getElementById("tarjetaSection");
const paypal = document.getElementById("paypalSection");
const tienda = document.getElementById("tiendaSection");

metodoSelect.addEventListener("change", () => {
    const metodo = metodoSelect.value;

    // Ocultar todos
    tarjeta.classList.add("hidden");
    paypal.classList.add("hidden");
    tienda.classList.add("hidden");

    // Mostrar según selección
    if (metodo === "Tarjeta") tarjeta.classList.remove("hidden");
    if (metodo === "PayPal") paypal.classList.remove("hidden");
    if (metodo === "Tienda") tienda.classList.remove("hidden");
});
