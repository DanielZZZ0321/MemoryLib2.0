import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import { requirePool } from "../db/pool.js";
import { updateRawSourceMetadata } from "../models/raw-source.js";
import {
  deleteRawSourceSqlite,
  getRawSourceRowSqlite,
  listRawSourcesSqlite,
  type RawSourceRow,
} from "../db/sqlite-raw-source.js";
import { deleteObject } from "../services/storage.js";
import { enqueueVideoProcessing } from "../services/queue.js";

export type RawSourceDTO = {
  id: string;
  file_path: string;
  file_type: string;
  original_filename: string;
  metadata: Record<string, unknown>;
  upload_time: string;
  processing_status: string;
  highlights: unknown[];
};

function parseHighlightsField(raw: string): unknown[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function mapRow(r: RawSourceRow): RawSourceDTO {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = JSON.parse(r.metadata) as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  return {
    id: r.id,
    file_path: r.file_path,
    file_type: r.file_type,
    original_filename: r.original_filename,
    metadata,
    upload_time: r.upload_time,
    processing_status: r.processing_status,
    highlights: parseHighlightsField(r.highlights),
  };
}

export async function listRawSources(
  page: number,
  pageSize: number,
): Promise<{ items: RawSourceDTO[]; total: number }> {
  if (isMemoriaDevLite()) {
    const { rows, total } = listRawSourcesSqlite(page, pageSize);
    return { items: rows.map(mapRow), total };
  }
  const p = requirePool();
  const c = await p.query<{ n: string }>(
    `SELECT count(*)::text AS n FROM raw_source`,
  );
  const total = Number(c.rows[0]?.n ?? 0);
  const off = (page - 1) * pageSize;
  const res = await p.query<{
    id: string;
    file_path: string;
    file_type: string;
    original_filename: string;
    metadata: unknown;
    upload_time: Date;
    processing_status: string;
    highlights: unknown;
  }>(
    `SELECT id, file_path, file_type::text, original_filename, metadata, upload_time, processing_status::text, highlights
     FROM raw_source ORDER BY upload_time DESC LIMIT $1 OFFSET $2`,
    [pageSize, off],
  );
  return {
    total,
    items: res.rows.map((r) => ({
      id: r.id,
      file_path: r.file_path,
      file_type: r.file_type,
      original_filename: r.original_filename,
      metadata: (r.metadata ?? {}) as Record<string, unknown>,
      upload_time: r.upload_time.toISOString(),
      processing_status: r.processing_status,
      highlights: Array.isArray(r.highlights) ? r.highlights : [],
    })),
  };
}

export async function getRawSource(id: string): Promise<RawSourceDTO | null> {
  if (isMemoriaDevLite()) {
    const r = getRawSourceRowSqlite(id);
    return r ? mapRow(r) : null;
  }
  const p = requirePool();
  const res = await p.query<{
    id: string;
    file_path: string;
    file_type: string;
    original_filename: string;
    metadata: unknown;
    upload_time: Date;
    processing_status: string;
    highlights: unknown;
  }>(
    `SELECT id, file_path, file_type::text, original_filename, metadata, upload_time, processing_status::text, highlights
     FROM raw_source WHERE id = $1`,
    [id],
  );
  const r = res.rows[0];
  if (!r) {
    return null;
  }
  return {
    id: r.id,
    file_path: r.file_path,
    file_type: r.file_type,
    original_filename: r.original_filename,
    metadata: (r.metadata ?? {}) as Record<string, unknown>,
    upload_time: r.upload_time.toISOString(),
    processing_status: r.processing_status,
    highlights: Array.isArray(r.highlights) ? r.highlights : [],
  };
}

export async function deleteRawSource(id: string): Promise<boolean> {
  const row = await getRawSource(id);
  if (!row) {
    return false;
  }
  await deleteObject(row.file_path);
  if (isMemoriaDevLite()) {
    return deleteRawSourceSqlite(id);
  }
  const p = requirePool();
  const r = await p.query(`DELETE FROM raw_source WHERE id = $1`, [id]);
  return r.rowCount !== null && r.rowCount > 0;
}

/** 合并写入 raw_source.metadata（读当前 DTO 再更新） */
export async function mergeIntoRawSourceMetadata(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const row = await getRawSource(id);
  if (!row) {
    return;
  }
  await updateRawSourceMetadata(id, { ...row.metadata, ...patch });
}

export async function reprocessRawSource(id: string): Promise<boolean> {
  const row = await getRawSource(id);
  if (!row) {
    return false;
  }
  const isVideo =
    row.file_type === "video_fpv" || row.file_type === "screen_recording";
  if (isMemoriaDevLite()) {
    const { updateRawSourceStatus } = await import("../models/raw-source.js");
    await updateRawSourceStatus(id, "pending");
  } else {
    const p = requirePool();
    await p.query(
      `UPDATE raw_source SET processing_status = 'pending'::processing_status WHERE id = $1`,
      [id],
    );
  }
  if (isVideo) {
    await enqueueVideoProcessing({
      rawSourceId: id,
      objectKey: row.file_path,
    });
  }
  return true;
}
