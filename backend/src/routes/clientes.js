import { Router } from 'express';
import {
  listar, obtener, crear, actualizar, cambiarEtapa, eliminar,
} from '../controllers/clientesController.js';
import { listarPorCliente } from '../controllers/interaccionesController.js';
import { autenticar, requiereRol } from '../middleware/auth.js';

const router = Router();

// Todas las rutas de clientes requieren sesión.
router.use(autenticar);

router.get('/', listar);
router.post('/', crear);
router.get('/:id', obtener);
router.put('/:id', actualizar);
router.put('/:id/etapa', cambiarEtapa);
router.delete('/:id', requiereRol('admin'), eliminar);

// Historial de interacciones de un cliente.
router.get('/:id/interacciones', listarPorCliente);

export default router;
