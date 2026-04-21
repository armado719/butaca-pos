import { z } from 'zod';

const fechaISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha esperado: YYYY-MM-DD');

export const crearEmpleadoSchema = z.object({
  nombre:           z.string().min(1, 'El nombre es requerido'),
  documento:        z.string().min(1, 'El documento es requerido'),
  cargo:            z.string().min(1, 'El cargo es requerido'),
  salario_base:     z.number().nonnegative('El salario no puede ser negativo'),
  fecha_ingreso:    fechaISO,
  telefono:         z.string().optional(),
  direccion:        z.string().optional(),
  fecha_nacimiento: fechaISO.optional(),
  banco:            z.string().optional(),
  cuenta_bancaria:  z.string().optional(),
});

export const crearEgresoSchema = z.object({
  concepto:    z.string().min(1, 'El concepto es requerido'),
  monto:       z.number().positive('El monto debe ser mayor a 0'),
  categoria:   z.enum(['nomina', 'insumos', 'servicios', 'mantenimiento', 'otros'], {
    errorMap: () => ({ message: 'Categoría no válida' }),
  }),
  empleado_id: z.number().int().positive().nullable().optional(),
});

export type CrearEmpleadoDTO = z.infer<typeof crearEmpleadoSchema>;
export type CrearEgresoDTO   = z.infer<typeof crearEgresoSchema>;
