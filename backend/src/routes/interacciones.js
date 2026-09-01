import { Router } from 'express';
import { crear, misInteracciones } from '../controllers/interaccionesController.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.use(autenticar);

router.post('/', crear);
router.get('/mias', misInteracciones);

export default router;
