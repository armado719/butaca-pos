import { Router } from 'express';
import {
  crearPedido, getPendientes, actualizarEstado,
  getCaja, pagarPedido, actualizarEstadoDomicilio, getDomicilios,
} from '../controllers/pedidos';
import { validateToken } from '../middlewares/validateToken';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { validate } from '../middlewares/validate';
import {
  crearPedidoSchema, actualizarEstadoSchema,
  pagarPedidoSchema, actualizarEstadoDomicilioSchema,
} from '../schemas/pedidos.schema';

const router = Router();

router.post('/',
  validateToken, authorizeRoles('mesero', 'cajero', 'admin'),
  validate(crearPedidoSchema),
  crearPedido);

router.get('/pendientes',
  validateToken, authorizeRoles('cocina', 'admin'),
  getPendientes);

router.put('/:id/estado',
  validateToken, authorizeRoles('cocina', 'admin'),
  validate(actualizarEstadoSchema),
  actualizarEstado);

router.get('/caja',
  validateToken, authorizeRoles('cajero', 'admin'),
  getCaja);

router.post('/:id/pagar',
  validateToken, authorizeRoles('cajero', 'admin'),
  validate(pagarPedidoSchema),
  pagarPedido);

router.put('/:id/estado-domicilio',
  validateToken, authorizeRoles('cajero', 'admin'),
  validate(actualizarEstadoDomicilioSchema),
  actualizarEstadoDomicilio);

router.get('/domicilios',
  validateToken, authorizeRoles('cajero', 'admin'),
  getDomicilios);

export default router;
