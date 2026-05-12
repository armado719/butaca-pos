import { Router } from 'express';
import { buscarCliente, nuevoCliente, editarCliente } from '../controllers/clientes';
import { validateToken } from '../middlewares/validateToken';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { validate } from '../middlewares/validate';
import { crearClienteSchema, actualizarClienteSchema } from '../schemas/clientes.schema';

const router = Router();

router.get('/',     validateToken, authorizeRoles('mesero', 'cajero', 'admin'),                                    buscarCliente);
router.post('/',    validateToken, authorizeRoles('mesero', 'cajero', 'admin'), validate(crearClienteSchema),      nuevoCliente);
router.put('/:id',  validateToken, authorizeRoles('mesero', 'cajero', 'admin'), validate(actualizarClienteSchema), editarCliente);

export default router;
