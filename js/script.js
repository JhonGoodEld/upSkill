document.addEventListener('DOMContentLoaded', () => {
  // Botón de regreso compartido para las vistas de la plataforma.
  if (window.location.pathname.includes('/views/') && !document.querySelector('.back-button')) {
    const back = document.createElement('button');
    back.type = 'button'; back.className = 'back-button standalone-back'; back.textContent = '← Regresar';
    back.addEventListener('click', () => { if (history.length > 1) history.back(); else location.href = 'pagPrin.html'; });
    document.body.prepend(back);
  }
  // ===== FORMULARIO DE REGISTRO =====
  const form = document.querySelector('.register-form');
  const modal = document.getElementById('successModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const promo = document.querySelector('.promo-code');

  // ===== VALIDACIÓN DE SEGURIDAD PARA FORMULARIOS =====
  const mostrarError = (formulario, mensaje, input = null) => {
    let box = formulario.querySelector('.validation-message');
    if (!box) {
      box = document.createElement('div');
      box.className = 'validation-message';
      box.setAttribute('role', 'alert');
      formulario.insertBefore(box, formulario.querySelector('button[type="submit"]') || null);
    }
    box.textContent = mensaje;
    box.style.display = 'block';
    formulario.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    if (input) {
      input.classList.add('input-error');
      input.focus();
    }
  };

  const limpiarError = formulario => {
    const box = formulario.querySelector('.validation-message');
    if (box) box.style.display = 'none';
    formulario.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  };

  const contieneEspacios = value => /\s/.test(value);
  const nombreValido = value => /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:[ ]+[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/u.test(value);
  const correoValido = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validarRegistro = formulario => {
    const nombre = formulario.querySelector('[name="nombre"]');
    const correo = formulario.querySelector('[name="correo"]');
    const telefono = formulario.querySelector('[name="telefono"]');
    const password = formulario.querySelector('[name="password"]');
    const confirmPassword = formulario.querySelector('[name="confirmPassword"]');
    const especialidad = formulario.querySelector('[name="especialidad"]');

    if (!nombre || !correo || !password || !confirmPassword) return true;

    const datos = [
      [nombre, 'El nombre es obligatorio.'],
      [correo, 'El correo electrónico es obligatorio.'],
      ...(telefono ? [[telefono, 'El teléfono es obligatorio.']] : []),
      [password, 'La contraseña es obligatoria.'],
      [confirmPassword, 'Debes confirmar la contraseña.']
    ];
    if (especialidad) datos.push([especialidad, 'El área de expertise es obligatoria.']);

    for (const [input, mensaje] of datos) {
      if (!input.value.trim()) {
        mostrarError(formulario, mensaje, input);
        return false;
      }
    }

    if (!nombreValido(nombre.value.trim())) {
      mostrarError(formulario, 'El nombre solo puede contener letras y espacios; elimina números o símbolos.', nombre);
      return false;
    }

    if (contieneEspacios(correo.value)) {
      mostrarError(formulario, 'El correo no puede contener espacios. Corrígelo para continuar.', correo);
      return false;
    }

    if (!correoValido(correo.value.trim())) {
      mostrarError(formulario, 'Ingresa un correo válido que contenga @ y un dominio, por ejemplo usuario@correo.com.', correo);
      return false;
    }

    if (telefono && !/^\d{10}$|^\d{3} \d{3} \d{4}$/.test(telefono.value.trim())) {
      mostrarError(formulario, 'El teléfono debe tener 10 dígitos con formato 4492255316 o 449 225 5316.', telefono);
      return false;
    }

    if (contieneEspacios(password.value)) {
      mostrarError(formulario, 'La contraseña no puede contener espacios.', password);
      return false;
    }

    if (contieneEspacios(confirmPassword.value)) {
      mostrarError(formulario, 'La confirmación de contraseña no puede contener espacios.', confirmPassword);
      return false;
    }

    if (password.value !== confirmPassword.value) {
      mostrarError(formulario, 'Las contraseñas no coinciden. Verifica ambas cajas.', confirmPassword);
      return false;
    }

    if (especialidad) {
      const valor = especialidad.value.trim();
      if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:[ ]+[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/u.test(valor)) {
        mostrarError(formulario, 'El área de expertise solo puede contener letras y espacios.', especialidad);
        return false;
      }
    }

    limpiarError(formulario);
    return true;
  };

  const destinosLogin = {
    'views/logalumno.html': 'alumno.html',
    'views/CMR/logdocentes.html': 'Docentes/docente.html',
    'views/CMR/Administradores/loggin.html': 'admin.html'
  };

  const destinoDesdeRuta = () => {
    const ruta = window.location.pathname.replace(/\\/g, '/');
    if (ruta.endsWith('/views/logalumno.html')) return 'alumno.html';
    if (ruta.endsWith('/views/CMR/logdocentes.html')) return 'Docentes/docente.html';
    if (ruta.endsWith('/views/CMR/Administradores/loggin.html')) return 'admin.html';
    return null;
  };

  document.querySelectorAll('.loggin-form').forEach(loginForm => {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const correo = loginForm.querySelector('[name="correo"]');
      const password = loginForm.querySelector('[name="password"]');
      const crmRole = loginForm.dataset.crmRole;

      if (!correo || !password) return;
      if (!correo.value.trim()) {
        mostrarError(loginForm, 'El correo es obligatorio.', correo);
        return;
      }
      if (contieneEspacios(correo.value)) {
        mostrarError(loginForm, 'El correo no puede contener espacios.', correo);
        return;
      }
      if (!correoValido(correo.value.trim())) {
        mostrarError(loginForm, 'Ingresa un correo válido con @ y dominio, por ejemplo usuario@correo.com.', correo);
        return;
      }
      if (!password.value) {
        mostrarError(loginForm, 'La contraseña es obligatoria.', password);
        return;
      }
      if (contieneEspacios(password.value)) {
        mostrarError(loginForm, 'La contraseña no puede contener espacios.', password);
        return;
      }

      limpiarError(loginForm);

      // Login real del CRM mediante API REST/PHP.
      if (crmRole) {
        const apiBase = loginForm.dataset.crmApi;
        const redirect = loginForm.dataset.crmRedirect;
        try {
          const response = await fetch(`${apiBase}/login.php`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              correo: correo.value.trim(),
              password: password.value,
              rol: crmRole
            })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'No fue posible iniciar sesión.');
          window.location.href = redirect;
        } catch (error) {
          mostrarError(loginForm, error.message || 'Error al conectar con el servidor.');
        }
        return;
      }

      // Comportamiento anterior para el acceso de alumnos, que todavía no usa el backend CRM.
      const destino = destinoDesdeRuta();
      if (destino) window.location.href = destino;
    });

    loginForm.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => limpiarError(loginForm));
    });
  });

  if (form && modal) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!validarRegistro(form)) return;

      // Registro real en MySQL. Las cuentas nuevas quedan PENDIENTES hasta que un administrador las apruebe.
      const registrationRole = form.dataset.registrationRole;
      const apiBase = form.dataset.registrationApi;
      if (registrationRole && apiBase) {
        const payload = {
          nombre: form.querySelector('[name="nombre"]')?.value.trim(),
          correo: form.querySelector('[name="correo"]')?.value.trim(),
          password: form.querySelector('[name="password"]')?.value,
          telefono: form.querySelector('[name="telefono"]')?.value.trim() || '',
          empresa: form.querySelector('[name="empresa"]')?.value.trim() || '',
          rol: registrationRole,
          especialidad: form.querySelector('[name="especialidad"]')?.value.trim() || '',
          curso_solicitado: form.querySelector('[name="curso_solicitado"]')?.value.trim() || ''
        };
        try {
          const response = await fetch(`${apiBase}/registro.php`, {
            method: 'POST', credentials: 'same-origin',
            headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'No fue posible registrar la solicitud.');
          const msg = modal.querySelector('.registration-status');
          if (msg) msg.textContent = data.mensaje || 'Tu solicitud está pendiente de aprobación.';
          modal.setAttribute('aria-hidden', 'false');
          modal.style.display = 'flex';
          form.reset();
        } catch (error) {
          mostrarError(form, error.message || 'Error al conectar con el servidor.');
        }
        return;
      }
      modal.setAttribute('aria-hidden', 'false');
      modal.style.display = 'flex';
    });

    const closeSuccessModal = () => modal.setAttribute('aria-hidden', 'true');
    window.closeSuccessModal = closeSuccessModal;
    if (closeBtn) closeBtn.addEventListener('click', closeSuccessModal);

    window.addEventListener('click', e => {
      if (e.target === modal) closeSuccessModal();
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSuccessModal();
    });
  }

  document.querySelectorAll('.register-form input').forEach(input => {
    input.addEventListener('input', () => {
      const formActual = input.closest('.register-form');
      if (formActual) limpiarError(formActual);
    });
  });

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

  // ===== MENÚ HAMBURGUESA / DESPLEGABLE =====
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
  const translations = {
    es: { courses: 'Cursos', career: 'Planes de carrera', certificate: 'Certificaciones', cart: 'Carrito', settings: 'Configuración', theme: 'Tema', language: 'Idioma', documents: 'Documentos', proposedTech: 'Tecnología Propuesta', status: 'Estado del Servicio', login: 'Iniciar sesión', serviceStatus: 'Estado del Servicio: 🟢 ON' },
    en: { courses: 'Courses', career: 'Career Paths', certificate: 'Certificates', cart: 'Cart', settings: 'Settings', theme: 'Theme', language: 'Language', documents: 'Documents', proposedTech: 'Proposed Technology', status: 'Service Status', login: 'Login', serviceStatus: 'Service Status: 🟢 ON' }
  };

  window.toggleLanguage = () => {
    const current = document.documentElement.dataset.language || 'es';
    const next = current === 'es' ? 'en' : 'es';
    document.documentElement.dataset.language = next;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const value = translations[next][key];
      if (value === undefined) return;
      if (el.classList.contains('menu-btn')) {
        const icon = el.querySelector('.icon');
        el.childNodes[0].nodeValue = value + ' ';
        if (icon) el.appendChild(icon);
      } else {
        el.textContent = value;
      }
    });
    localStorage.setItem('upskillLanguage', next);
  };

  const idiomaGuardado = localStorage.getItem('upskillLanguage');
  if (idiomaGuardado === 'en') {
    document.documentElement.dataset.language = 'es';
    window.toggleLanguage();
  }

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
    openTerminos.addEventListener('click', e => { e.preventDefault(); terminosModal.style.display = 'flex'; });
    if (cerrarTerminos) cerrarTerminos.addEventListener('click', () => terminosModal.style.display = 'none');
  }
  if (openPrivacidad && privacidadModal) {
    openPrivacidad.addEventListener('click', e => { e.preventDefault(); privacidadModal.style.display = 'flex'; });
    if (cerrarPrivacidad) cerrarPrivacidad.addEventListener('click', () => privacidadModal.style.display = 'none');
  }
  closeIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      const modalParent = icon.closest('.modal');
      if (modalParent) modalParent.style.display = 'none';
    });
  });
  window.addEventListener('click', e => {
    if (e.target === terminosModal || e.target === privacidadModal) e.target.style.display = 'none';
  });
});
