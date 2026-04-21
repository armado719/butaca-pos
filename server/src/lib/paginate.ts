import { RowDataPacket } from 'mysql2';
import pool from '../db/connection';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export function getPaginationParams(query: Record<string, any>): PaginationParams {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    total,
    page: params.page,
    totalPages: Math.ceil(total / params.limit),
    limit: params.limit,
  };
}

export async function countRows(table: string, where = ''): Promise<number> {
  const sql = `SELECT COUNT(*) AS total FROM \`${table}\` ${where}`;
  const [rows] = await pool.query<RowDataPacket[]>(sql);
  return rows[0].total as number;
}
