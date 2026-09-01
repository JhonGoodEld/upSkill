// Conexión única a SQLite usando el módulo nativo de Node (node:sqlite, Node >= 22.5).
// No requiere compilación nativa ni dependencias extra.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { dirname, join, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbFile = process.env.DB_FILE || 'crm.db';
// Relativa a la carpeta /backend
const dbPath = isAbsolute(dbFile) ? dbFile : resolve(__dirname, '../../', dbFile);

export const db = new DatabaseSync(dbPath);

// Aplica el esquema (idempotente) al arrancar.
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

export default db;
