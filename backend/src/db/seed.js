// Datos de ejemplo para probar los dos CRM. Ejecutar con: npm run seed
// Recrea el esquema desde cero (por si cambiaron restricciones CHECK).
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import db from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Sembrando datos de ejemplo...');

// 1) Esquema limpio -------------------------------------------------------------
db.exec(`
  PRAGMA foreign_keys = OFF;
  DROP TABLE IF EXISTS seguimientos;
  DROP TABLE IF EXISTS contactos_docente;
  DROP TABLE IF EXISTS evaluaciones;
  DROP TABLE IF EXISTS interacciones;
  DROP TABLE IF EXISTS clientes;
  DROP TABLE IF EXISTS usuarios;
  PRAGMA foreign_keys = ON;
`);
db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));

// 2) Usuarios -----------------------------------------------------------------
const insUsuario = db.prepare('INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)');
const hash = (p) => bcrypt.hashSync(p, 10);

const adminId = insUsuario.run('Admin Demo', 'admin@upskill.mx', hash('admin123'), 'admin').lastInsertRowid;
const anaId = insUsuario.run('Ana Ventas', 'ana@upskill.mx', hash('ana12345'), 'admin').lastInsertRowid;
const lauraId = insUsuario.run('Laura Torres', 'laura@upskill.mx', hash('laura123'), 'docente').lastInsertRowid;
const diegoId = insUsuario.run('Diego Núñez', 'diego@upskill.mx', hash('diego123'), 'docente').lastInsertRowid;
insUsuario.run('Sofía Alumna', 'alumno@upskill.mx', hash('alumno123'), 'alumno');

// 3) Admin CRM: clientes + interacciones -------------------------------------
const insCliente = db.prepare(
  'INSERT INTO clientes (nombre, correo, telefono, empresa, estado, etapa_crm) VALUES (?, ?, ?, ?, ?, ?)'
);
const c1 = insCliente.run('Carlos Ramírez', 'carlos@empresa.com', '4491112233', 'TechCorp', 'activo', 'Frecuente').lastInsertRowid;
const c2 = insCliente.run('Laura Méndez', 'laura@startup.io', '4495556677', 'StartupIO', 'activo', 'Activo').lastInsertRowid;
const c3 = insCliente.run('Pedro Gómez', 'pedro@negocio.mx', null, 'Negocio MX', 'inactivo', 'Inactivo').lastInsertRowid;
insCliente.run('María Fernández', 'maria@consultora.com', '4498889900', 'Consultora F', 'activo', 'Prospecto');

const insInter = db.prepare(
  'INSERT INTO interacciones (cliente_id, tipo, descripcion, fecha, usuario_id) VALUES (?, ?, ?, ?, ?)'
);
const diasAtras = (n) => new Date(Date.now() - n * 864e5).toISOString();
insInter.run(c1, 'llamada', 'Renovación de plan anual', new Date().toISOString(), anaId);
insInter.run(c1, 'correo', 'Envío de propuesta comercial', diasAtras(3), anaId);
insInter.run(c2, 'reunion', 'Demo del producto', diasAtras(10), adminId);
insInter.run(c3, 'llamada', 'Intento de recontacto sin respuesta', diasAtras(60), anaId);

// 4) Docente CRM: contactos + seguimientos (aislados por docente) ------------
const insContacto = db.prepare(
  `INSERT INTO contactos_docente (docente_id, nombre, correo, telefono, curso, estado, etapa, fecha_registro)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
const insSeg = db.prepare(
  'INSERT INTO seguimientos (contacto_id, docente_id, tipo, descripcion, fecha) VALUES (?, ?, ?, ?, ?)'
);

// -- Laura (Python) --
const l1 = insContacto.run(lauraId, 'Andrés Salas', 'andres.salas@mail.com', '4491234567', 'Python desde cero', 'activo', 'Inscrito', diasAtras(20)).lastInsertRowid;
const l2 = insContacto.run(lauraId, 'Brenda Ruiz', 'brenda.ruiz@mail.com', null, 'Python desde cero', 'activo', 'Al dia', diasAtras(35)).lastInsertRowid;
const l3 = insContacto.run(lauraId, 'Carlos Vega', 'carlos.vega@mail.com', '4497654321', 'Data Analytics', 'activo', 'Prospecto', diasAtras(5)).lastInsertRowid;
const l4 = insContacto.run(lauraId, 'Diana Prado', 'diana.prado@mail.com', null, 'Python desde cero', 'inactivo', 'En riesgo', diasAtras(50)).lastInsertRowid;
insContacto.run(lauraId, 'Emilio Cano', 'emilio.cano@mail.com', null, 'Data Analytics', 'activo', 'Graduado', diasAtras(120));

insSeg.run(l1, lauraId, 'tutoria', 'Repaso de funciones y listas', diasAtras(2));
insSeg.run(l1, lauraId, 'mensaje', 'Recordatorio de entrega del proyecto 1', diasAtras(9));
insSeg.run(l2, lauraId, 'correo', 'Envío de material complementario', diasAtras(40));
insSeg.run(l3, lauraId, 'llamada', 'Resolución de dudas sobre el plan de estudios', diasAtras(4));

// -- Diego (Redes / Cloud) --
const d1 = insContacto.run(diegoId, 'Fernanda Lira', 'fernanda.lira@mail.com', '4490001122', 'Cisco CCNA', 'activo', 'Inscrito', diasAtras(15)).lastInsertRowid;
const d2 = insContacto.run(diegoId, 'Gerardo Mora', 'gerardo.mora@mail.com', null, 'AWS Advanced Networking', 'activo', 'Prospecto', diasAtras(8)).lastInsertRowid;
const d3 = insContacto.run(diegoId, 'Hilda Reyes', 'hilda.reyes@mail.com', null, 'Cisco CCNA', 'activo', 'En riesgo', diasAtras(45)).lastInsertRowid;
insContacto.run(diegoId, 'Iván Solís', 'ivan.solis@mail.com', '4493334455', 'Azure AI', 'activo', 'Al dia', diasAtras(25));

insSeg.run(d1, diegoId, 'reunion', 'Sesión de laboratorio: configuración de VLANs', diasAtras(3));
insSeg.run(d2, diegoId, 'correo', 'Información de fechas y costos', diasAtras(6));
insSeg.run(d3, diegoId, 'mensaje', 'Aviso: lleva 3 semanas sin conectarse', diasAtras(12));

console.log('Listo. Usuarios de prueba:');
console.log('  admin@upskill.mx / admin123   (admin)');
console.log('  ana@upskill.mx   / ana12345   (admin)');
console.log('  laura@upskill.mx / laura123   (docente)');
console.log('  diego@upskill.mx / diego123   (docente)');
console.log('  alumno@upskill.mx / alumno123 (alumno)');
