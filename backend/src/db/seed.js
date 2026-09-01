// Datos de ejemplo para probar el CRM. Ejecutar con: npm run seed
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from './index.js';

console.log('Sembrando datos de ejemplo...');

db.exec('DELETE FROM evaluaciones; DELETE FROM interacciones; DELETE FROM clientes; DELETE FROM usuarios;');

const insUsuario = db.prepare('INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)');
const adminId = insUsuario.run('Admin Demo', 'admin@upskill.mx', bcrypt.hashSync('admin123', 10), 'admin').lastInsertRowid;
const userId = insUsuario.run('Ana Ventas', 'ana@upskill.mx', bcrypt.hashSync('ana12345', 10), 'usuario').lastInsertRowid;

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
insInter.run(c1, 'llamada', 'Renovación de plan anual', new Date().toISOString(), userId);
insInter.run(c1, 'correo', 'Envío de propuesta comercial', new Date(Date.now() - 3 * 864e5).toISOString(), userId);
insInter.run(c2, 'reunion', 'Demo del producto', new Date(Date.now() - 10 * 864e5).toISOString(), adminId);
insInter.run(c3, 'llamada', 'Intento de recontacto sin respuesta', new Date(Date.now() - 60 * 864e5).toISOString(), userId);

console.log('Listo. Usuarios de prueba:');
console.log('  admin@upskill.mx / admin123  (admin)');
console.log('  ana@upskill.mx   / ana12345   (usuario)');
