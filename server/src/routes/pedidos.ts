import { Router } from 'express';
import { crearPedido, getPendientes, actualizarEstado, getCaja, pagarPedido } from '../controllers/pedidos';
import { validateToken } from '../middlewares/validateToken';
import { authorizeRoles } from '../middlewares/authorizeRoles';

const router = Router();

router.post('/',             validateToken, authorizeRoles('mesero', 'admin'),  crearPedido);
router.get('/pendientes',   validateToken, authorizeRoles('cocina', 'admin'),  getPendientes);
router.put('/:id/estado',   validateToken, authorizeRoles('cocina', 'admin'),  actualizarEstado);
router.get('/caja',         validateToken, authorizeRoles('cajero', 'admin'),  getCaja);
router.post('/:id/pagar',   validateToken, authorizeRoles('cajero', 'admin'),  pagarPedido);

export default router;
