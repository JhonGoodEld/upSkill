import { Router } from 'express';
import {
  listarContactos, obtenerContacto, crearContacto, actualizarContacto,
  cambiarEtapa, eliminarContacto, listarSeguimientos, crearSeguimiento, metricas,
} from '../controllers/docenteController.js';
import { autenticar, requiereRol } from '../middleware/auth.js';

const router = Router();

// CRM del docente: requiere sesión y rol 'docente'.
router.use(autenticar, requiereRol('docente'));

router.get('/contactos', listarContactos);
router.post('/contactos', crearContacto);
router.get('/contactos/:id', obtenerContacto);
router.put('/contactos/:id', actualizarContacto);
router.put('/contactos/:id/etapa', cambiarEtapa);
router.delete('/contactos/:id', eliminarContacto);
router.get('/contactos/:id/seguimientos', listarSeguimientos);

router.post('/seguimientos', crearSeguimiento);

router.get('/metricas', metricas);

export default router;
