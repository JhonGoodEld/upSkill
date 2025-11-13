document.addEventListener("DOMContentLoaded", () => {
// ===============================
// 📘 Generador dinámico de Planes de Carrera (versión moderna)
// ===============================

const planes = [
  {
    nombre: "Analista de Datos",
    descripcion: "Domina herramientas para analizar y visualizar datos de forma profesional.",
    cursos: ["Python", "Excel", "SQL", "Power BI", "Análisis de Datos"],
    imagen: "../src/datos.jpg"
  },
  {
    nombre: "Desarrollador Full Stack",
    descripcion: "Aprende a desarrollar aplicaciones web completas desde el frontend hasta el backend.",
    cursos: ["HTML", "CSS", "JavaScript", "Node.js", "React", "MongoDB", "Django", "Git"],
    imagen: "../src/fullstack.jpg"
  },
  {
    nombre: "Ciberseguridad y Redes",
    descripcion: "Prepárate para proteger redes, sistemas y servidores en entornos empresariales.",
    cursos: ["Ciberseguridad", "Linux", "Cisco", "Docker"],
    imagen: "../src/ciberseguridad.jpg"
  },
  {
    nombre: "Inteligencia Artificial y Machine Learning",
    descripcion: "Crea soluciones inteligentes con IA, aprendizaje profundo y modelos predictivos.",
    cursos: ["IA", "Machine Learning", "Deep Learning", "Python"],
    imagen: "../src/ia.jpg"
  },
  {
    nombre: "Diseño y Multimedia",
    descripcion: "Desarrolla tu creatividad con herramientas profesionales de diseño y animación.",
    cursos: ["Diseño Web", "UX", "Photoshop", "Blender", "Edición de Video"],
    imagen: "../src/diseno.jpg"
  },
  {
    nombre: "Electrónica y Robótica",
    descripcion: "Aprende a construir sistemas automatizados y dispositivos inteligentes.",
    cursos: ["Arduino", "IoT", "Robótica"],
    imagen: "../src/robotica.jpg"
  },
  {
    nombre: "Desarrollo Personal y Liderazgo",
    descripcion: "Mejora tus habilidades blandas para destacar en el entorno profesional.",
    cursos: ["Comunicación", "Ética", "Liderazgo"],
    imagen: "../src/liderazgo.jpg"
  }
];

// ===============================
// 🧩 Cargar JSON y generar planes
// ===============================
async function generarPlanes() {
  const contenedor = document.getElementById("planesContainer");
  if (!contenedor) return console.warn("⚠️ No se encontró el contenedor con id 'planesContainer'");

  try {
    // 📥 Carga del archivo JSON (ajusta la ruta si es necesario)
    const response = await fetch("../data/productos.json");
    if (!response.ok) throw new Error("No se pudo cargar el archivo de cursos");
    const cursos = await response.json();

    contenedor.innerHTML = "";

    planes.forEach(plan => {
      // Buscar los cursos que coincidan por tag o nombre
      const cursosPlan = cursos.filter(curso =>
        plan.cursos.some(tag =>
          curso.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())) ||
          curso.nombre.toLowerCase().includes(tag.toLowerCase())
        )
      );

      const listaCursos = cursosPlan.length > 0
        ? cursosPlan.map(c => `<li>${c.nombre}</li>`).join("")
        : "<li>No se encontraron cursos asociados</li>";

      const card = `
        <div class="plan-card">
          <img src="${plan.imagen}" alt="${plan.nombre}">
          <h2>${plan.nombre}</h2>
          <p>${plan.descripcion}</p>
          <h4>Cursos incluidos:</h4>
          <ul>${listaCursos}</ul>
          <button class="btn-plan">Explorar plan</button>
        </div>
      `;

      contenedor.innerHTML += card;
    });
  } catch (error) {
    console.error("❌ Error al generar los planes:", error);
    contenedor.innerHTML = "<p>Error al cargar los planes de carrera.</p>";
  }
}

// Ejecutar automáticamente al cargar la página
document.addEventListener("DOMContentLoaded", generarPlanes);

// === MODAL: Términos y Condiciones ===
const terminosModal = document.getElementById("terminosModal");
const openTerminos = document.getElementById("openTerminos");
const cerrarTerminos = document.getElementById("cerrarTerminos");

// === MODAL: Aviso de Privacidad ===
const privacidadModal = document.getElementById("privacidadModal");
const openPrivacidad = document.getElementById("openPrivacidad");
const cerrarPrivacidad = document.getElementById("cerrarPrivacidad");

// Botones e íconos de cierre
const closeIcons = document.querySelectorAll(".close");

openTerminos.addEventListener("click", (e) => {
  e.preventDefault();
  terminosModal.style.display = "flex";
});

openPrivacidad.addEventListener("click", (e) => {
  e.preventDefault();
  privacidadModal.style.display = "flex";
});

cerrarTerminos.addEventListener("click", () => {
  terminosModal.style.display = "none";
});

cerrarPrivacidad.addEventListener("click", () => {
  privacidadModal.style.display = "none";
});

closeIcons.forEach(icon => {
  icon.addEventListener("click", () => {
    icon.parentElement.parentElement.style.display = "none";
  });
});

window.addEventListener("click", (event) => {
  if (event.target === terminosModal || event.target === privacidadModal) {
    event.target.style.display = "none";
  }
});
});