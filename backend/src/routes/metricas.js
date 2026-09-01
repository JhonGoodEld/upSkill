import { Router } from 'express';
import { resumen } from '../controllers/metricasController.js';
import { autenticar, requiereRol } from '../middleware/auth.js';

const router = Router();

router.get('/', autenticar, requiereRol('admin'), resumen);

export default router;
