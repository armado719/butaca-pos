// server/src/services/pedidos.service.ts
import pool from "../db/connection";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Server } from "socket.io";
import type {
  ProductoItem,
  ClienteNuevoDTO,
  ActualizarEstadoDomicilioDTO,
} from "../schemas/pedidos.schema";
import { crearCliente } from "./clientes.service";

interface Usuario {
  id: number;
  nombre: string;
}

export async function createOrder(
  tipo: "mesa" | "domicilio",
  productos: ProductoItem[],
  observaciones: string,
  usuario: Usuario,
  io?: Server,
  opts?: {
    mesa_id?: number;
    cliente_id?: number;
    cliente_nuevo?: ClienteNuevoDTO;
    direccion_entrega?: string;
    costo_domicilio?: number;
  },
): Promise<{ pedido_id: number }> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let cliente_id = opts?.cliente_id ?? null;

    if (tipo === "domicilio" && !cliente_id && opts?.cliente_nuevo) {
      const { id } = await crearCliente(opts.cliente_nuevo);
      cliente_id = id;
    }

    const productosTotal = productos.reduce(
      (sum, p) => sum + p.precio * p.cantidad,
      0,
    );
    const costo_domicilio = opts?.costo_domicilio ?? 0;
    const total = productosTotal + costo_domicilio;

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO pedidos
        (tipo, mesa_id, cliente_id, direccion_entrega, costo_domicilio, estado_domicilio,
         usuario_id, estado, total, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)`,
      [
        tipo,
        opts?.mesa_id ?? null,
        cliente_id,
        opts?.direccion_entrega ?? null,
        costo_domicilio,
        tipo === "domicilio" ? "pendiente" : null,
        usuario.id,
        total,
        observaciones || "",
      ],
    );

    const pedido_id = result.insertId;

    for (const item of productos) {
      await conn.query(
        "INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario, subtotal, observaciones) VALUES (?, ?, ?, ?, ?, ?)",
        [
          pedido_id,
          item.id,
          item.cantidad,
          item.precio,
          item.precio * item.cantidad,
          item.observaciones || "",
        ],
      );
    }

    if (tipo === "mesa" && opts?.mesa_id) {
      await conn.query('UPDATE mesas SET estado = "ocupada" WHERE id = ?', [
        opts.mesa_id,
      ]);
    }

    await conn.commit();

    // Emitir con nombres de productos obtenidos de la BD
    if (io) {
      const [detalleRows] = await conn.query<RowDataPacket[]>(
        `SELECT pd.cantidad, pd.observaciones, prod.nombre
         FROM pedido_detalle pd
         JOIN productos prod ON pd.producto_id = prod.id
         WHERE pd.pedido_id = ?`,
        [pedido_id],
      );
      const [mesaRows] = await conn.query<RowDataPacket[]>(
        "SELECT numero FROM mesas WHERE id = ?",
        [opts?.mesa_id ?? 0],
      );
      io.emit("nueva_comanda", {
        id: pedido_id,
        tipo,
        mesa_id: opts?.mesa_id ?? null,
        mesa_numero: mesaRows[0]?.numero ?? null,
        mesero: usuario.nombre,
        productos: detalleRows.map((r) => ({
          nombre: r.nombre,
          cantidad: r.cantidad,
          observaciones: r.observaciones || "",
        })),
        observaciones,
        estado: "pendiente",
        created_at: new Date(),
      });
    }

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
  extraFields: (keyof T)[],
): any[] {
  const map = new Map<number, any>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      const base: any = {
        id: row.id,
        tipo: row.tipo,
        mesa_id: row.mesa_id,
        estado: row.estado,
        created_at: row.created_at,
        mesero: row.mesero,
        mesa_numero: row.mesa_numero,
        productos: [],
      };
      for (const f of extraFields) base[f as string] = row[f];
      map.set(row.id, base);
    }
    if (row.producto_nombre) {
      map.get(row.id).productos.push({
        nombre: row.producto_nombre,
        cantidad: row.cantidad,
        ...(row.subtotal !== undefined ? { subtotal: row.subtotal } : {}),
        ...(row.det_obs !== undefined ? { observaciones: row.det_obs } : {}),
      });
    }
  }
  return [...map.values()];
}

export async function getPendingOrders(): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.id, p.tipo, p.mesa_id, p.estado, p.observaciones, p.estado_domicilio, p.created_at,
           u.nombre AS mesero,
           m.numero AS mesa_numero,
           c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
           p.direccion_entrega,
           pd.cantidad, pd.observaciones AS det_obs, prod.nombre AS producto_nombre
    FROM pedidos p
    JOIN usuarios u              ON p.usuario_id   = u.id
    LEFT JOIN mesas m            ON p.mesa_id      = m.id
    LEFT JOIN clientes c         ON p.cliente_id   = c.id
    LEFT JOIN pedido_detalle pd  ON pd.pedido_id   = p.id
    LEFT JOIN productos prod     ON pd.producto_id = prod.id
    WHERE p.estado IN ('pendiente', 'en_cocina')
    ORDER BY p.created_at ASC
  `);
  return groupByPedido(rows, [
    "observaciones",
    "estado_domicilio",
    "cliente_nombre",
    "cliente_telefono",
    "direccion_entrega",
  ]);
}

export async function updateOrderStatus(
  id: string,
  estado: string,
  io?: Server,
): Promise<void> {
  await pool.query("UPDATE pedidos SET estado = ? WHERE id = ?", [estado, id]);
  io?.emit("pedido_actualizado", { id: parseInt(id), estado });
}

export async function getCashierOrders(): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.id, p.tipo, p.mesa_id, p.estado, p.total, p.costo_domicilio,
           p.estado_domicilio, p.created_at, p.direccion_entrega,
           u.nombre AS mesero,
           m.numero AS mesa_numero,
           c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
           pd.cantidad, pd.subtotal, prod.nombre AS producto_nombre
    FROM pedidos p
    JOIN usuarios u              ON p.usuario_id   = u.id
    LEFT JOIN mesas m            ON p.mesa_id      = m.id
    LEFT JOIN clientes c         ON p.cliente_id   = c.id
    LEFT JOIN pedido_detalle pd  ON pd.pedido_id   = p.id
    LEFT JOIN productos prod     ON pd.producto_id = prod.id
    WHERE p.estado IN ('listo', 'entregado')
    ORDER BY p.created_at ASC
  `);
  return groupByPedido(rows, [
    "total",
    "costo_domicilio",
    "estado_domicilio",
    "cliente_nombre",
    "cliente_telefono",
    "direccion_entrega",
  ]);
}

export async function updateDomicilioStatus(
  id: string,
  data: ActualizarEstadoDomicilioDTO,
  io?: Server,
): Promise<void> {
  await pool.query(
    "UPDATE pedidos SET estado_domicilio = ?, entregado_por = ? WHERE id = ?",
    [data.estado_domicilio, data.entregado_por ?? null, id],
  );
  io?.emit("domicilio_actualizado", {
    id: parseInt(id),
    estado_domicilio: data.estado_domicilio,
  });
}

export async function getDomiciliosActivos(): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT p.id, p.estado, p.estado_domicilio, p.total, p.costo_domicilio,
           p.direccion_entrega, p.created_at,
           u.nombre AS mesero,
           c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
           pd.cantidad, pd.subtotal, prod.nombre AS producto_nombre
    FROM pedidos p
    JOIN usuarios u              ON p.usuario_id   = u.id
    LEFT JOIN clientes c         ON p.cliente_id   = c.id
    LEFT JOIN pedido_detalle pd  ON pd.pedido_id   = p.id
    LEFT JOIN productos prod     ON pd.producto_id = prod.id
    WHERE p.tipo = 'domicilio'
      AND p.estado NOT IN ('pagado', 'cancelado')
    ORDER BY p.created_at ASC
  `);
  return groupByPedido(rows, [
    "total",
    "costo_domicilio",
    "estado_domicilio",
    "cliente_nombre",
    "cliente_telefono",
    "direccion_entrega",
  ]);
}

export async function transferirMesa(
  pedido_id: string,
  mesa_destino_id: number,
  io?: Server,
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [pedidos] = await conn.query<RowDataPacket[]>(
      'SELECT mesa_id, estado FROM pedidos WHERE id = ? AND tipo = "mesa"',
      [pedido_id],
    );
    if (pedidos.length === 0) {
      const err: any = new Error("Pedido no encontrado");
      err.statusCode = 404;
      throw err;
    }
    const { mesa_id: mesa_origen_id, estado } = pedidos[0];
    if (["pagado", "cancelado"].includes(estado)) {
      const err: any = new Error(
        "No se puede transferir un pedido pagado o cancelado",
      );
      err.statusCode = 400;
      throw err;
    }

    const [destino] = await conn.query<RowDataPacket[]>(
      "SELECT estado FROM mesas WHERE id = ?",
      [mesa_destino_id],
    );
    if (destino.length === 0) {
      const err: any = new Error("Mesa destino no encontrada");
      err.statusCode = 404;
      throw err;
    }
    if (destino[0].estado === "ocupada") {
      const err: any = new Error("La mesa destino está ocupada");
      err.statusCode = 400;
      throw err;
    }

    await conn.query("UPDATE pedidos SET mesa_id = ? WHERE id = ?", [
      mesa_destino_id,
      pedido_id,
    ]);
    await conn.query('UPDATE mesas SET estado = "disponible" WHERE id = ?', [
      mesa_origen_id,
    ]);
    await conn.query('UPDATE mesas SET estado = "ocupada" WHERE id = ?', [
      mesa_destino_id,
    ]);

    await conn.commit();
    io?.emit("mesa_transferida", {
      pedido_id: parseInt(pedido_id),
      mesa_origen_id,
      mesa_destino_id,
    });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function processPayment(
  id: string,
  metodo_pago: string,
  monto: number,
  usuario_id: number,
  io?: Server,
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "INSERT INTO pagos (pedido_id, usuario_id, monto, metodo_pago) VALUES (?, ?, ?, ?)",
      [id, usuario_id, monto, metodo_pago],
    );
    await conn.query('UPDATE pedidos SET estado = "pagado" WHERE id = ?', [id]);

    const [pedido] = await conn.query<RowDataPacket[]>(
      "SELECT tipo, mesa_id FROM pedidos WHERE id = ?",
      [id],
    );
    if (pedido.length > 0 && pedido[0].tipo === "mesa" && pedido[0].mesa_id) {
      await conn.query('UPDATE mesas SET estado = "disponible" WHERE id = ?', [
        pedido[0].mesa_id,
      ]);
    }

    await conn.commit();
    io?.emit("pedido_pagado", { pedido_id: parseInt(id) });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
