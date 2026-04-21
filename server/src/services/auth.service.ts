import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface LoginResult {
  token: string;
  usuario: { id: number; nombre: string; email: string; rol: string };
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
    [email]
  );

  if (rows.length === 0) {
    const err: any = new Error('Usuario no encontrado o inactivo');
    err.statusCode = 401;
    throw err;
  }

  const usuario = rows[0];
  const valid = await bcrypt.compare(password, usuario.password);
  if (!valid) {
    const err: any = new Error('Contraseña incorrecta');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  };
}
