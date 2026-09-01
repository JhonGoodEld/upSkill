import 'dotenv/config';
import { crearApp } from './app.js';
import './db/index.js'; // inicializa la base de datos y aplica el esquema

const PORT = process.env.PORT || 3000;

crearApp().listen(PORT, () => {
  console.log(`CRM upSkill escuchando en http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
