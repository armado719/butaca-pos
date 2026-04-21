import { z } from 'zod';

export const crearPedidoSchema = z.object({
  mesa_id: z.number().int().positive('mesa_id debe ser un entero positivo'),
  productos: z
    .array(
      z.object({
        id: z.number().int().positive('El id del producto debe ser un entero positivo'),
        cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
        precio: z.number().positive('El precio debe ser mayor a 0'),
        observaciones: z.string().optional(),
      })
    )
    .min(1, 'El pedido debe incluir al menos un producto'),
  observaciones: z.string().optional(),
});

export const actualizarEstadoSchema = z.object({
  estado: z.enum(['pendiente', 'en_cocina', 'listo', 'entregado', 'pagado', 'cancelado'], {
    errorMap: () => ({ message: 'Estado no válido' }),
  }),
});

export const pagarPedidoSchema = z.object({
  metodo_pago: z.enum(['efectivo', 'transferencia', 'nequi', 'daviplata'], {
    errorMap: () => ({ message: 'Método de pago no válido' }),
  }),
  monto: z.number().positive('El monto debe ser mayor a 0'),
});
