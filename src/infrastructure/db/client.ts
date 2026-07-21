import { Pool } from "pg";

let pool: Pool | null = null;

export function getDb(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está definido en el entorno");
  }

  pool = new Pool({ connectionString });
  return pool;
}
