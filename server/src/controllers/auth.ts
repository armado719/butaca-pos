import { Response, NextFunction } from 'express';
import { CustomRequest } from '../middlewares/validateToken';
import { loginUser } from '../services/auth.service';

if (!process.env.JWT_SECRET) {
  throw new Error('La variable de entorno JWT_SECRET es obligatoria. Definila en server/.env');
}

export const login = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json({ msg: 'Login exitoso', ...result });
  } catch (error) {
    next(error);
  }
};
