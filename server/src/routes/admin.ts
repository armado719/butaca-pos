import { Router } from 'express';
import { validateToken } from '../middlewares/validateToken';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { validate } from '../middlewares/validate';
import { crearMesaSchema, crearProductoSchema, crearUsuarioSchema } from '../schemas/admin.schema';
import {
  getMesas, crearMesa, actualizarMesa, eliminarMesa,
  getCategorias,
  getProductos, crearProducto, actualizarProducto, toggleProducto,
  getUsuarios, crearUsuario, actualizarUsuario, toggleUsuario,
} from '../controllers/admin';

const router = Router();
router.use(validateToken, authorizeRoles('admin'));

// Mesas
router.get('/mesas',                    getMesas);
router.post('/mesas',                   validate(crearMesaSchema),     crearMesa);
router.put('/mesas/:id',                actualizarMesa);
router.delete('/mesas/:id',             eliminarMesa);

// Categorías
router.get('/categorias',               getCategorias);

// Productos
router.get('/productos',                getProductos);
router.post('/productos',               validate(crearProductoSchema),  crearProducto);
router.put('/productos/:id',            actualizarProducto);
router.patch('/productos/:id/toggle',   toggleProducto);

// Usuarios
router.get('/usuarios',                 getUsuarios);
router.post('/usuarios',                validate(crearUsuarioSchema),   crearUsuario);
router.put('/usuarios/:id',             actualizarUsuario);
router.patch('/usuarios/:id/toggle',    toggleUsuario);

export default router;
