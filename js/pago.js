document.addEventListener("DOMContentLoaded", () => {

    const metodoPago = document.getElementById("metodoPago");
    const formPago = document.getElementById("formPago");

const tarjeta = document.getElementById("tarjetaSection");
const paypal = document.getElementById("paypalSection");
const tienda = document.getElementById("tiendaSection");
const monedero = document.getElementById("monederoSection");
    const cheque = document.getElementById("chequeSection");
    const transferencia = document.getElementById("transferenciaSection");

    const todasLasSecciones = [
        tarjeta,
        paypal,
        tienda,
        monedero,
        cheque,
        transferencia
    ];

     function ocultarTodo() {
        todasLasSecciones.forEach(sec => sec.classList.add("hidden"));
    }

     metodoSelect.addEventListener("change", () => {
        const metodo = metodoSelect.value;
        ocultarTodo();

        if (metodo === "Tarjeta") tarjeta.classList.remove("hidden");
        if (metodo === "PayPal") paypal.classList.remove("hidden");
        if (metodo === "Tienda") tienda.classList.remove("hidden");
        if (metodo === "Monedero") monedero.classList.remove("hidden");
        if (metodo === "Cheque") cheque.classList.remove("hidden");
        if (metodo === "Transferencia") transferencia.classList.remove("hidden");
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