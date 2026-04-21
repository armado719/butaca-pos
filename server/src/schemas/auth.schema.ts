import { z } from 'zod';

export const loginSchema = z.object({
  email:    z.string().email('El email no tiene un formato válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginDTO = z.infer<typeof loginSchema>;
