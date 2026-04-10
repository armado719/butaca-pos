import { Request, Response } from 'express';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';

export const getMesas = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM mesas ORDER BY numero ASC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener mesas' });
  }
};
