import pg from "pg";
import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";

const databaseUrl =
  isMemoriaDevLite() ? undefined : process.env.DATABASE_URL;

export const pool: pg.Pool | null = databaseUrl
  ? new pg.Pool({ connectionString: databaseUrl, max: 10 })
  : null;

export function requirePool(): pg.Pool {
  if (!pool) {
    throw new Error("DATABASE_URL 未配置");
  }
  return pool;
}

/** 上传等流程是否具备数据库后端（Postgres 或 Dev Lite 的 SQLite） */
export function isDatabaseReady(): boolean {
  return isMemoriaDevLite() || Boolean(pool);
}
