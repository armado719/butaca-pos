import { Response, NextFunction } from 'express';
import { CustomRequest } from '../middlewares/validateToken';
import { buscarClientePorTelefono, crearCliente, actualizarCliente } from '../services/clientes.service';
import type { CrearClienteDTO, ActualizarClienteDTO } from '../schemas/clientes.schema';

export const buscarCliente = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = (req.query.q as string) ?? '';
    res.json(await buscarClientePorTelefono(q));
  } catch (error) { next(error); }
};

export const nuevoCliente = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await crearCliente(req.body as CrearClienteDTO);
    res.status(201).json({ msg: 'Cliente creado', ...result });
  } catch (error) { next(error); }
};

export const editarCliente = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await actualizarCliente(Number(req.params.id), req.body as ActualizarClienteDTO);
    res.json({ msg: 'Cliente actualizado' });
  } catch (error) { next(error); }
};
