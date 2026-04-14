import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// ─── MESAS ──────────────────────────────────────────────────────────────────

export const getMesas = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM mesas ORDER BY numero ASC');
    res.json(rows);
  } catch { res.status(500).json({ msg: 'Error al obtener mesas' }); }
};

export const crearMesa = async (req: Request, res: Response): Promise<void> => {
  const { numero, capacidad } = req.body;
  if (!numero) { res.status(400).json({ msg: 'Número de mesa requerido' }); return; }
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO mesas (numero, capacidad) VALUES (?, ?)',
      [numero, capacidad || 4]
    );
    res.status(201).json({ id: result.insertId, numero, capacidad: capacidad || 4, estado: 'disponible' });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') { res.status(400).json({ msg: 'El número de mesa ya existe' }); return; }
    res.status(500).json({ msg: 'Error al crear mesa' });
  }
};

export const actualizarMesa = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { numero, capacidad, estado } = req.body;
  try {
    await pool.query(
      'UPDATE mesas SET numero = COALESCE(?, numero), capacidad = COALESCE(?, capacidad), estado = COALESCE(?, estado) WHERE id = ?',
      [numero ?? null, capacidad ?? null, estado ?? null, id]
    );
    res.json({ msg: 'Mesa actualizada' });
  } catch { res.status(500).json({ msg: 'Error al actualizar mesa' }); }
};

export const eliminarMesa = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM mesas WHERE id = ?', [id]);
    res.json({ msg: 'Mesa eliminada' });
  } catch { res.status(500).json({ msg: 'Error al eliminar mesa' }); }
};

// ─── CATEGORÍAS ──────────────────────────────────────────────────────────────

export const getCategorias = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM categorias ORDER BY nombre ASC');
    res.json(rows);
  } catch { res.status(500).json({ msg: 'Error al obtener categorías' }); }
};

// ─── PRODUCTOS ───────────────────────────────────────────────────────────────

export const getProductos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT p.*, c.nombre AS categoria_nombre
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      ORDER BY c.nombre, p.nombre ASC
    `);
    res.json(rows);
  } catch { res.status(500).json({ msg: 'Error al obtener productos' }); }
};

export const crearProducto = async (req: Request, res: Response): Promise<void> => {
  const { categoria_id, nombre, descripcion, precio } = req.body;
  if (!categoria_id || !nombre || !precio) {
    res.status(400).json({ msg: 'categoria_id, nombre y precio son requeridos' }); return;
  }
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO productos (categoria_id, nombre, descripcion, precio) VALUES (?, ?, ?, ?)',
      [categoria_id, nombre, descripcion || null, precio]
    );
    res.status(201).json({ id: result.insertId, categoria_id, nombre, disponible: 1 });
  } catch { res.status(500).json({ msg: 'Error al crear producto' }); }
};

export const actualizarProducto = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { categoria_id, nombre, descripcion, precio, disponible } = req.body;
  try {
    await pool.query(
      `UPDATE productos SET
        categoria_id = COALESCE(?, categoria_id),
        nombre       = COALESCE(?, nombre),
        descripcion  = COALESCE(?, descripcion),
        precio       = COALESCE(?, precio),
        disponible   = COALESCE(?, disponible)
       WHERE id = ?`,
      [categoria_id ?? null, nombre ?? null,
       descripcion !== undefined ? descripcion : null,
       precio ?? null, disponible !== undefined ? disponible : null, id]
    );
    res.json({ msg: 'Producto actualizado' });
  } catch { res.status(500).json({ msg: 'Error al actualizar producto' }); }
};

export const toggleProducto = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE productos SET disponible = NOT disponible WHERE id = ?', [id]);
    res.json({ msg: 'Disponibilidad actualizada' });
  } catch { res.status(500).json({ msg: 'Error al actualizar disponibilidad' }); }
};

// ─── USUARIOS ────────────────────────────────────────────────────────────────

export const getUsuarios = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY nombre ASC'
    );
    res.json(rows);
  } catch { res.status(500).json({ msg: 'Error al obtener usuarios' }); }
};

export const crearUsuario = async (req: Request, res: Response): Promise<void> => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password || !rol) {
    res.status(400).json({ msg: 'Todos los campos son requeridos' }); return;
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hash, rol]
    );
    res.status(201).json({ id: result.insertId, nombre, email, rol, activo: 1 });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') { res.status(400).json({ msg: 'El email ya está registrado' }); return; }
    res.status(500).json({ msg: 'Error al crear usuario' });
  }
};

export const actualizarUsuario = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nombre, email, password, rol, activo } = req.body;
  try {
    let hash: string | null = null;
    if (password) hash = await bcrypt.hash(password, 10);
    await pool.query(
      `UPDATE usuarios SET
        nombre   = COALESCE(?, nombre),
        email    = COALESCE(?, email),
        password = COALESCE(?, password),
        rol      = COALESCE(?, rol),
        activo   = COALESCE(?, activo)
       WHERE id = ?`,
      [nombre ?? null, email ?? null, hash, rol ?? null,
       activo !== undefined ? activo : null, id]
    );
    res.json({ msg: 'Usuario actualizado' });
  } catch { res.status(500).json({ msg: 'Error al actualizar usuario' }); }
};

export const toggleUsuario = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE usuarios SET activo = NOT activo WHERE id = ?', [id]);
    res.json({ msg: 'Estado actualizado' });
  } catch { res.status(500).json({ msg: 'Error al actualizar usuario' }); }
};
