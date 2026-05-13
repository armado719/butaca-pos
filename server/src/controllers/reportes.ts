import { Response, NextFunction } from 'express';
import pool from '../db/connection';
import { RowDataPacket } from 'mysql2';
import { CustomRequest } from '../middlewares/validateToken';

export const ventasDelDia = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fecha = (req.query.fecha as string) || new Date().toISOString().split('T')[0];

    const [resumen] = await pool.query<RowDataPacket[]>(`
      SELECT
        COUNT(DISTINCT p.id)                                                                  AS total_pedidos,
        COALESCE(SUM(pg.monto), 0)                                                            AS total_ventas,
        COALESCE(SUM(CASE WHEN pg.metodo_pago = 'efectivo'      THEN pg.monto ELSE 0 END), 0) AS efectivo,
        COALESCE(SUM(CASE WHEN pg.metodo_pago = 'nequi'         THEN pg.monto ELSE 0 END), 0) AS nequi,
        COALESCE(SUM(CASE WHEN pg.metodo_pago = 'daviplata'     THEN pg.monto ELSE 0 END), 0) AS daviplata,
        COALESCE(SUM(CASE WHEN pg.metodo_pago = 'transferencia' THEN pg.monto ELSE 0 END), 0) AS transferencia
      FROM pagos pg
      JOIN pedidos p ON pg.pedido_id = p.id
      WHERE DATE(pg.created_at) = ?
    `, [fecha]);

    const [topProductos] = await pool.query<RowDataPacket[]>(`
      SELECT pr.nombre, SUM(pd.cantidad) AS cantidad, SUM(pd.subtotal) AS total
      FROM pedido_detalle pd
      JOIN productos pr ON pd.producto_id = pr.id
      JOIN pedidos p    ON pd.pedido_id   = p.id
      WHERE DATE(p.created_at) = ? AND p.estado = 'pagado'
      GROUP BY pr.id, pr.nombre
      ORDER BY cantidad DESC
      LIMIT 10
    `, [fecha]);

    const [ultimosPedidos] = await pool.query<RowDataPacket[]>(`
      SELECT p.id, p.total, p.estado, p.created_at, p.tipo,
             m.numero AS mesa_numero, u.nombre AS mesero, pg.metodo_pago
      FROM pedidos p
      LEFT JOIN mesas m    ON p.mesa_id    = m.id
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN pagos pg ON pg.pedido_id = p.id
      WHERE DATE(p.created_at) = ?
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [fecha]);

    res.json({ fecha, resumen: resumen[0], top_productos: topProductos, ultimos_pedidos: ultimosPedidos });
  } catch (error) {
    next(error);
  }
};
