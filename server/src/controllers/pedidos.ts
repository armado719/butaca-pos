import { Response, NextFunction } from "express";
import { CustomRequest } from "../middlewares/validateToken";
import {
  createOrder,
  getPendingOrders,
  updateOrderStatus,
  getCashierOrders,
  processPayment,
  updateDomicilioStatus,
  getDomiciliosActivos,
  transferirMesa,
  modificarPedido,
  getPedidoDetalle,
  anularPedido,
  corregirMetodoPago,
} from "../services/pedidos.service";
import type { ProductoItem } from "../schemas/pedidos.schema";
import type {
  CrearPedidoDTO,
  ActualizarEstadoDTO,
  PagarPedidoDTO,
  ActualizarEstadoDomicilioDTO,
} from "../schemas/pedidos.schema";

export const crearPedido = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as CrearPedidoDTO;
    const result = await createOrder(
      body.tipo ?? "mesa",
      body.productos,
      body.observaciones ?? "",
      req.usuario!,
      req.io,
      {
        mesa_id: body.mesa_id,
        cliente_id: body.cliente_id,
        cliente_nuevo: body.cliente_nuevo,
        direccion_entrega: body.direccion_entrega,
        costo_domicilio: body.costo_domicilio,
      },
    );
    res.json({ msg: "Pedido enviado a cocina correctamente", ...result });
  } catch (error) {
    next(error);
  }
};

export const getPendientes = async (
  _req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.json(await getPendingOrders());
  } catch (error) {
    next(error);
  }
};

export const actualizarEstado = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { estado } = req.body as ActualizarEstadoDTO;
    await updateOrderStatus(id, estado, req.io);
    res.json({ msg: `Estado actualizado a ${estado}` });
  } catch (error) {
    next(error);
  }
};

export const getCaja = async (
  _req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.json(await getCashierOrders());
  } catch (error) {
    next(error);
  }
};

export const pagarPedido = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { metodo_pago, monto } = req.body as PagarPedidoDTO;
    await processPayment(id, metodo_pago, monto, req.usuario!.id, req.io);
    res.json({ msg: "Pago registrado con éxito" });
  } catch (error) {
    next(error);
  }
};

export const actualizarEstadoDomicilio = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    await updateDomicilioStatus(
      id,
      req.body as ActualizarEstadoDomicilioDTO,
      req.io,
    );
    res.json({ msg: "Estado de domicilio actualizado" });
  } catch (error) {
    next(error);
  }
};

export const getDomicilios = async (
  _req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.json(await getDomiciliosActivos());
  } catch (error) {
    next(error);
  }
};

export const transferMesa = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { mesa_destino_id } = req.body as { mesa_destino_id: number };
    await transferirMesa(id, mesa_destino_id, req.io);
    res.json({ msg: "Mesa transferida correctamente" });
  } catch (error) {
    next(error);
  }
};

export const modificarPedidoController = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { agregar = [], eliminar = [] } = req.body as {
      agregar?: ProductoItem[];
      eliminar?: number[];
    };
    await modificarPedido(id, agregar, eliminar, req.io);
    res.json({ msg: "Pedido modificado correctamente" });
  } catch (error) {
    next(error);
  }
};

export const getDetalle = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    res.json(await getPedidoDetalle(id));
  } catch (error) {
    next(error);
  }
};

export const anularPedidoController = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await anularPedido(req.params.id, req.io);
    res.json({ msg: "Pedido anulado correctamente" });
  } catch (error) {
    next(error);
  }
};

export const corregirMetodoPagoController = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { metodo_pago } = req.body as { metodo_pago: string };
    await corregirMetodoPago(req.params.id, metodo_pago);
    res.json({ msg: "Método de pago corregido correctamente" });
  } catch (error) {
    next(error);
  }
};
