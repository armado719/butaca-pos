import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'butaca_pos',
    multipleStatements: true,
  });
}

async function ensureMigrationsTable(conn: mysql.Connection) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getApplied(conn: mysql.Connection): Promise<Set<string>> {
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    'SELECT filename FROM schema_migrations'
  );
  return new Set(rows.map((r) => r.filename));
}

async function run() {
  const conn = await getConnection();
  try {
    await ensureMigrationsTable(conn);
    const applied = await getApplied(conn);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('Base de datos al día. No hay migraciones pendientes.');
      return;
    }

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`Aplicando migración: ${file}...`);
      await conn.query(sql);
      await conn.execute('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
      console.log(`  ✔ ${file}`);
    }

    console.log(`\n${pending.length} migración(es) aplicada(s) correctamente.`);
  } catch (err) {
    console.error('Error al ejecutar migraciones:', err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
