import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import os from "node:os";
import {
  insertRawSource,
  updateRawSourceHighlights,
  updateRawSourceMetadata,
  updateRawSourceStatus,
} from "../models/raw-source.js";
import { enqueueVideoProcessing, getVideoQueueCounts, isRedisConfigured } from "../services/queue.js";
import { ensureBucketExists, isStorageConfigured, putObjectFromFile } from "../services/storage.js";
import type { UploadMetadata } from "../types/raw-source.js";
import { inferRawFileType, isVideoRawType } from "../utils/file-type.js";
import { isDatabaseReady } from "../db/pool.js";
import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import { ingestNonVideoRawSource } from "../mvp/event-factory.js";
import {
  deleteRawSource,
  getRawSource,
  listRawSources,
  reprocessRawSource,
} from "../mvp/raw-source-mvp.js";
import { tryEnrichPhotoObjectKey } from "../services/media-enrichment.js";
import { sendInternalError } from "../utils/http-error-map.js";
import {
  deleteSeedDataset,
  exportSeedDataset,
  importSeedDataset,
  listAvailableSeedFiles,
  listImportedSeedDatasets,
  readSeedFile,
  type SeedDataset,
} from "../services/seed-dataset.js";

export const adminRouter = Router();

const maxMb = Number(process.env.VIDEO_MAX_SIZE_MB ?? "500");
const maxBytes = Number.isFinite(maxMb) && maxMb > 0 ? maxMb * 1024 * 1024 : 500 * 1024 * 1024;

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, file, cb) => {
      const safe = path.basename(file.originalname).replace(/[^\w.\-()+]/g, "_");
      cb(null, `${randomUUID()}-${safe}`);
    },
  }),
  limits: { fileSize: maxBytes },
});

function safeKeySegment(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, 180) || "file";
}

function parseMetadataField(raw: unknown, fileCount: number): UploadMetadata[] {
  if (fileCount === 0) {
    return [];
  }
  if (raw === undefined || raw === null || raw === "") {
    return Array.from({ length: fileCount }, () => ({}));
  }
  if (typeof raw !== "string") {
    throw new Error("metadata 须为 JSON 字符串");
  }
  const parsed: unknown = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    if (parsed.length !== fileCount) {
      throw new Error("metadata 数组长度须与上传文件数量一致");
    }
    return parsed as UploadMetadata[];
  }
  if (typeof parsed === "object" && parsed !== null) {
    const one = parsed as UploadMetadata;
    return Array.from({ length: fileCount }, () => ({ ...one }));
  }
  throw new Error("metadata 须为对象或对象数组的 JSON");
}

adminRouter.post("/upload", upload.array("files", 30), async (req, res, next) => {
  try {
    if (!isStorageConfigured()) {
      res.status(503).json({ error: "storage_not_configured" });
      return;
    }
    if (!isDatabaseReady()) {
      res.status(503).json({ error: "database_not_configured" });
      return;
    }

    const files = req.files;
    if (!files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: "no_files", message: "请使用字段名 files 上传至少一个文件" });
      return;
    }

    let metas: UploadMetadata[];
    try {
      metas = parseMetadataField(req.body?.metadata, files.length);
    } catch (e) {
      for (const f of files) {
        await unlink(f.path).catch(() => {});
      }
      res.status(400).json({
        error: "invalid_metadata",
        message: e instanceof Error ? e.message : String(e),
      });
      return;
    }

    await ensureBucketExists();

    const inferred = files.map((file, i) =>
      inferRawFileType(file.mimetype, file.originalname, metas[i] ?? {}),
    );
    if (
      inferred.some((t) => isVideoRawType(t)) &&
      !isRedisConfigured() &&
      !isMemoriaDevLite()
    ) {
      for (const f of files) {
        await unlink(f.path).catch(() => {});
      }
      res.status(503).json({
        error: "redis_required_for_video",
        message: "视频上传需要 REDIS_URL 与 worker 以投递处理队列",
      });
      return;
    }

    const results: { sourceId: string; objectKey: string; fileType: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const meta = metas[i] ?? {};
      const fileType = inferred[i]!;

      const sourceFolder = randomUUID();
      const objectKey = `sources/${sourceFolder}/${safeKeySegment(file.originalname)}`;

      try {
        await putObjectFromFile({
          key: objectKey,
          filePath: file.path,
          contentType: file.mimetype || undefined,
        });

        const metadataRecord: Record<string, unknown> = {
          ...meta,
          originalMimeType: file.mimetype,
          size: file.size,
        };

        const sourceId = await insertRawSource({
          filePath: objectKey,
          fileType,
          originalFilename: file.originalname,
          metadata: metadataRecord,
        });

        if (isVideoRawType(fileType)) {
          await enqueueVideoProcessing({ rawSourceId: sourceId, objectKey });
        } else {
          try {
            let metaForRow: Record<string, unknown> = metadataRecord;
            if (fileType === "photo") {
              const patch = await tryEnrichPhotoObjectKey(
                objectKey,
                file.mimetype || undefined,
              );
              if (patch) {
                metaForRow = { ...metadataRecord, ...patch };
                await updateRawSourceMetadata(sourceId, metaForRow);
              }
            }
            await ingestNonVideoRawSource(sourceId, objectKey);
            await updateRawSourceStatus(sourceId, "completed");
          } catch (evErr) {
            console.error("[admin/upload] ingestNonVideoRawSource", evErr);
          }
        }

        results.push({ sourceId, objectKey, fileType });
      } finally {
        await unlink(file.path).catch(() => {});
      }
    }

    res.status(201).json({
      ok: true,
      sources: results,
      sourceId: results[0]?.sourceId,
    });
  } catch (e) {
    if (!res.headersSent) {
      console.error("[admin/upload]", e);
      sendInternalError(res, e);
      return;
    }
    next(e);
  }
});

adminRouter.get("/sources", async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      res.status(503).json({ error: "database_not_configured" });
      return;
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const { items, total } = await listRawSources(page, pageSize);
    res.json({ items, page, pageSize, total });
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/sources/:id/highlights", async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      res.status(503).json({ error: "database_not_configured" });
      return;
    }
    const body = req.body as { highlights?: unknown };
    if (!body || !Array.isArray(body.highlights)) {
      res.status(400).json({
        error: "invalid_body",
        message: "需要 JSON：{ highlights: 数组 }",
      });
      return;
    }
    const ok = await updateRawSourceHighlights(req.params.id, body.highlights);
    if (!ok) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    res.json({ ok: true, id: req.params.id });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/sources/:id", async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      res.status(503).json({ error: "database_not_configured" });
      return;
    }
    const row = await getRawSource(req.params.id);
    if (!row) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    res.json(row);
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/sources/:id", async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      res.status(503).json({ error: "database_not_configured" });
      return;
    }
    const ok = await deleteRawSource(req.params.id);
    if (!ok) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/sources/:id/reprocess", async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      res.status(503).json({ error: "database_not_configured" });
      return;
    }
    const ok = await reprocessRawSource(req.params.id);
    if (!ok) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    res.json({ ok: true, id: req.params.id });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/queue/status", async (_req, res) => {
  try {
    if (!isRedisConfigured() && !isMemoriaDevLite()) {
      res.json({ videoProcessing: null, message: "REDIS_URL 未配置" });
      return;
    }
    const counts = await getVideoQueueCounts();
    res.json({ videoProcessing: counts });
  } catch (e) {
    res.status(503).json({
      error: "queue_unavailable",
      message: e instanceof Error ? e.message : String(e),
    });
  }
});

adminRouter.get("/datasets", async (_req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      res.status(503).json({ error: "database_not_configured" });
      return;
    }
    const [available, imported] = await Promise.all([
      listAvailableSeedFiles(),
      listImportedSeedDatasets(),
    ]);
    res.json({ available, imported });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/datasets/import", async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      res.status(503).json({ error: "database_not_configured" });
      return;
    }
    const body = req.body as { seedPath?: string; seed?: SeedDataset };
    const seed = body.seedPath ? await readSeedFile(body.seedPath) : body.seed;
    if (!seed) {
      res.status(400).json({
        error: "invalid_body",
        message: "Expected seedPath or seed",
      });
      return;
    }
    const result = await importSeedDataset(seed);
    res.status(201).json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/datasets/:seedSource/export", async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      res.status(503).json({ error: "database_not_configured" });
      return;
    }
    const seed = await exportSeedDataset(req.params.seedSource);
    if (!seed) {
      res.status(404).json({ error: "not_found", seedSource: req.params.seedSource });
      return;
    }
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${req.params.seedSource}.json"`,
    );
    res.json(seed);
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/datasets/:seedSource", async (req, res, next) => {
  try {
    if (!isDatabaseReady()) {
      res.status(503).json({ error: "database_not_configured" });
      return;
    }
    const deletedEvents = await deleteSeedDataset(req.params.seedSource);
    res.json({ ok: true, seedSource: req.params.seedSource, deletedEvents });
  } catch (e) {
    next(e);
  }
});
