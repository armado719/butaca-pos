import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Buscar usuario en la base de datos
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]);
    
    if (rows.length === 0) {
      res.status(401).json({ msg: 'Usuario no encontrado o inactivo' });
      return;
    }

    const usuario = rows[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) {
      res.status(401).json({ msg: 'Contraseña incorrecta' });
      return;
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        rol: usuario.rol, 
        nombre: usuario.nombre 
      }, 
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '8h' }
    );

    // Enviar respuesta
    res.json({
      msg: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error en el login: ', error);
    res.status(500).json({ msg: 'Error de servidor' });
  }
};
