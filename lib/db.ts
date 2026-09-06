import mysql, { Pool, PoolConnection } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __mysql_pool: Pool | undefined;
}

const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'globetrotter',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: ['DATE', 'DATETIME'] as Array<'DATE' | 'DATETIME'>,
  timezone: 'Z',
};

export const pool: Pool = globalThis.__mysql_pool || mysql.createPool(poolConfig);

if (process.env.NODE_ENV !== 'production') {
  globalThis.__mysql_pool = pool;
}

/** Run a query and return the rows. */
export async function q<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/** Run a query and return the first row, or null. */
export async function one<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows[0] ?? null;
}

/** Run a write and return the result header (insertId, affectedRows). */
export async function run(sql: string, params: any[] = []): Promise<any> {
  const [result] = await pool.query(sql, params);
  return result;
}

/** Run fn inside a transaction, rolling back on any error. */
export async function tx<T = any>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
