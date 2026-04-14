import { Request, Response } from 'express';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';

export const getProductosAgrupados = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT p.id, p.nombre, p.descripcion, p.precio, p.disponible,
             c.id as categoria_id, c.nombre as categoria_nombre
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      WHERE p.disponible = 1 AND c.activo = 1
      ORDER BY c.id, p.nombre ASC
    `);

    const agrupado = rows.reduce((acc: Record<number, any>, producto: any) => {
      const catId = producto.categoria_id;
      if (!acc[catId]) {
        acc[catId] = { id: catId, nombre: producto.categoria_nombre, productos: [] };
      }
      acc[catId].productos.push({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
      });
      return acc;
    }, {});

    res.json(Object.values(agrupado));
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener productos' });
  }
};
