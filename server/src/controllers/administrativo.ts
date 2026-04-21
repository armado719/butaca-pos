import { Response, NextFunction } from 'express';
import pool from '../db/connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { CustomRequest } from '../middlewares/validateToken';
import { getPaginationParams, buildPaginatedResponse, countRows } from '../lib/paginate';

// ── EMPLEADOS ───────────────────────────────────────────────────────────────────

export const getEmpleados = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const params = getPaginationParams(req.query);
    const total  = await countRows('empleados');
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM empleados ORDER BY nombre ASC LIMIT ? OFFSET ?',
      [params.limit, params.offset]
    );
    res.json(buildPaginatedResponse(rows, total, params));
  } catch (error) { next(error); }
};

export const crearEmpleado = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const {
    nombre, documento, cargo, salario_base, fecha_ingreso,
    telefono, direccion, fecha_nacimiento, banco, cuenta_bancaria,
  } = req.body;
  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO empleados
        (nombre, documento, cargo, salario_base, fecha_ingreso, telefono, direccion, fecha_nacimiento, banco, cuenta_bancaria)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(), documento.trim(), cargo.trim(), salario_base, fecha_ingreso,
        telefono?.trim() || null, direccion?.trim() || null,
        fecha_nacimiento || null, banco?.trim() || null, cuenta_bancaria?.trim() || null,
      ]
    );
    res.status(201).json({ id: result.insertId, nombre, documento, cargo, salario_base, activo: true });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ msg: 'Ya existe un empleado con ese número de documento' });
      return;
    }
    next(err);
  }
};

export const actualizarEmpleado = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { nombre, documento, cargo, salario_base, activo, telefono, direccion, fecha_nacimiento, banco, cuenta_bancaria } = req.body;
  try {
    await pool.query(
      'UPDATE empleados SET nombre=?, documento=?, cargo=?, salario_base=?, activo=?, telefono=?, direccion=?, fecha_nacimiento=?, banco=?, cuenta_bancaria=? WHERE id=?',
      [nombre, documento, cargo, salario_base, activo, telefono, direccion, fecha_nacimiento, banco, cuenta_bancaria, id]
    );
    res.json({ msg: 'Empleado actualizado' });
  } catch (error) { next(error); }
};

// ── EGRESOS ─────────────────────────────────────────────────────────────────────

export const getEgresos = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fecha } = req.query;
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT e.*, emp.nombre as empleado_nombre, u.nombre as usuario_nombre
      FROM egresos e
      LEFT JOIN empleados emp ON e.empleado_id = emp.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE DATE(e.fecha) = ?
      ORDER BY e.fecha DESC
    `, [fecha || new Date().toISOString().split('T')[0]]);
    res.json(rows);
  } catch (error) { next(error); }
};

export const crearEgreso = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { concepto, monto, categoria, empleado_id } = req.body;
  const usuario_id = req.usuario!.id;
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO egresos (concepto, monto, categoria, empleado_id, usuario_id) VALUES (?, ?, ?, ?, ?)',
      [concepto, monto, categoria, empleado_id || null, usuario_id]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) { next(error); }
};

export const actualizarEgreso = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { concepto, monto, categoria, empleado_id } = req.body;
  try {
    await pool.query(
      'UPDATE egresos SET concepto=?, monto=?, categoria=?, empleado_id=? WHERE id=?',
      [concepto, monto, categoria, empleado_id || null, id]
    );
    res.json({ msg: 'Egreso actualizado' });
  } catch (error) { next(error); }
};

export const eliminarEgreso = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM egresos WHERE id = ?', [id]);
    res.json({ msg: 'Egreso eliminado' });
  } catch (error) { next(error); }
};

// ── INSUMOS ────────────────────────────────────────────────────────────────────

export const getInsumos = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const params = getPaginationParams(req.query);
    const total  = await countRows('insumos');
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM insumos ORDER BY nombre ASC LIMIT ? OFFSET ?',
      [params.limit, params.offset]
    );
    res.json(buildPaginatedResponse(rows, total, params));
  } catch (error) { next(error); }
};

export const crearInsumo = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { nombre, unidad_medida, stock_minimo, precio_compra } = req.body;
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO insumos (nombre, unidad_medida, stock_minimo, precio_compra) VALUES (?, ?, ?, ?)',
      [nombre, unidad_medida, stock_minimo, precio_compra]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) { next(error); }
};

export const actualizarStock = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { cantidad } = req.body;
  const delta = Number(cantidad);
  if (!Number.isFinite(delta) || delta === 0) {
    res.status(400).json({ msg: 'cantidad debe ser un número distinto de cero (positivo para entrada, negativo para salida)' });
    return;
  }
  try {
    await pool.query('UPDATE insumos SET stock_actual = stock_actual + ? WHERE id = ?', [delta, id]);
    res.json({ msg: 'Stock actualizado' });
  } catch (error) { next(error); }
};

export const actualizarInsumo = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { nombre, unidad_medida, stock_minimo, precio_compra } = req.body;
  try {
    await pool.query(
      'UPDATE insumos SET nombre=?, unidad_medida=?, stock_minimo=?, precio_compra=? WHERE id=?',
      [nombre, unidad_medida, stock_minimo, precio_compra, id]
    );
    res.json({ msg: 'Insumo actualizado' });
  } catch (error) { next(error); }
};

export const eliminarInsumo = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM insumos WHERE id = ?', [id]);
    res.json({ msg: 'Insumo eliminado' });
  } catch (error) { next(error); }
};
