import { Response, NextFunction } from 'express';
import pool from '../db/connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CustomRequest } from '../middlewares/validateToken';

export const crearPedido = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { mesa_id, productos, observaciones } = req.body;
  const usuario_id = req.usuario!.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let total = 0;
    for (const item of productos) total += item.precio * item.cantidad;

    const [pedidoResult] = await conn.query<ResultSetHeader>(
      'INSERT INTO pedidos (mesa_id, usuario_id, estado, total, observaciones) VALUES (?, ?, ?, ?, ?)',
      [mesa_id, usuario_id, 'pendiente', total, observaciones || '']
    );
    const pedido_id = pedidoResult.insertId;

    for (const item of productos) {
      const subtotal = item.precio * item.cantidad;
      await conn.query(
        'INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario, subtotal, observaciones) VALUES (?, ?, ?, ?, ?, ?)',
        [pedido_id, item.id, item.cantidad, item.precio, subtotal, item.observaciones || '']
      );
    }

    await conn.query('UPDATE mesas SET estado = "ocupada" WHERE id = ?', [mesa_id]);
    await conn.commit();

    if (req.io) {
      req.io.emit('nueva_comanda', {
        id: pedido_id, mesa_id, mesero: req.usuario!.nombre,
        productos, observaciones, estado: 'pendiente', created_at: new Date(),
      });
    }

    res.json({ msg: 'Pedido enviado a cocina correctamente', pedido_id });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};

export const getPendientes = async (_req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        p.id, p.mesa_id, p.estado, p.observaciones, p.created_at,
        u.nombre  AS mesero,
        m.numero  AS mesa_numero,
        pd.cantidad,
        pd.observaciones AS det_obs,
        prod.nombre      AS producto_nombre
      FROM pedidos p
      JOIN usuarios u            ON p.usuario_id  = u.id
      JOIN mesas m               ON p.mesa_id     = m.id
      LEFT JOIN pedido_detalle pd ON pd.pedido_id  = p.id
      LEFT JOIN productos prod    ON pd.producto_id = prod.id
      WHERE p.estado IN ('pendiente', 'en_cocina')
      ORDER BY p.created_at ASC
    `);

    const pedidosMap = new Map<number, any>();
    for (const row of rows) {
      if (!pedidosMap.has(row.id)) {
        pedidosMap.set(row.id, {
          id: row.id, mesa_id: row.mesa_id, estado: row.estado,
          observaciones: row.observaciones, created_at: row.created_at,
          mesero: row.mesero, mesa_numero: row.mesa_numero, productos: [],
        });
      }
      if (row.producto_nombre) {
        pedidosMap.get(row.id).productos.push({
          nombre: row.producto_nombre, cantidad: row.cantidad, observaciones: row.det_obs,
        });
      }
    }
    res.json([...pedidosMap.values()]);
  } catch (error) { next(error); }
};

export const actualizarEstado = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    await pool.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
    if (req.io) req.io.emit('pedido_actualizado', { id: parseInt(id), estado });
    res.json({ msg: `Estado actualizado a ${estado}` });
  } catch (error) { next(error); }
};

export const getCaja = async (_req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        p.id, p.mesa_id, p.estado, p.total, p.created_at,
        u.nombre  AS mesero,
        m.numero  AS mesa_numero,
        pd.cantidad, pd.subtotal,
        prod.nombre AS producto_nombre
      FROM pedidos p
      JOIN usuarios u            ON p.usuario_id  = u.id
      JOIN mesas m               ON p.mesa_id     = m.id
      LEFT JOIN pedido_detalle pd ON pd.pedido_id  = p.id
      LEFT JOIN productos prod    ON pd.producto_id = prod.id
      WHERE p.estado IN ('listo', 'entregado')
      ORDER BY p.created_at ASC
    `);

    const pedidosMap = new Map<number, any>();
    for (const row of rows) {
      if (!pedidosMap.has(row.id)) {
        pedidosMap.set(row.id, {
          id: row.id, mesa_id: row.mesa_id, estado: row.estado,
          total: row.total, created_at: row.created_at,
          mesero: row.mesero, mesa_numero: row.mesa_numero, productos: [],
        });
      }
      if (row.producto_nombre) {
        pedidosMap.get(row.id).productos.push({
          nombre: row.producto_nombre, cantidad: row.cantidad, subtotal: row.subtotal,
        });
      }
    }
    res.json([...pedidosMap.values()]);
  } catch (error) { next(error); }
};

export const pagarPedido = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { metodo_pago, monto } = req.body;
  const usuario_id = req.usuario!.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'INSERT INTO pagos (pedido_id, usuario_id, monto, metodo_pago) VALUES (?, ?, ?, ?)',
      [id, usuario_id, monto, metodo_pago]
    );
    await conn.query('UPDATE pedidos SET estado = "pagado" WHERE id = ?', [id]);
    const [pedido] = await conn.query<RowDataPacket[]>('SELECT mesa_id FROM pedidos WHERE id = ?', [id]);
    if (pedido.length > 0) {
      await conn.query('UPDATE mesas SET estado = "disponible" WHERE id = ?', [pedido[0].mesa_id]);
    }
    await conn.commit();
    if (req.io) req.io.emit('pedido_pagado', { pedido_id: parseInt(id) });
    res.json({ msg: 'Pago registrado y mesa liberada con éxito' });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};
