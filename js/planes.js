// ===============================
// 📘 Generador dinámico de Planes de Carrera
// ===============================

// ⚠️ Importante: Asegúrate de que este archivo se cargue DESPUÉS del archivo donde está tu JSON de cursos
// Ejemplo en tu HTML:
// <script src="cursos.js"></script>
// <script src="planes.js"></script>

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

function generarPlanes() {
  const contenedor = document.getElementById("planesContainer");
  if (!contenedor) {
    console.warn("⚠️ No se encontró el contenedor con id 'planesContainer'");
    return;
  }

  contenedor.innerHTML = "";

  planes.forEach(plan => {
    // Filtramos los cursos del JSON global (variable 'cursos' definida en cursos.js)
    const cursosPlan = cursos.filter(curso =>
      plan.cursos.some(tag => curso.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())))
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
}

// Ejecutar automáticamente al cargar la página
document.addEventListener("DOMContentLoaded", generarPlanes);
