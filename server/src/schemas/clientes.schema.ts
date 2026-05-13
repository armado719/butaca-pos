import { z } from 'zod';

export const crearClienteSchema = z.object({
  nombre:    z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono:  z.string().min(7, 'El teléfono debe tener al menos 7 dígitos').max(20),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  notas:     z.string().optional(),
});

export const actualizarClienteSchema = crearClienteSchema.partial();

export type CrearClienteDTO      = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteDTO = z.infer<typeof actualizarClienteSchema>;
