import { Router } from "express";
import {
  crearPedido,
  getPendientes,
  actualizarEstado,
  getCaja,
  pagarPedido,
  actualizarEstadoDomicilio,
  getDomicilios,
  transferMesa,
  modificarPedidoController,
  getDetalle,
  anularPedidoController,
  corregirMetodoPagoController,
} from "../controllers/pedidos";
import { validateToken } from "../middlewares/validateToken";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { validate } from "../middlewares/validate";
import {
  crearPedidoSchema,
  actualizarEstadoSchema,
  pagarPedidoSchema,
  actualizarEstadoDomicilioSchema,
} from "../schemas/pedidos.schema";

const router = Router();

router.post(
  "/",
  validateToken,
  authorizeRoles("mesero", "cajero", "admin"),
  validate(crearPedidoSchema),
  crearPedido,
);

router.get(
  "/pendientes",
  validateToken,
  authorizeRoles("mesero", "cocina", "cajero", "admin"),
  getPendientes,
);

router.put(
  "/:id/estado",
  validateToken,
  authorizeRoles("cocina", "admin"),
  validate(actualizarEstadoSchema),
  actualizarEstado,
);

router.get("/caja", validateToken, authorizeRoles("cajero", "admin"), getCaja);

router.post(
  "/:id/pagar",
  validateToken,
  authorizeRoles("cajero", "admin"),
  validate(pagarPedidoSchema),
  pagarPedido,
);

router.put(
  "/:id/estado-domicilio",
  validateToken,
  authorizeRoles("cajero", "admin"),
  validate(actualizarEstadoDomicilioSchema),
  actualizarEstadoDomicilio,
);

router.get(
  "/domicilios",
  validateToken,
  authorizeRoles("cajero", "admin"),
  getDomicilios,
);

router.patch(
  "/:id/transferir-mesa",
  validateToken,
  authorizeRoles("mesero", "cajero", "admin"),
  transferMesa,
);

router.patch(
  "/:id/items",
  validateToken,
  authorizeRoles("mesero", "cajero", "admin"),
  modificarPedidoController,
);

router.get(
  "/:id/detalle",
  validateToken,
  authorizeRoles("mesero", "cajero", "admin"),
  getDetalle,
);

router.patch(
  "/:id/anular",
  validateToken,
  authorizeRoles("admin"),
  anularPedidoController,
);

router.patch(
  "/:id/metodo-pago",
  validateToken,
  authorizeRoles("admin"),
  corregirMetodoPagoController,
);

export default router;
