import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import { memoriaDataDir } from "../config/paths.js";
import type { ProcessingStatus, RawFileType } from "../types/raw-source.js";

let db: Database.Database | null = null;

export function getSqliteRawDb(): Database.Database {
  if (!isMemoriaDevLite()) {
    throw new Error("SQLite 仅在 MEMORIA_DEV_LITE=true 时可用");
  }
  if (!db) {
    const dir = memoriaDataDir();
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "memoria.sqlite");
    db = new Database(file);
    db.exec(`
      CREATE TABLE IF NOT EXISTS raw_source (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}',
        upload_time TEXT NOT NULL DEFAULT (datetime('now')),
        processing_status TEXT NOT NULL DEFAULT 'pending',
        highlights TEXT NOT NULL DEFAULT '[]'
      );
      CREATE TABLE IF NOT EXISTS event (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT,
        start_time TEXT,
        end_time TEXT,
        location TEXT,
        event_type TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        is_highlighted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS event_module (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
        module_type TEXT NOT NULL,
        title TEXT,
        content TEXT NOT NULL DEFAULT '{}',
        raw_source_ids TEXT NOT NULL DEFAULT '[]',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS keyword (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        dimension TEXT NOT NULL,
        weight REAL NOT NULL DEFAULT 1,
        generated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_name_dim ON keyword (name, dimension);
      CREATE TABLE IF NOT EXISTS keyword_event_relation (
        id TEXT PRIMARY KEY,
        keyword_id TEXT NOT NULL REFERENCES keyword(id) ON DELETE CASCADE,
        event_id TEXT NOT NULL REFERENCES event(id) ON DELETE CASCADE,
        relevance_score REAL,
        is_manually_added INTEGER NOT NULL DEFAULT 0,
        UNIQUE (keyword_id, event_id)
      );
      CREATE TABLE IF NOT EXISTS workspace (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        filter_criteria TEXT NOT NULL DEFAULT '{}',
        event_ids TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_event_created ON event (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_event_module_event ON event_module (event_id, sort_order);
    `);
    try {
      db.exec(`ALTER TABLE event ADD COLUMN logical_group_key TEXT`);
    } catch {
      /* 列已存在 */
    }
    try {
      db.exec(
        `CREATE INDEX IF NOT EXISTS idx_event_logical_group_key ON event (logical_group_key)`,
      );
    } catch {
      /* ignore */
    }
  }
  return db;
}

export function insertRawSourceSqlite(params: {
  filePath: string;
  fileType: RawFileType;
  originalFilename: string;
  metadata: Record<string, unknown>;
}): string {
  const id = randomUUID();
  getSqliteRawDb()
    .prepare(
      `INSERT INTO raw_source (id, file_path, file_type, original_filename, metadata, processing_status, highlights)
       VALUES (?, ?, ?, ?, ?, 'pending', '[]')`,
    )
    .run(
      id,
      params.filePath,
      params.fileType,
      params.originalFilename,
      JSON.stringify(params.metadata),
    );
  return id;
}

export function updateRawSourceStatusSqlite(
  id: string,
  status: ProcessingStatus,
): void {
  getSqliteRawDb()
    .prepare(`UPDATE raw_source SET processing_status = ? WHERE id = ?`)
    .run(status, id);
}

export function updateRawSourceHighlightsSqlite(
  id: string,
  highlightsJson: string,
): boolean {
  const r = getSqliteRawDb()
    .prepare(`UPDATE raw_source SET highlights = ? WHERE id = ?`)
    .run(highlightsJson, id);
  return r.changes > 0;
}

export function updateRawSourceMetadataSqlite(
  id: string,
  metadataJson: string,
): boolean {
  const r = getSqliteRawDb()
    .prepare(`UPDATE raw_source SET metadata = ? WHERE id = ?`)
    .run(metadataJson, id);
  return r.changes > 0;
}

export type RawSourceRow = {
  id: string;
  file_path: string;
  file_type: string;
  original_filename: string;
  metadata: string;
  upload_time: string;
  processing_status: string;
  highlights: string;
};

export function getRawSourceRowSqlite(
  id: string,
): RawSourceRow | undefined {
  return getSqliteRawDb()
    .prepare(`SELECT * FROM raw_source WHERE id = ?`)
    .get(id) as RawSourceRow | undefined;
}

export function listRawSourcesSqlite(
  page: number,
  pageSize: number,
): { rows: RawSourceRow[]; total: number } {
  const db = getSqliteRawDb();
  const total = (
    db.prepare(`SELECT count(*) AS c FROM raw_source`).get() as { c: number }
  ).c;
  const rows = db
    .prepare(
      `SELECT * FROM raw_source ORDER BY datetime(upload_time) DESC LIMIT ? OFFSET ?`,
    )
    .all(pageSize, (page - 1) * pageSize) as RawSourceRow[];
  return { rows, total };
}

export function deleteRawSourceSqlite(id: string): boolean {
  const r = getSqliteRawDb()
    .prepare(`DELETE FROM raw_source WHERE id = ?`)
    .run(id);
  return r.changes > 0;
}
