import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';
import { CustomRequest } from '../middlewares/validateToken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('La variable de entorno JWT_SECRET es obligatoria. Definila en server/.env');
}

export const login = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );
    if (rows.length === 0) {
      res.status(401).json({ msg: 'Usuario no encontrado o inactivo' });
      return;
    }
    const usuario = rows[0];
    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) {
      res.status(401).json({ msg: 'Contraseña incorrecta' });
      return;
    }
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      msg: 'Login exitoso',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });
  } catch (error) {
    next(error);
  }
};
