document.addEventListener('DOMContentLoaded', () => {
  // ===== FORMULARIO DE REGISTRO =====
  const form = document.querySelector('.register-form');
  const modal = document.getElementById('successModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const promo = document.querySelector('.promo-code');

  if (form && modal) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      modal.setAttribute('aria-hidden', 'false');
      // form.reset();
    });

    const closeSuccessModal = () => modal.setAttribute('aria-hidden', 'true');
    window.closeSuccessModal = closeSuccessModal; // para onclick="closeSuccessModal()"
    if (closeBtn) closeBtn.addEventListener('click', closeSuccessModal);

    window.addEventListener('click', e => {
      if (e.target === modal) closeSuccessModal();
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSuccessModal();
    });
  } else {
    console.warn('⚠️ Formulario o modal de éxito no encontrados.');
  }

  // ===== COPIAR CÓDIGO PROMOCIONAL =====
  if (promo && navigator.clipboard) {
    promo.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(promo.textContent.trim());
        alert('Código copiado: ' + promo.textContent.trim());
      } catch (err) {
        console.error('No se pudo copiar: ', err);
      }
    });
  }

  // ===== MENÚ HAMBURGUESA =====
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const container = btn.parentElement;
      document.querySelectorAll('.menu-container').forEach(c => {
        if (c !== container) c.classList.remove('open');
      });
      container.classList.toggle('open');
      e.stopPropagation();
    });
  });

  window.addEventListener('click', () => {
    document.querySelectorAll('.menu-container').forEach(c => c.classList.remove('open'));
  });

  // ===== CONFIGURACIÓN DE TEMA =====
  window.toggleTheme = () => document.body.classList.toggle('dark-mode');

  // ===== CAMBIO DE IDIOMA =====
  window.toggleLanguage = () => {
    const elements = {
      'Upskill Academy': 'Upskill Academy',
      'Inicio': 'Home',
      'Catálogo': 'Catalog',
      'Cursos': 'Courses',
      'Planes de carrera': 'Career Paths',
      'Certificate': 'Certificate',
      'Carrito': 'Cart',
      'Usuarios': 'Users',
      'Alumnos': 'Students',
      'Docentes': 'Teachers',
      'Configuración': 'Settings',
      'Tema': 'Theme',
      'Idioma': 'Language',
      'Documentos': 'Documents',
      'Tecnología propuesta': 'Proposed Technology',
      'Login': 'Login'
    };

    document.querySelectorAll('a, button, h1').forEach(el => {
      if (elements[el.innerText]) el.innerText = elements[el.innerText];
    });
  };

  // ===== MODAL DE COOKIES =====
  const cookieModal = document.getElementById('cookieModal');
  const acceptAll = document.getElementById('acceptAll');
  const rejectAll = document.getElementById('rejectAll');
  const onlyNecessary = document.getElementById('onlyNecessary');

  if (cookieModal) {
    const userChoice = localStorage.getItem('cookieChoice');
    if (!userChoice) cookieModal.style.display = 'flex';

    const closeCookieModal = choice => {
      localStorage.setItem('cookieChoice', choice);
      cookieModal.style.display = 'none';
    };

    if (acceptAll) acceptAll.addEventListener('click', () => closeCookieModal('accepted'));
    if (rejectAll) rejectAll.addEventListener('click', () => closeCookieModal('rejected'));
    if (onlyNecessary) onlyNecessary.addEventListener('click', () => closeCookieModal('necessary'));
  }

  // ===== MODALES DE TÉRMINOS Y PRIVACIDAD =====
  const terminosModal = document.getElementById('terminosModal');
  const openTerminos = document.getElementById('openTerminos');
  const cerrarTerminos = document.getElementById('cerrarTerminos');

  const privacidadModal = document.getElementById('privacidadModal');
  const openPrivacidad = document.getElementById('openPrivacidad');
  const cerrarPrivacidad = document.getElementById('cerrarPrivacidad');

  const closeIcons = document.querySelectorAll('.close');

  if (openTerminos && terminosModal) {
    openTerminos.addEventListener('click', e => {
      e.preventDefault();
      terminosModal.style.display = 'flex';
    });
    cerrarTerminos.addEventListener('click', () => terminosModal.style.display = 'none');
  }

  if (openPrivacidad && privacidadModal) {
    openPrivacidad.addEventListener('click', e => {
      e.preventDefault();
      privacidadModal.style.display = 'flex';
    });
    cerrarPrivacidad.addEventListener('click', () => privacidadModal.style.display = 'none');
  }

  closeIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      icon.closest('.modal').style.display = 'none';
    });
  });

  window.addEventListener('click', e => {
    if (e.target === terminosModal || e.target === privacidadModal) {
      e.target.style.display = 'none';
    }
  });
});

