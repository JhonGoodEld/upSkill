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

    // Mostrar la sección según el método de pago seleccionado
    metodoPago.addEventListener("change", () => {
        const metodo = metodoPago.value;
        ocultarTodo();

        if (metodo === "Tarjeta") tarjeta.classList.remove("hidden");
        if (metodo === "PayPal") paypal.classList.remove("hidden");
        if (metodo === "Tienda") tienda.classList.remove("hidden");
        if (metodo === "Monedero") monedero.classList.remove("hidden");
        if (metodo === "Cheque") cheque.classList.remove("hidden");
        if (metodo === "Transferencia") transferencia.classList.remove("hidden");
    });

    // ✅ AJUSTE: Enviar método de pago por URL a pago-metodo.html
    formPago.addEventListener("submit", (e) => {
        e.preventDefault(); // evitamos el envío automático del form

        const metodo = metodoPago.value.trim();

        if (!metodo) {
            alert("Por favor selecciona un método de pago");
            return;
        }

        // 🔥 Redirigimos manualmente con el método seleccionado
        window.location.href = "pago-metodo.html?metodo=" + encodeURIComponent(metodo);
    });

    // ====== BOTÓN DE SIMULAR ERROR (opcional) ======
    const btnError = document.getElementById("btnErrorPago");
    if (btnError) {
        btnError.addEventListener("click", () => {
            const metodo = metodoPago.value.trim();

            if (!metodo) {
                alert("Selecciona un método de pago antes de simular un error.");
                return;
            }

            window.location.href = "error-pago.html?metodo=" + encodeURIComponent(metodo);
        });
    }

});

