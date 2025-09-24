document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.register-form');
  const modal = document.getElementById('successModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const promo = document.querySelector('.promo-code');

  if (!form || !modal) {
    console.error('Formulario o modal no encontrados en el DOM.');
    return;
  }

  // Mostrar modal al enviar
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    // Aquí podrías recoger valores si quisieras...
    modal.setAttribute('aria-hidden', 'false');
    // opcional: limpiar el formulario
    // form.reset();
  });

  // Función para cerrar modal (expuesta a window por si tienes onclick inline)
  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
  }
  window.closeModal = closeModal; // si en HTML usas onclick="closeModal()"

  // Botón cerrar
  closeBtn.addEventListener('click', closeModal);

  // Cerrar al hacer clic fuera del contenido
  window.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });

  // Cerrar con Escape
  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });

  // Copiar código promocional al portapapeles al hacer clic
  if (promo && navigator.clipboard) {
    promo.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(promo.textContent.trim());
        // Puedes cambiar esto por un toast; uso alert por simplicidad
        alert('Código copiado: ' + promo.textContent.trim());
      } catch (err) {
        console.error('No se pudo copiar: ', err);
      }
    });
  }
});

