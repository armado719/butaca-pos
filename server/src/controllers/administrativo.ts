import { Request, Response } from 'express';
import pool from '../db/connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// ── EMPLEADOS ───────────────────────────────────────────────────────────────────

export const getEmpleados = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM empleados ORDER BY nombre ASC');
    res.json(rows);
  } catch { res.status(500).json({ msg: 'Error al obtener empleados' }); }
};

export const crearEmpleado = async (req: Request, res: Response): Promise<void> => {
  const {
    nombre, documento, cargo, salario_base, fecha_ingreso,
    telefono, direccion, fecha_nacimiento, banco, cuenta_bancaria,
  } = req.body;

  // Campos obligatorios
  if (!nombre || !documento || !cargo || salario_base === undefined || !fecha_ingreso) {
    res.status(400).json({
      msg: 'Campos obligatorios: nombre, documento, cargo, salario_base, fecha_ingreso',
    });
    return;
  }

  // Tipos y rangos
  const salario = Number(salario_base);
  if (!Number.isFinite(salario) || salario < 0) {
    res.status(400).json({ msg: 'salario_base debe ser un número mayor o igual a 0' });
    return;
  }

  const fechaIngreso = new Date(fecha_ingreso);
  if (isNaN(fechaIngreso.getTime())) {
    res.status(400).json({ msg: 'fecha_ingreso no es una fecha válida (formato esperado: YYYY-MM-DD)' });
    return;
  }

  if (fecha_nacimiento && isNaN(new Date(fecha_nacimiento).getTime())) {
    res.status(400).json({ msg: 'fecha_nacimiento no es una fecha válida (formato esperado: YYYY-MM-DD)' });
    return;
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO empleados
        (nombre, documento, cargo, salario_base, fecha_ingreso, telefono, direccion, fecha_nacimiento, banco, cuenta_bancaria)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(), documento.trim(), cargo.trim(), salario, fecha_ingreso,
        telefono?.trim() || null, direccion?.trim() || null,
        fecha_nacimiento || null, banco?.trim() || null, cuenta_bancaria?.trim() || null,
      ]
    );
    res.status(201).json({ id: result.insertId, nombre, documento, cargo, salario_base: salario, activo: true });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ msg: 'Ya existe un empleado con ese número de documento' });
      return;
    }
    res.status(500).json({ msg: 'Error al crear empleado' });
  }
};

export const actualizarEmpleado = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nombre, documento, cargo, salario_base, activo, telefono, direccion, fecha_nacimiento, banco, cuenta_bancaria } = req.body;
  try {
    await pool.query(
      'UPDATE empleados SET nombre=?, documento=?, cargo=?, salario_base=?, activo=?, telefono=?, direccion=?, fecha_nacimiento=?, banco=?, cuenta_bancaria=? WHERE id=?',
      [nombre, documento, cargo, salario_base, activo, telefono, direccion, fecha_nacimiento, banco, cuenta_bancaria, id]
    );
    res.json({ msg: 'Empleado actualizado' });
  } catch { res.status(500).json({ msg: 'Error al actualizar empleado' }); }
};

// ── EGRESOS ─────────────────────────────────────────────────────────────────────

export const getEgresos = async (req: Request, res: Response): Promise<void> => {
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
  } catch { res.status(500).json({ msg: 'Error al obtener egresos' }); }
};

export const crearEgreso = async (req: Request, res: Response): Promise<void> => {
  const { concepto, monto, categoria, empleado_id } = req.body;
  const usuario_id = (req as any).usuario.id;
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO egresos (concepto, monto, categoria, empleado_id, usuario_id) VALUES (?, ?, ?, ?, ?)',
      [concepto, monto, categoria, empleado_id || null, usuario_id]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch { res.status(500).json({ msg: 'Error al registrar egreso' }); }
};

export const actualizarEgreso = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { concepto, monto, categoria, empleado_id } = req.body;
  try {
    await pool.query(
      'UPDATE egresos SET concepto=?, monto=?, categoria=?, empleado_id=? WHERE id=?',
      [concepto, monto, categoria, empleado_id || null, id]
    );
    res.json({ msg: 'Egreso actualizado' });
  } catch { res.status(500).json({ msg: 'Error al actualizar egreso' }); }
};

export const eliminarEgreso = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM egresos WHERE id = ?', [id]);
    res.json({ msg: 'Egreso eliminado' });
  } catch { res.status(500).json({ msg: 'Error al eliminar egreso' }); }
};

// ── INSUMOS (INVENTARIO) ───────────────────────────────────────────────────

export const getInsumos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM insumos ORDER BY nombre ASC');
    res.json(rows);
  } catch { res.status(500).json({ msg: 'Error al obtener inventario' }); }
};

export const crearInsumo = async (req: Request, res: Response): Promise<void> => {
  const { nombre, unidad_medida, stock_minimo, precio_compra } = req.body;
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO insumos (nombre, unidad_medida, stock_minimo, precio_compra) VALUES (?, ?, ?, ?)',
      [nombre, unidad_medida, stock_minimo, precio_compra]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch { res.status(500).json({ msg: 'Error al crear insumo' }); }
};

export const actualizarStock = async (req: Request, res: Response): Promise<void> => {
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
  } catch { res.status(500).json({ msg: 'Error al actualizar stock' }); }
};

export const actualizarInsumo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nombre, unidad_medida, stock_minimo, precio_compra } = req.body;
  try {
    await pool.query(
      'UPDATE insumos SET nombre=?, unidad_medida=?, stock_minimo=?, precio_compra=? WHERE id=?',
      [nombre, unidad_medida, stock_minimo, precio_compra, id]
    );
    res.json({ msg: 'Insumo actualizado' });
  } catch { res.status(500).json({ msg: 'Error al actualizar insumo' }); }
};

export const eliminarInsumo = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM insumos WHERE id = ?', [id]);
    res.json({ msg: 'Insumo eliminado' });
  } catch { res.status(500).json({ msg: 'Error al eliminar insumo' }); }
};
