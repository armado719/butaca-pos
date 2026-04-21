import { Router } from 'express';
import { validateToken } from '../middlewares/validateToken';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import {
  getEmpleados, crearEmpleado, actualizarEmpleado,
  getEgresos, crearEgreso, eliminarEgreso, actualizarEgreso,
  getInsumos, crearInsumo, actualizarStock, eliminarInsumo, actualizarInsumo,
} from '../controllers/administrativo';

const router = Router();
router.use(validateToken, authorizeRoles('admin'));

// Empleados
router.get('/empleados',        getEmpleados);
router.post('/empleados',       crearEmpleado);
router.put('/empleados/:id',    actualizarEmpleado);

// Egresos
router.get('/egresos',          getEgresos);
router.post('/egresos',         crearEgreso);
router.put('/egresos/:id',      actualizarEgreso);
router.delete('/egresos/:id',   eliminarEgreso);

// Inventario
router.get('/insumos',          getInsumos);
router.post('/insumos',         crearInsumo);
router.put('/insumos/:id',      actualizarInsumo);
router.patch('/insumos/:id',    actualizarStock);
router.delete('/insumos/:id',   eliminarInsumo);

export default router;
