import { Router } from 'express';
import { crearPedido, getPendientes, actualizarEstado, getCaja, pagarPedido } from '../controllers/pedidos';
import { validateToken } from '../middlewares/validateToken';

const router = Router();

router.get('/pendientes', validateToken, getPendientes);
router.get('/caja', validateToken, getCaja);
router.post('/', validateToken, crearPedido);
router.post('/:id/pagar', validateToken, pagarPedido);
router.put('/:id/estado', validateToken, actualizarEstado);

export default router;
