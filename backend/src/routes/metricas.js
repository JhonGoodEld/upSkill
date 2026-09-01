import { Router } from 'express';
import { resumen } from '../controllers/metricasController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.get('/', autenticar, resumen);

export default router;
