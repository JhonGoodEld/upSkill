USE upskill_crm;

-- MIGRACION SCM PARA UPSKILL ACADEMY: cursos como productos y licencias como inventario.

-- IMPORTANTE: esta migracion reemplaza los productos/pedidos/movimientos SCM de demostracion.

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS nivel VARCHAR(50) NULL AFTER categoria,
  ADD COLUMN IF NOT EXISTS duracion VARCHAR(50) NULL AFTER nivel,
  ADD COLUMN IF NOT EXISTS valoracion DECIMAL(3,2) NULL AFTER duracion,
  ADD COLUMN IF NOT EXISTS inscritos INT UNSIGNED NOT NULL DEFAULT 0 AFTER valoracion,
  ADD COLUMN IF NOT EXISTS tags TEXT NULL AFTER inscritos,
  ADD COLUMN IF NOT EXISTS descuento DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER tags,
  ADD COLUMN IF NOT EXISTS fecha_publicacion DATE NULL AFTER descuento,
  ADD COLUMN IF NOT EXISTS precio_venta DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER costo_unitario,
  ADD COLUMN IF NOT EXISTS unidad_inventario VARCHAR(30) NOT NULL DEFAULT 'Licencia' AFTER stock_minimo;

ALTER TABLE scm_configuracion
  ADD COLUMN IF NOT EXISTS nivel_porcentaje TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER nivel_scm;

ALTER TABLE movimientos_inventario
  MODIFY motivo ENUM('venta','ajuste','reposición','compra','devolución','asignación','inscripción','liberación','reserva','otro') NOT NULL DEFAULT 'otro';

INSERT INTO proveedores(nombre,contacto,correo,telefono,direccion)
SELECT 'EduTech Licencias MX','Ana Torres','contacto@edutech-licencias.test','4491001001','Aguascalientes, Ags.'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE correo='contacto@edutech-licencias.test');

INSERT INTO proveedores(nombre,contacto,correo,telefono,direccion)
SELECT 'CloudLearn Partners','Mario Gómez','soporte@cloudlearn.test','4491001002','México'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE correo='soporte@cloudlearn.test');

INSERT INTO proveedores(nombre,contacto,correo,telefono,direccion)
SELECT 'CreativeSoft Education','Laura Díaz','educacion@creativesoft.test','4491001003','México'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE correo='educacion@creativesoft.test');

INSERT INTO proveedores(nombre,contacto,correo,telefono,direccion)
SELECT 'NetSkills Academic','Carlos Vega','academico@netskills.test','4491001004','México'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE correo='academico@netskills.test');

INSERT INTO proveedores(nombre,contacto,correo,telefono,direccion)
SELECT 'Open Learning Resources','Sofía Ramos','licencias@openlearning.test','4491001005','México'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE correo='licencias@openlearning.test');

SET FOREIGN_KEY_CHECKS=0;
DELETE FROM movimientos_inventario;
DELETE FROM pedidos;
DELETE FROM productos;
ALTER TABLE movimientos_inventario AUTO_INCREMENT=1;
ALTER TABLE pedidos AUTO_INCREMENT=1;
ALTER TABLE productos AUTO_INCREMENT=1;
SET FOREIGN_KEY_CHECKS=1;

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  1,
  'Curso de JavaScript',
  'Aprende JavaScript desde cero hasta avanzado con proyectos prácticos.',
  'Programación',
  'Intermedio',
  '20 horas',
  4.7,
  1200,
  'JavaScript, Web, Frontend',
  10,
  '2025-08-01',
  'src/js.jpg',
  499.00,
  109.78,
  37,
  15,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  2,
  'Curso de Python',
  'Domina Python y sus aplicaciones en ciencia de datos y desarrollo web.',
  'Programación',
  'Básico',
  '25 horas',
  4.8,
  1500,
  'Python, Data Science, Backend',
  15,
  '2025-06-15',
  'src/4-Best-Python-Certifications.jpg',
  599.00,
  131.78,
  44,
  20,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  3,
  'Curso de Diseño Web',
  'Crea páginas web modernas, responsive y con buen diseño UX/UI.',
  'Diseño',
  'Intermedio',
  '18 horas',
  4.5,
  900,
  'Diseño, HTML, CSS, Responsive',
  5,
  '2025-07-20',
  'src/html.jpg',
  450.00,
  99.00,
  51,
  25,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='CreativeSoft Education' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  4,
  'Curso de Marketing Digital',
  'Aprende estrategias de marketing digital efectivas para negocios y emprendimientos.',
  'Marketing',
  'Básico',
  '15 horas',
  4.6,
  800,
  'Marketing, Redes Sociales, SEO',
  0,
  '2025-05-10',
  'src/marketing.jpg',
  399.00,
  87.78,
  58,
  10,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='Open Learning Resources' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  5,
  'Curso de Excel Avanzado',
  'Domina fórmulas, tablas dinámicas y gráficos para análisis profesional.',
  'Ofimática',
  'Avanzado',
  '12 horas',
  4.4,
  650,
  'Excel, Formulas, Tablas Dinámicas',
  10,
  '2025-03-05',
  'src/excell.jpg',
  299.00,
  65.78,
  65,
  15,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='CloudLearn Partners' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  6,
  'Curso de Inteligencia Artificial',
  'Introducción a IA y Machine Learning con proyectos prácticos en Python.',
  'Programación',
  'Avanzado',
  '30 horas',
  4.9,
  500,
  'IA, Machine Learning, Python',
  20,
  '2025-09-01',
  'src/ia.jpg',
  799.00,
  175.78,
  18,
  20,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  7,
  'Curso de Fotografía',
  'Aprende técnicas de fotografía profesional y edición básica de imágenes.',
  'Arte',
  'Básico',
  '10 horas',
  4.3,
  700,
  'Fotografía, Cámara, Técnicas',
  0,
  '2025-04-18',
  'src/fotografia.jpg',
  350.00,
  77.00,
  79,
  25,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='CreativeSoft Education' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  8,
  'Curso de Inglés Intermedio',
  'Mejora tu inglés en gramática y conversación con ejercicios prácticos.',
  'Idiomas',
  'Intermedio',
  '20 horas',
  4.5,
  1100,
  'Inglés, Idioma, Conversación',
  5,
  '2025-02-22',
  'src/ingles.jpg',
  299.00,
  65.78,
  86,
  10,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='Open Learning Resources' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  9,
  'Curso de Ciberseguridad Básica',
  'Aprende los fundamentos de la ciberseguridad y cómo proteger tus sistemas personales o empresariales.',
  'Seguridad Informática',
  'Básico',
  '22 horas',
  4.6,
  860,
  'Ciberseguridad, Redes, Protección de Datos',
  10,
  '2025-07-12',
  'src/ciber.jpg',
  549.00,
  120.78,
  93,
  15,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='NetSkills Academic' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  10,
  'Curso de Node.js y Express',
  'Desarrolla aplicaciones backend robustas con Node.js y Express desde cero.',
  'Programación',
  'Intermedio',
  '24 horas',
  4.7,
  970,
  'Node.js, Backend, API',
  15,
  '2025-08-05',
  'src/node.jpg',
  650.00,
  143.00,
  20,
  20,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  11,
  'Curso de SQL y Bases de Datos',
  'Aprende a crear, consultar y administrar bases de datos relacionales con SQL.',
  'Bases de Datos',
  'Básico',
  '16 horas',
  4.6,
  780,
  'SQL, MySQL, PostgreSQL',
  5,
  '2025-05-30',
  'src/sql.jpg',
  399.00,
  87.78,
  36,
  25,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  12,
  'Curso de React.js',
  'Crea interfaces modernas e interactivas con React.js y componentes reutilizables.',
  'Programación',
  'Intermedio',
  '20 horas',
  4.8,
  1250,
  'React, Frontend, JavaScript',
  10,
  '2025-09-10',
  'src/react.jpg',
  599.00,
  131.78,
  8,
  10,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  13,
  'Curso de Desarrollo de Apps Móviles',
  'Aprende a desarrollar aplicaciones móviles multiplataforma con Flutter y Dart.',
  'Programación',
  'Avanzado',
  '28 horas',
  4.7,
  620,
  'Android, iOS, Flutter',
  20,
  '2025-09-18',
  'src/android.jpg',
  749.00,
  164.78,
  50,
  15,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  14,
  'Curso de Diseño UX/UI',
  'Aprende a diseñar interfaces intuitivas centradas en la experiencia del usuario.',
  'Diseño',
  'Intermedio',
  '18 horas',
  4.5,
  930,
  'UX, UI, Figma',
  5,
  '2025-06-25',
  'src/uxui.jpg',
  499.00,
  109.78,
  57,
  20,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='CreativeSoft Education' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  15,
  'Curso de Arduino y Electrónica',
  'Aprende a programar y montar proyectos electrónicos con Arduino desde cero.',
  'Electrónica',
  'Básico',
  '22 horas',
  4.7,
  870,
  'Arduino, Sensores, Prototipos',
  10,
  '2025-04-15',
  'src/arduino.jpg',
  599.00,
  131.78,
  64,
  25,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='NetSkills Academic' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  16,
  'Curso de Deep Learning',
  'Entrena redes neuronales profundas aplicadas a visión e inteligencia artificial.',
  'Inteligencia Artificial',
  'Avanzado',
  '35 horas',
  4.9,
  540,
  'Deep Learning, TensorFlow, Python',
  25,
  '2025-09-25',
  'src/deep.jpg',
  899.00,
  197.78,
  71,
  10,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='CloudLearn Partners' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  17,
  'Curso de Robótica Educativa',
  'Aprende los fundamentos de la robótica educativa mediante proyectos prácticos.',
  'Robótica',
  'Básico',
  '20 horas',
  4.5,
  750,
  'Robótica, STEM, Arduino',
  5,
  '2025-07-08',
  'src/robotica.jpg',
  499.00,
  109.78,
  78,
  15,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='NetSkills Academic' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  18,
  'Curso de Power BI',
  'Aprende a crear paneles de control interactivos con Power BI para análisis empresarial.',
  'Análisis de Datos',
  'Intermedio',
  '16 horas',
  4.6,
  970,
  'Power BI, Dashboard, Análisis',
  10,
  '2025-06-01',
  'src/powerbi.jpg',
  449.00,
  98.78,
  18,
  20,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='CloudLearn Partners' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  19,
  'Curso de Git y GitHub',
  'Domina el control de versiones con Git y aprende a colaborar en proyectos usando GitHub.',
  'Desarrollo de Software',
  'Básico',
  '8 horas',
  4.8,
  1800,
  'Git, GitHub, Versionado',
  0,
  '2025-03-12',
  'src/git.jpg',
  299.00,
  65.78,
  92,
  25,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  20,
  'Curso de Redes Cisco CCNA',
  'Prepárate para la certificación Cisco CCNA con prácticas reales y simulaciones de red.',
  'Redes',
  'Avanzado',
  '40 horas',
  4.7,
  620,
  'Cisco, CCNA, Networking',
  15,
  '2025-10-01',
  'src/redes.jpg',
  799.00,
  175.78,
  10,
  10,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='NetSkills Academic' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  21,
  'Curso de Docker y Contenedores',
  'Aprende a crear, gestionar y desplegar contenedores con Docker para entornos modernos.',
  'DevOps',
  'Intermedio',
  '20 horas',
  4.8,
  950,
  'Docker, Contenedores, DevOps',
  15,
  '2025-08-22',
  'src/docker.jpg',
  649.00,
  142.78,
  35,
  15,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='CloudLearn Partners' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  22,
  'Curso de Linux desde Cero',
  'Domina los comandos básicos de Linux y aprende a moverte con soltura en la terminal.',
  'Sistemas Operativos',
  'Básico',
  '12 horas',
  4.6,
  1300,
  'Linux, Terminal, CLI',
  0,
  '2025-04-05',
  'src/linux.jpg',
  299.00,
  65.78,
  42,
  20,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  23,
  'Curso de HTML y CSS Moderno',
  'Aprende a estructurar y dar estilo a páginas web profesionales con HTML5 y CSS3.',
  'Diseño Web',
  'Básico',
  '14 horas',
  4.5,
  1600,
  'HTML, CSS, Frontend',
  5,
  '2025-02-15',
  'src/html.jpg',
  299.00,
  65.78,
  49,
  25,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='CreativeSoft Education' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  24,
  'Curso de Kotlin para Android',
  'Desarrolla aplicaciones Android modernas con Kotlin y Android Studio.',
  'Programación',
  'Intermedio',
  '22 horas',
  4.7,
  880,
  'Kotlin, Android, Apps',
  10,
  '2025-06-10',
  'src/kotlin.jpg',
  599.00,
  131.78,
  8,
  10,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  25,
  'Curso de Comunicación Efectiva',
  'Mejora tu expresión verbal y corporal para lograr una comunicación efectiva en cualquier entorno.',
  'Habilidades Blandas',
  'Básico',
  '8 horas',
  4.3,
  720,
  'Comunicación, Oratoria, Soft Skills',
  0,
  '2025-03-08',
  'src/comunicacion.jpg',
  299.00,
  65.78,
  63,
  15,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='Open Learning Resources' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  26,
  'Curso de HTML Canvas y Animaciones',
  'Crea animaciones e interfaces interactivas con HTML Canvas y JavaScript.',
  'Desarrollo Web',
  'Intermedio',
  '16 horas',
  4.6,
  640,
  'Canvas, Animaciones, Frontend',
  5,
  '2025-07-01',
  'src/canvas.jpg',
  399.00,
  87.78,
  70,
  20,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='CreativeSoft Education' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  27,
  'Curso de MongoDB y NoSQL',
  'Aprende a usar MongoDB para manejar grandes volúmenes de datos de manera flexible.',
  'Bases de Datos',
  'Intermedio',
  '18 horas',
  4.7,
  890,
  'MongoDB, NoSQL, Backend',
  10,
  '2025-08-28',
  'src/mongodb.jpg',
  499.00,
  109.78,
  77,
  25,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  28,
  'Curso de Photoshop Creativo',
  'Domina las herramientas de Photoshop para crear y editar imágenes profesionales.',
  'Diseño',
  'Intermedio',
  '14 horas',
  4.4,
  780,
  'Photoshop, Diseño, Edición',
  5,
  '2025-05-22',
  'src/photoshop.jpg',
  399.00,
  87.78,
  84,
  10,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='CreativeSoft Education' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  29,
  'Curso de Ética Profesional',
  'Reflexiona sobre la ética y la responsabilidad profesional en distintos entornos laborales.',
  'Desarrollo Personal',
  'Básico',
  '6 horas',
  4.2,
  510,
  'Ética, Valores, Profesionalismo',
  0,
  '2025-02-05',
  'src/etica.jpg',
  249.00,
  54.78,
  91,
  15,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='Open Learning Resources' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  30,
  'Curso de Arduino Avanzado con IoT',
  'Conecta sensores y módulos IoT avanzados con Arduino para proyectos inteligentes.',
  'Electrónica',
  'Avanzado',
  '30 horas',
  4.8,
  490,
  'Arduino, IoT, Sensores',
  15,
  '2025-09-30',
  'src/iot.jpg',
  799.00,
  175.78,
  18,
  20,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='NetSkills Academic' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  31,
  'Curso de Java Avanzado',
  'Perfecciona tus habilidades en Java con programación orientada a objetos y frameworks modernos.',
  'Programación',
  'Avanzado',
  '25 horas',
  4.8,
  830,
  'Java, POO, Backend',
  10,
  '2025-07-25',
  'src/java.jpg',
  699.00,
  153.78,
  34,
  25,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  32,
  'Curso de Blockchain y Criptomonedas',
  'Explora cómo funciona la tecnología blockchain y su impacto en el mundo financiero.',
  'Finanzas',
  'Avanzado',
  '28 horas',
  4.7,
  640,
  'Blockchain, Criptomonedas, Bitcoin',
  20,
  '2025-10-03',
  'src/blockchain.jpg',
  849.00,
  186.78,
  41,
  10,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='CloudLearn Partners' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  33,
  'Curso de Análisis de Datos con Python',
  'Aprende a procesar y visualizar datos con Python, Pandas y Matplotlib.',
  'Data Science',
  'Intermedio',
  '24 horas',
  4.8,
  980,
  'Python, Pandas, Análisis',
  15,
  '2025-08-12',
  'src/datos.jpg',
  599.00,
  131.78,
  48,
  15,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='CloudLearn Partners' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  34,
  'Curso de Liderazgo y Trabajo en Equipo',
  'Desarrolla habilidades de liderazgo y colaboración para equipos de alto desempeño.',
  'Desarrollo Personal',
  'Básico',
  '10 horas',
  4.4,
  880,
  'Liderazgo, Gestión, Trabajo en Equipo',
  0,
  '2025-05-02',
  'src/liderazgo.jpg',
  349.00,
  76.78,
  55,
  20,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='Open Learning Resources' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  35,
  'Curso de Django para Web',
  'Crea sitios web profesionales con el framework Django y bases de datos integradas.',
  'Programación',
  'Avanzado',
  '26 horas',
  4.8,
  720,
  'Django, Python, Web',
  10,
  '2025-09-06',
  'src/django.jpg',
  649.00,
  142.78,
  62,
  25,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='EduTech Licencias MX' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  36,
  'Curso de Edición de Video Profesional',
  'Aprende técnicas de edición profesional con Adobe Premiere Pro y efectos avanzados.',
  'Multimedia',
  'Intermedio',
  '18 horas',
  4.5,
  810,
  'Edición, Video, Premiere',
  5,
  '2025-07-14',
  'src/video.jpg',
  499.00,
  109.78,
  8,
  10,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='CreativeSoft Education' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  37,
  'Curso de Machine Learning Aplicado',
  'Desarrolla modelos predictivos con Python y aprende a aplicar Machine Learning en casos reales.',
  'Inteligencia Artificial',
  'Avanzado',
  '30 horas',
  4.9,
  590,
  'Machine Learning, Python, IA',
  20,
  '2025-10-05',
  'src/ml.jpg',
  849.00,
  186.78,
  76,
  15,
  'Licencia',
  'PUSH',
  (SELECT id FROM proveedores WHERE nombre='CloudLearn Partners' ORDER BY id DESC LIMIT 1),
  'activo'
);

INSERT INTO productos(id,nombre,descripcion,categoria,nivel,duracion,valoracion,inscritos,tags,descuento,fecha_publicacion,imagen,precio_venta,costo_unitario,stock_actual,stock_minimo,unidad_inventario,estrategia_logistica,proveedor_id,estado) VALUES (
  38,
  'Curso de Diseño 3D con Blender',
  'Aprende modelado, texturizado y animación 3D desde cero con Blender.',
  'Diseño',
  'Intermedio',
  '22 horas',
  4.7,
  760,
  '3D, Blender, Modelado',
  10,
  '2025-08-09',
  'src/blender.jpg',
  599.00,
  131.78,
  83,
  20,
  'Licencia',
  'PULL',
  (SELECT id FROM proveedores WHERE nombre='CreativeSoft Education' ORDER BY id DESC LIMIT 1),
  'activo'
);

UPDATE scm_configuracion SET nivel_scm='Inicial', nivel_porcentaje=0, descripcion='Procesos básicos de cursos, proveedores y licencias.' WHERE id=1;

CREATE OR REPLACE VIEW inventario AS
SELECT p.id producto_id,p.nombre producto,p.categoria,p.stock_actual,p.stock_minimo,p.unidad_inventario,
CASE WHEN p.stock_actual<=p.stock_minimo THEN 'Licencias bajas' ELSE 'Normal' END estado_stock,
p.estrategia_logistica,p.proveedor_id FROM productos p WHERE p.estado='activo';
USE upskill_crm;

-- =========================================================
-- ETAPA 2 SCM - USUARIO DE LOGISTICA Y PROGRESO MANUAL
-- Migración incremental para una base que ya tiene CRM + SCM.
-- =========================================================

-- 1) Nuevo rol restringido al SCM.
ALTER TABLE usuarios
  MODIFY rol ENUM('admin','logistica','docente','alumno') NOT NULL;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS actualizado_en DATETIME NULL AFTER fecha_registro;

-- 2) El checklist de madurez pasa a ser un registro MANUAL del avance.
ALTER TABLE scm_configuracion
  ADD COLUMN IF NOT EXISTS check_productos_proveedores TINYINT(1) NOT NULL DEFAULT 0 AFTER descripcion,
  ADD COLUMN IF NOT EXISTS check_inventario TINYINT(1) NOT NULL DEFAULT 0 AFTER check_productos_proveedores,
  ADD COLUMN IF NOT EXISTS check_trazabilidad TINYINT(1) NOT NULL DEFAULT 0 AFTER check_inventario,
  ADD COLUMN IF NOT EXISTS check_push_pull TINYINT(1) NOT NULL DEFAULT 0 AFTER check_trazabilidad,
  ADD COLUMN IF NOT EXISTS check_reportes TINYINT(1) NOT NULL DEFAULT 0 AFTER check_push_pull;

-- 3) Guardar la estrategia con la que nació cada pedido para no perder historial
--    si posteriormente el curso cambia de PUSH a PULL o viceversa.
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS estrategia_origen ENUM('PUSH','PULL') NULL AFTER origen;

UPDATE pedidos pe
JOIN productos p ON p.id = pe.producto_id
SET pe.estrategia_origen = p.estrategia_logistica
WHERE pe.estrategia_origen IS NULL;

-- 4) Inventario escolar basado en licencias/membresías y baja lógica del curso.
CREATE OR REPLACE VIEW inventario AS
SELECT
  p.id AS producto_id,
  p.nombre AS producto,
  p.categoria,
  p.stock_actual,
  p.stock_minimo,
  p.unidad_inventario,
  CASE
    WHEN p.stock_actual <= p.stock_minimo THEN 'Pocas licencias'
    ELSE 'Normal'
  END AS estado_stock,
  p.estrategia_logistica,
  p.proveedor_id
FROM productos p
WHERE p.estado = 'activo';

-- 5) Normalizar los cursos ya existentes al formato escolar.
UPDATE productos
SET unidad_inventario = 'Licencia'
WHERE unidad_inventario IS NULL OR unidad_inventario = '';

-- La cuenta principal conserva el rol administrativo.
UPDATE usuarios
SET rol='admin', estado='activo', es_superadmin=1
WHERE correo='admin@upskillacademy.com';
