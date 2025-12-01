document.addEventListener("DOMContentLoaded", () => {

    const metodoPago = document.getElementById("metodoPago");
    const formPago = document.getElementById("formPago");

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
// Modificar la URL para enviar el método correctamente
    formPago.addEventListener("submit", (e) => {
        const metodo = metodoPago.value.trim();

        // Si no seleccionó método, evitar errores
        if (!metodo) {
            alert("Por favor selecciona un método de pago");
            e.preventDefault();
            return;
        }

        // Reemplaza el action dinámicamente
        formPago.action = "pago-metodo.html?metodo=" + encodeURIComponent(metodo);
    });

});