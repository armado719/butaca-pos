import { Response, NextFunction } from 'express';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';
import { CustomRequest } from '../middlewares/validateToken';

export const getMesas = async (_req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM mesas ORDER BY numero ASC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};
