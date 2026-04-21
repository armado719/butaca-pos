import pool from '../db/connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Server } from 'socket.io';

interface ProductoItem {
  id: number;
  cantidad: number;
  precio: number;
  observaciones?: string;
}

interface Usuario {
  id: number;
  nombre: string;
}

export async function createOrder(
  mesa_id: number,
  productos: ProductoItem[],
  observaciones: string,
  usuario: Usuario,
  io?: Server
): Promise<{ pedido_id: number }> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const total = productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

    const [result] = await conn.query<ResultSetHeader>(
      'INSERT INTO pedidos (mesa_id, usuario_id, estado, total, observaciones) VALUES (?, ?, ?, ?, ?)',
      [mesa_id, usuario.id, 'pendiente', total, observaciones || '']
    );
    const pedido_id = result.insertId;

    for (const item of productos) {
      await conn.query(
        'INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario, subtotal, observaciones) VALUES (?, ?, ?, ?, ?, ?)',
        [pedido_id, item.id, item.cantidad, item.precio, item.precio * item.cantidad, item.observaciones || '']
      );
    }

    await conn.query('UPDATE mesas SET estado = "ocupada" WHERE id = ?', [mesa_id]);
    await conn.commit();

    io?.emit('nueva_comanda', {
      id: pedido_id, mesa_id, mesero: usuario.nombre,
      productos, observaciones, estado: 'pendiente', created_at: new Date(),
    });

    return { pedido_id };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

function groupByPedido<T extends Record<string, any>>(
  rows: T[],
  extraFields: (keyof T)[]
): any[] {
  const map = new Map<number, any>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      const base: any = { id: row.id, mesa_id: row.mesa_id, estado: row.estado,
        created_at: row.created_at, mesero: row.mesero, mesa_numero: row.mesa_numero, productos: [] };
      for (const f of extraFields) base[f as string] = row[f];
      map.set(row.id, base);
    }
    if (row.producto_nombre) {
      map.get(row.id).productos.push({
        nombre: row.producto_nombre,
        cantidad: row.cantidad,
        ...(row.subtotal !== undefined  ? { subtotal: row.subtotal }         : {}),
        ...(row.det_obs  !== undefined  ? { observaciones: row.det_obs }     : {}),
      });
    }
  }
  return [...map.values()];
}

export async function getPendingOrders(): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.id, p.mesa_id, p.estado, p.observaciones, p.created_at,
           u.nombre AS mesero, m.numero AS mesa_numero,
           pd.cantidad, pd.observaciones AS det_obs, prod.nombre AS producto_nombre
    FROM pedidos p
    JOIN usuarios u             ON p.usuario_id  = u.id
    JOIN mesas m                ON p.mesa_id     = m.id
    LEFT JOIN pedido_detalle pd ON pd.pedido_id  = p.id
    LEFT JOIN productos prod    ON pd.producto_id = prod.id
    WHERE p.estado IN ('pendiente', 'en_cocina')
    ORDER BY p.created_at ASC
  `);
  return groupByPedido(rows, ['observaciones']);
}

export async function updateOrderStatus(
  id: string,
  estado: string,
  io?: Server
): Promise<void> {
  await pool.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
  io?.emit('pedido_actualizado', { id: parseInt(id), estado });
}

export async function getCashierOrders(): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.id, p.mesa_id, p.estado, p.total, p.created_at,
           u.nombre AS mesero, m.numero AS mesa_numero,
           pd.cantidad, pd.subtotal, prod.nombre AS producto_nombre
    FROM pedidos p
    JOIN usuarios u             ON p.usuario_id  = u.id
    JOIN mesas m                ON p.mesa_id     = m.id
    LEFT JOIN pedido_detalle pd ON pd.pedido_id  = p.id
    LEFT JOIN productos prod    ON pd.producto_id = prod.id
    WHERE p.estado IN ('listo', 'entregado')
    ORDER BY p.created_at ASC
  `);
  return groupByPedido(rows, ['total']);
}

export async function processPayment(
  id: string,
  metodo_pago: string,
  monto: number,
  usuario_id: number,
  io?: Server
): Promise<void> {
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
    io?.emit('pedido_pagado', { pedido_id: parseInt(id) });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
