import { z } from 'zod';

export const crearMesaSchema = z.object({
  numero: z.number().int().positive('El número de mesa debe ser un entero positivo'),
  capacidad: z.number().int().positive().optional(),
});

export const crearProductoSchema = z.object({
  categoria_id: z.number().int().positive('categoria_id es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  precio: z.number().positive('El precio debe ser mayor a 0'),
});

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('El email no tiene un formato válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['admin', 'mesero', 'cocina', 'cajero'], {
    errorMap: () => ({ message: 'Rol no válido. Opciones: admin, mesero, cocina, cajero' }),
  }),
});
