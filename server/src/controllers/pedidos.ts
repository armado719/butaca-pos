import { Response, NextFunction } from 'express';
import { CustomRequest } from '../middlewares/validateToken';
import { createOrder, getPendingOrders, updateOrderStatus, getCashierOrders, processPayment } from '../services/pedidos.service';
import type { CrearPedidoDTO, ActualizarEstadoDTO, PagarPedidoDTO } from '../schemas/pedidos.schema';

export const crearPedido = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mesa_id, productos, observaciones } = req.body as CrearPedidoDTO;
    const result = await createOrder(mesa_id, productos, observaciones ?? '', req.usuario!, req.io);
    res.json({ msg: 'Pedido enviado a cocina correctamente', ...result });
  } catch (error) { next(error); }
};

export const getPendientes = async (_req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getPendingOrders());
  } catch (error) { next(error); }
};

export const actualizarEstado = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { estado } = req.body as ActualizarEstadoDTO;
    await updateOrderStatus(id, estado, req.io);
    res.json({ msg: `Estado actualizado a ${estado}` });
  } catch (error) { next(error); }
};

export const getCaja = async (_req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getCashierOrders());
  } catch (error) { next(error); }
};

export const pagarPedido = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { metodo_pago, monto } = req.body as PagarPedidoDTO;
    await processPayment(id, metodo_pago, monto, req.usuario!.id, req.io);
    res.json({ msg: 'Pago registrado y mesa liberada con éxito' });
  } catch (error) { next(error); }
};
