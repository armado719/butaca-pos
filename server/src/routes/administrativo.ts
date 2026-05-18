import { Router } from "express";
import { validateToken } from "../middlewares/validateToken";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { validate } from "../middlewares/validate";
import {
  crearEmpleadoSchema,
  crearEgresoSchema,
  crearInsumoSchema,
} from "../schemas/administrativo.schema";
import {
  getEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  getEgresos,
  crearEgreso,
  eliminarEgreso,
  actualizarEgreso,
  getInsumos,
  crearInsumo,
  actualizarStock,
  eliminarInsumo,
  actualizarInsumo,
  getInsumoLogs,
} from "../controllers/administrativo";

const router = Router();
router.use(validateToken, authorizeRoles("admin"));

// Empleados
router.get("/empleados", getEmpleados);
router.post("/empleados", validate(crearEmpleadoSchema), crearEmpleado);
router.put("/empleados/:id", actualizarEmpleado);

// Egresos
router.get("/egresos", getEgresos);
router.post("/egresos", validate(crearEgresoSchema), crearEgreso);
router.put("/egresos/:id", actualizarEgreso);
router.delete("/egresos/:id", eliminarEgreso);

// Inventario
router.get("/insumos", getInsumos);
router.post("/insumos", validate(crearInsumoSchema), crearInsumo);
router.get("/insumos/logs", getInsumoLogs);
router.put("/insumos/:id", actualizarInsumo);
router.patch("/insumos/:id", actualizarStock);
router.delete("/insumos/:id", eliminarInsumo);

export default router;
