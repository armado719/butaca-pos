import { Request, Response } from 'express';
import pool from '../db/connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const crearPedido = async (req: Request, res: Response): Promise<void> => {
  const { mesa_id, productos, observaciones } = req.body;
  const usuario_id = (req as any).usuario.id;

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

    const io = (req as any).io;
    if (io) {
      io.emit('nueva_comanda', {
        id: pedido_id,
        mesa_id,
        mesero: (req as any).usuario.nombre,
        productos,
        observaciones,
        estado: 'pendiente',
        created_at: new Date(),
      });
    }

    res.json({ msg: 'Pedido enviado a cocina correctamente', pedido_id });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ msg: 'Error al procesar el pedido' });
  } finally {
    conn.release();
  }
};

export const getPendientes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [pedidos] = await pool.query<RowDataPacket[]>(`
      SELECT p.id, p.mesa_id, p.estado, p.observaciones, p.created_at,
             u.nombre as mesero, m.numero as mesa_numero
      FROM pedidos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN mesas m    ON p.mesa_id    = m.id
      WHERE p.estado IN ('pendiente', 'en_cocina')
      ORDER BY p.created_at ASC
    `);

    for (const pedido of pedidos) {
      const [detalles] = await pool.query<RowDataPacket[]>(`
        SELECT pd.cantidad, pd.observaciones, prod.nombre
        FROM pedido_detalle pd
        JOIN productos prod ON pd.producto_id = prod.id
        WHERE pd.pedido_id = ?
      `, [pedido.id]);
      pedido.productos = detalles;
    }

    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener pedidos pendientes' });
  }
};

export const actualizarEstado = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    await pool.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);

    const io = (req as any).io;
    if (io) io.emit('pedido_actualizado', { id: parseInt(id as string), estado });

    res.json({ msg: `Estado actualizado a ${estado}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al actualizar el estado' });
  }
};

export const getCaja = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [pedidos] = await pool.query<RowDataPacket[]>(`
      SELECT p.id, p.mesa_id, p.estado, p.total, p.created_at,
             u.nombre as mesero, m.numero as mesa_numero
      FROM pedidos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN mesas m    ON p.mesa_id    = m.id
      WHERE p.estado IN ('listo', 'entregado')
      ORDER BY p.created_at ASC
    `);

    for (const pedido of pedidos) {
      const [detalles] = await pool.query<RowDataPacket[]>(`
        SELECT pd.cantidad, pd.subtotal, prod.nombre
        FROM pedido_detalle pd
        JOIN productos prod ON pd.producto_id = prod.id
        WHERE pd.pedido_id = ?
      `, [pedido.id]);
      pedido.productos = detalles;
    }

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ msg: 'Error de servidor' });
  }
};

export const pagarPedido = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { metodo_pago, monto } = req.body;
  const usuario_id = (req as any).usuario.id;

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

    const io = (req as any).io;
    if (io) io.emit('pedido_pagado', { pedido_id: parseInt(id as string) });

    res.json({ msg: 'Pago registrado y mesa liberada con éxito' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ msg: 'Hubo un error registrando el pago' });
  } finally {
    conn.release();
  }
};
