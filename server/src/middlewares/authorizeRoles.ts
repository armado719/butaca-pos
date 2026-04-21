import { Response, NextFunction } from 'express';
import { CustomRequest } from './validateToken';

/**
 * Middleware factory: verifica que el rol del usuario esté en la lista permitida.
 * Debe usarse siempre después de validateToken.
 *
 * Uso: router.get('/ruta', validateToken, authorizeRoles('admin', 'cajero'), handler)
 */
export const authorizeRoles = (...roles: string[]) =>
  (req: CustomRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      res.status(403).json({
        msg: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}.`,
      });
      return;
    }
    next();
  };
