import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware factory: valida req.body contra un schema Zod.
 * Si falla devuelve 400 con la lista de errores por campo.
 * Si pasa, reemplaza req.body con el valor parseado (tipos coercionados y defaults aplicados).
 *
 * Uso: router.post('/ruta', validate(miSchema), handler)
 */
export const validate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errores = result.error.errors.map((e) => ({
        campo: e.path.join('.') || 'body',
        mensaje: e.message,
      }));
      res.status(400).json({ msg: 'Datos inválidos', errores });
      return;
    }
    req.body = result.data;
    next();
  };
