import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos el Request de express para poder inyectar el usuario
export interface CustomRequest extends Request {
  usuario?: any;
}

export const validateToken = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const headerToken = req.headers['authorization'];

  if (headerToken != undefined && headerToken.startsWith('Bearer ')) {
    // Tiene token
    try {
      const bearerToken = headerToken.slice(7);
      
      const payload = jwt.verify(bearerToken, process.env.JWT_SECRET || 'supersecretkey');
      req.usuario = payload;

      next();
    } catch (error) {
      res.status(401).json({ msg: 'Token no válido' });
    }
  } else {
    // No tiene token
    res.status(401).json({ msg: 'Acceso denegado. Token no proporcionado.' });
  }
};
