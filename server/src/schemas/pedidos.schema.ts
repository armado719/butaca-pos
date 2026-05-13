import { z } from 'zod';

const productoItemSchema = z.object({
  id:            z.number().int().positive(),
  cantidad:      z.number().int().positive('La cantidad debe ser mayor a 0'),
  precio:        z.number().positive('El precio debe ser mayor a 0'),
  observaciones: z.string().optional(),
});

const clienteNuevoSchema = z.object({
  nombre:    z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono:  z.string().min(7).max(20),
  direccion: z.string().min(5),
  notas:     z.string().optional(),
});

export const crearPedidoSchema = z.object({
  tipo:              z.enum(['mesa', 'domicilio']).default('mesa'),
  mesa_id:           z.number().int().positive().optional(),
  cliente_id:        z.number().int().positive().optional(),
  cliente_nuevo:     clienteNuevoSchema.optional(),
  direccion_entrega: z.string().min(5).optional(),
  costo_domicilio:   z.number().min(0).default(0),
  productos:         z.array(productoItemSchema).min(1, 'El pedido debe incluir al menos un producto'),
  observaciones:     z.string().optional(),
})
.refine(
  (d) => d.tipo === 'domicilio' || d.mesa_id !== undefined,
  { message: 'mesa_id es requerido para pedidos de mesa' }
)
.refine(
  (d) => d.tipo === 'mesa' || d.cliente_id !== undefined || d.cliente_nuevo !== undefined,
  { message: 'Se requiere cliente_id o cliente_nuevo para domicilios' }
)
.refine(
  (d) => d.tipo === 'mesa' || d.direccion_entrega !== undefined,
  { message: 'direccion_entrega es requerida para domicilios' }
);

export const actualizarEstadoSchema = z.object({
  estado: z.enum(['pendiente', 'en_cocina', 'listo', 'entregado', 'pagado', 'cancelado'], {
    errorMap: () => ({ message: 'Estado no válido' }),
  }),
});

export const actualizarEstadoDomicilioSchema = z.object({
  estado_domicilio: z.enum(['en_camino', 'entregado']),
  entregado_por:    z.number().int().positive().optional(),
});

export const pagarPedidoSchema = z.object({
  metodo_pago: z.enum(['efectivo', 'transferencia', 'nequi', 'daviplata', 'contra_entrega'], {
    errorMap: () => ({ message: 'Método de pago no válido' }),
  }),
  monto: z.number().positive('El monto debe ser mayor a 0'),
});

export type CrearPedidoDTO               = z.infer<typeof crearPedidoSchema>;
export type ActualizarEstadoDTO          = z.infer<typeof actualizarEstadoSchema>;
export type ActualizarEstadoDomicilioDTO = z.infer<typeof actualizarEstadoDomicilioSchema>;
export type PagarPedidoDTO               = z.infer<typeof pagarPedidoSchema>;
export type ProductoItem                 = z.infer<typeof productoItemSchema>;
export type ClienteNuevoDTO              = z.infer<typeof clienteNuevoSchema>;
