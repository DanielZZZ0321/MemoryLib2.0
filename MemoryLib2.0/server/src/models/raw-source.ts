import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import {
  insertRawSourceSqlite,
  updateRawSourceHighlightsSqlite,
  updateRawSourceMetadataSqlite,
  updateRawSourceStatusSqlite,
} from "../db/sqlite-raw-source.js";
import { requirePool } from "../db/pool.js";
import type { ProcessingStatus, RawFileType } from "../types/raw-source.js";

export async function insertRawSource(params: {
  filePath: string;
  fileType: RawFileType;
  originalFilename: string;
  metadata: Record<string, unknown>;
}): Promise<string> {
  if (isMemoriaDevLite()) {
    return insertRawSourceSqlite(params);
  }
  const pool = requirePool();
  const res = await pool.query<{ id: string }>(
    `INSERT INTO raw_source (file_path, file_type, original_filename, metadata, processing_status)
     VALUES ($1, $2::raw_file_type, $3, $4::jsonb, 'pending')
     RETURNING id`,
    [
      params.filePath,
      params.fileType,
      params.originalFilename,
      JSON.stringify(params.metadata),
    ],
  );
  const id = res.rows[0]?.id;
  if (!id) {
    throw new Error("插入 raw_source 失败");
  }
  return id;
}

export async function updateRawSourceStatus(
  id: string,
  status: ProcessingStatus,
): Promise<void> {
  if (isMemoriaDevLite()) {
    updateRawSourceStatusSqlite(id, status);
    return;
  }
  const pool = requirePool();
  await pool.query(
    `UPDATE raw_source SET processing_status = $2::processing_status WHERE id = $1`,
    [id, status],
  );
}

export async function updateRawSourceHighlights(
  id: string,
  highlights: unknown,
): Promise<boolean> {
  const json = JSON.stringify(highlights ?? []);
  if (isMemoriaDevLite()) {
    return updateRawSourceHighlightsSqlite(id, json);
  }
  const pool = requirePool();
  const r = await pool.query(
    `UPDATE raw_source SET highlights = $2::jsonb WHERE id = $1`,
    [id, json],
  );
  return r.rowCount !== null && r.rowCount > 0;
}

export async function updateRawSourceMetadata(
  id: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const json = JSON.stringify(metadata);
  if (isMemoriaDevLite()) {
    updateRawSourceMetadataSqlite(id, json);
    return;
  }
  const pool = requirePool();
  await pool.query(
    `UPDATE raw_source SET metadata = $2::jsonb WHERE id = $1`,
    [id, json],
  );
}
