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


// Abrir/cerrar menú hamburguesa tipo acordeón
document.querySelectorAll(".menu-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    const container = btn.parentElement;
    // cerrar otros menús
    document.querySelectorAll(".menu-container").forEach(c => {
      if (c !== container) c.classList.remove("open");
    });
    container.classList.toggle("open");
    e.stopPropagation();
  });
});

// Cerrar menú al hacer clic fuera
window.addEventListener("click", () => {
  document.querySelectorAll(".menu-container").forEach(c => c.classList.remove("open"));
});

// === Configuración: Tema ===
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
}

// === Configuración: Idioma ===
function toggleLanguage() {
  const elements = {
    "Upskill Academy": "Upskill Academy",
    "Inicio": "Home",
    "Catálogo": "Catalog",
    "Cursos": "Courses",
    "Planes de carrera": "Career Paths",
    "Certificate": "Certificate",
    "Carrito": "Cart",
    "Usuarios": "Users",
    "Alumnos": "Students",
    "Docentes": "Teachers",
    "Configuración": "Settings",
    "Tema": "Theme",
    "Idioma": "Language",
    "Documentos": "Documents",
    "Tecnología propuesta": "Proposed Technology",
    "Login": "Login"
  };

  document.querySelectorAll("a, button, h1").forEach(el => {
    if (elements[el.innerText]) el.innerText = elements[el.innerText];
  });
}


// Mostrar el modal al cargar la página si no hay elección previa
window.addEventListener('load', () => {
  const userChoice = localStorage.getItem('cookieChoice');
  if (!userChoice) {
    document.getElementById('cookieModal').style.display = 'flex';
  }
});

function closeModal(choice) {
  localStorage.setItem('cookieChoice', choice);
  document.getElementById('cookieModal').style.display = 'none';
}

// Botones
document.getElementById('acceptAll').addEventListener('click', () => closeModal('accepted'));
document.getElementById('rejectAll').addEventListener('click', () => closeModal('rejected'));
document.getElementById('onlyNecessary').addEventListener('click', () => closeModal('necessary'));
