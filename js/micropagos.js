document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================
       SELECCIÓN DE MONTOS
    ========================================== */
    const montoBtns = document.querySelectorAll(".monto-btn");
    const montoInput = document.getElementById("montoPersonalizado");

    montoBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            montoInput.value = btn.dataset.value;
        });
    });


    /* ==========================================
       MODAL POLÍTICAS
    ========================================== */
    const modal = document.getElementById("politicasModal");
    const openPoliticas = document.getElementById("openPoliticas");
    const closePoliticas = document.getElementById("cerrarPoliticas");
    const spanClose = modal.querySelector(".close");

    openPoliticas.addEventListener("click", (e) => {
        e.preventDefault();
        modal.style.display = "flex";
    });

    closePoliticas.addEventListener("click", () => {
        modal.style.display = "none";
    });

    spanClose.addEventListener("click", () => {
        modal.style.display = "none";
    });


    /* ==========================================
       DESPLIEGUE DE MÉTODOS DE PAGO
    ========================================== */
    const metodoPago = document.getElementById("metodoPago");

    const secciones = {
        "Tarjeta": document.getElementById("tarjetaSection"),
        "PayPal": document.getElementById("paypalSection"),
        "Tienda": document.getElementById("tiendaSection"),
        "Monedero": document.getElementById("monederoSection"),
        "Cheque": document.getElementById("chequeSection"),
        "Transferencia": document.getElementById("transferenciaSection")
    };

    function ocultarTodo() {
        Object.values(secciones).forEach(sec => sec.classList.add("hidden"));
    }

    metodoPago.addEventListener("change", () => {
        ocultarTodo();
        const metodo = metodoPago.value;
        if (secciones[metodo]) {
            secciones[metodo].classList.remove("hidden");
        }
    });


    /* ==========================================
       PROCESO DE DONACIÓN
    ========================================== */
    const btnDonar = document.getElementById("btnDonar");

    btnDonar.addEventListener("click", (e) => {
        e.preventDefault();

        const monto = parseFloat(montoInput.value);
        const metodo = metodoPago.value;

        if (!monto || monto <= 0) {
            alert("Ingresa un monto válido.");
            return;
        }

        if (!metodo) {
            alert("Selecciona un método de pago.");
            return;
        }

        // 50/50 éxito / error
        const exito = Math.random() < 0.5;

        if (exito) {
            window.location.href = `confirmacion.html?monto=${monto}&metodo=${metodo}`;
        } else {
            window.location.href = `error-pago.html?metodo=${metodo}`;
        }
    });

});

