// server/src/services/clientes.service.ts
import pool from '../db/connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { CrearClienteDTO, ActualizarClienteDTO } from '../schemas/clientes.schema';

export async function buscarClientePorTelefono(telefono: string): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, nombre, telefono, direccion, notas FROM clientes WHERE telefono LIKE ? LIMIT 10',
    [`%${telefono}%`]
  );
  return rows;
}

export async function crearCliente(data: CrearClienteDTO): Promise<{ id: number }> {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO clientes (nombre, telefono, direccion, notas) VALUES (?, ?, ?, ?)',
    [data.nombre, data.telefono, data.direccion, data.notas ?? null]
  );
  return { id: result.insertId };
}

export async function actualizarCliente(id: number, data: ActualizarClienteDTO): Promise<void> {
  const campos: string[] = [];
  const valores: any[] = [];

  if (data.nombre    !== undefined) { campos.push('nombre = ?');    valores.push(data.nombre); }
  if (data.telefono  !== undefined) { campos.push('telefono = ?');  valores.push(data.telefono); }
  if (data.direccion !== undefined) { campos.push('direccion = ?'); valores.push(data.direccion); }
  if (data.notas     !== undefined) { campos.push('notas = ?');     valores.push(data.notas); }

  if (campos.length === 0) return;

  valores.push(id);
  await pool.query(`UPDATE clientes SET ${campos.join(', ')} WHERE id = ?`, valores);
}
