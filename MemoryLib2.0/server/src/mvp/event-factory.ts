import { getRawSourceRowSqlite } from "../db/sqlite-raw-source.js";
import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import { requirePool } from "../db/pool.js";
import type { TimelineSegment } from "../types/video-timeline.js";
import {
  addEventModule,
  createEventWithModules,
  findEventIdByLogicalGroupKey,
  getEventById,
  updateEvent,
  updateEventModule,
} from "./event-db.js";

/** 上传 metadata.memoria：由元数据决定归入哪条记忆，而非「一文件一事件」 */
export type MemoriaDirective = {
  /** 追加到已有事件 */
  targetEventId?: string;
  /** 多文件共享同一键 → 同一事件；首条创建时写入 logical_group_key */
  eventGroupKey?: string;
  /** true：只完成 raw 入库，不生成/合并事件，留给后续 LLM/VLM 批量结构化 */
  deferEventExtraction?: boolean;
};

export type IngestNonVideoOutcome =
  | { kind: "deferred"; eventId: null }
  | { kind: "attached"; eventId: string }
  | { kind: "new_event"; eventId: string };

export function parseMemoriaDirective(
  metadata: Record<string, unknown>,
): MemoriaDirective {
  const raw = metadata.memoria;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const m = raw as Record<string, unknown>;
  const target =
    typeof m.targetEventId === "string" ? m.targetEventId.trim() : "";
  const group =
    typeof m.eventGroupKey === "string" ? m.eventGroupKey.trim() : "";
  return {
    targetEventId: target || undefined,
    eventGroupKey: group || undefined,
    deferEventExtraction:
      m.deferEventExtraction === true ||
      m.deferEventExtraction === "true" ||
      m.deferEventExtraction === 1,
  };
}

export function metaFromRaw(row: {
  metadata: string;
  original_filename: string;
  file_type: string;
}): {
  title: string;
  summary: string;
  tags: string[];
  location: string | null;
  eventType: string | null;
  memoria: MemoriaDirective;
} {
  let m: Record<string, unknown> = {};
  try {
    m = JSON.parse(row.metadata) as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  const descRaw =
    typeof m.description === "string" ? m.description.trim() : "";
  const aiTitle = typeof m.aiTitle === "string" ? m.aiTitle.trim() : "";
  const aiSummary = typeof m.aiSummary === "string" ? m.aiSummary.trim() : "";
  const aiTags = Array.isArray(m.aiTags) ? m.aiTags.map(String) : [];
  const baseTitle =
    aiTitle || row.original_filename?.trim() || "未命名素材";
  const title =
    (typeof m.eventType === "string" ? `${m.eventType} · ` : "") + baseTitle;
  const people = Array.isArray(m.people) ? m.people.map(String) : [];
  const tags = Array.isArray(m.tags) ? m.tags.map(String) : [];
  const location = typeof m.location === "string" ? m.location : null;
  const eventType = typeof m.eventType === "string" ? m.eventType : null;
  const summary =
    descRaw ||
    aiSummary ||
    `来自 ${row.file_type}：${row.original_filename}`;
  return {
    title: title.slice(0, 200),
    summary,
    tags: [...new Set([...people, ...tags, ...aiTags])],
    location,
    eventType,
    memoria: parseMemoriaDirective(m),
  };
}

export async function getRawRowAny(id: string): Promise<{
  metadata: string;
  original_filename: string;
  file_type: string;
} | null> {
  if (isMemoriaDevLite()) {
    const r = getRawSourceRowSqlite(id);
    return r ?? null;
  }
  const p = requirePool();
  const res = await p.query<{
    metadata: unknown;
    original_filename: string;
    file_type: string;
  }>(
    `SELECT metadata, original_filename, file_type::text FROM raw_source WHERE id = $1`,
    [id],
  );
  const row = res.rows[0];
  if (!row) {
    return null;
  }
  return {
    metadata: JSON.stringify(row.metadata ?? {}),
    original_filename: row.original_filename,
    file_type: row.file_type,
  };
}

function isPhotoLikeFileType(fileType: string): boolean {
  return (
    fileType === "photo" ||
    fileType === "document" ||
    fileType === "audio"
  );
}

/** 将非视频 raw 挂到已有事件：合并 photo_wall / 追加摘要 / 合并标签 */
export async function attachNonVideoRawToEvent(
  eventId: string,
  rawSourceId: string,
  objectKey: string,
  row: { original_filename: string; file_type: string; metadata: string },
): Promise<boolean> {
  const parsed = metaFromRaw(row);
  const ev = await getEventById(eventId);
  if (!ev) {
    return false;
  }

  if (isPhotoLikeFileType(row.file_type)) {
    const wall = ev.modules.find((x) => x.module_type === "photo_wall");
    if (wall) {
      const content = (wall.content ?? {}) as {
        images?: Array<{ objectKey: string; label?: string }>;
      };
      const images = [
        ...(content.images ?? []),
        { objectKey, label: row.original_filename },
      ];
      const rawIds = [...new Set([...wall.raw_source_ids, rawSourceId])];
      await updateEventModule(eventId, wall.id, {
        content: { ...content, images },
        raw_source_ids: rawIds,
      });
    } else {
      await addEventModule(eventId, {
        module_type: "photo_wall",
        title: "照片墙",
        content: {
          images: [{ objectKey, label: row.original_filename }],
        },
        raw_source_ids: [rawSourceId],
        sort_order: ev.modules.length,
      });
    }
  }

  const extra = `\n\n- ${row.original_filename}: ${parsed.summary}`;
  const sumMod = ev.modules.find((x) => x.module_type === "summary");
  if (sumMod) {
    const c = (sumMod.content ?? {}) as { markdown?: string };
    await updateEventModule(eventId, sumMod.id, {
      content: { markdown: (c.markdown ?? "") + extra },
    });
  } else {
    await addEventModule(eventId, {
      module_type: "summary",
      title: "简介",
      content: { markdown: parsed.summary },
      raw_source_ids: [rawSourceId],
      sort_order: ev.modules.length + 1,
    });
  }

  await updateEvent(eventId, {
    tags: [...new Set([...ev.tags, ...parsed.tags])],
  });
  return true;
}

function modulesForNewNonVideo(
  rawSourceId: string,
  objectKey: string,
  row: { original_filename: string; file_type: string },
  summary: string,
): Array<{
  module_type: string;
  title: string | null;
  content: unknown;
  raw_source_ids: string[];
  sort_order: number;
}> {
  const modules: Array<{
    module_type: string;
    title: string | null;
    content: unknown;
    raw_source_ids: string[];
    sort_order: number;
  }> = [];
  if (isPhotoLikeFileType(row.file_type)) {
    modules.push({
      module_type: "photo_wall",
      title: "照片墙",
      content: {
        images: [{ objectKey, label: row.original_filename }],
      },
      raw_source_ids: [rawSourceId],
      sort_order: 0,
    });
  }
  modules.push({
    module_type: "summary",
    title: "简介",
    content: { markdown: summary },
    raw_source_ids: [rawSourceId],
    sort_order: modules.length,
  });
  return modules;
}

/**
 * 非视频摄入：由 metadata.memoria 决定新建 / 并入已有 / 同组合并 / 仅入库待结构化
 */
export async function ingestNonVideoRawSource(
  rawSourceId: string,
  objectKey: string,
): Promise<IngestNonVideoOutcome> {
  const row = await getRawRowAny(rawSourceId);
  if (!row) {
    throw new Error("raw_source 不存在");
  }
  if (row.file_type === "video_fpv" || row.file_type === "screen_recording") {
    throw new Error("视频请走视频流水线");
  }

  const m = metaFromRaw(row);

  if (m.memoria.deferEventExtraction) {
    return { kind: "deferred", eventId: null };
  }

  if (m.memoria.targetEventId) {
    const ok = await attachNonVideoRawToEvent(
      m.memoria.targetEventId,
      rawSourceId,
      objectKey,
      row,
    );
    if (!ok) {
      throw new Error(`目标事件不存在：${m.memoria.targetEventId}`);
    }
    return { kind: "attached", eventId: m.memoria.targetEventId };
  }

  if (m.memoria.eventGroupKey) {
    const existing = await findEventIdByLogicalGroupKey(m.memoria.eventGroupKey);
    if (existing) {
      const ok = await attachNonVideoRawToEvent(
        existing,
        rawSourceId,
        objectKey,
        row,
      );
      if (!ok) {
        throw new Error("同组事件存在但附加失败");
      }
      return { kind: "attached", eventId: existing };
    }
    const eventId = await createEventWithModules({
      title: m.title,
      summary: m.summary,
      location: m.location,
      event_type: m.eventType,
      tags: m.tags,
      logical_group_key: m.memoria.eventGroupKey,
      modules: modulesForNewNonVideo(rawSourceId, objectKey, row, m.summary),
    });
    return { kind: "new_event", eventId };
  }

  const eventId = await createEventWithModules({
    title: m.title,
    summary: m.summary,
    location: m.location,
    event_type: m.eventType,
    tags: m.tags,
    modules: modulesForNewNonVideo(rawSourceId, objectKey, row, m.summary),
  });
  return { kind: "new_event", eventId };
}

/** @deprecated 请使用 ingestNonVideoRawSource */
export async function createEventForNonVideoRawSource(
  rawSourceId: string,
  objectKey: string,
): Promise<string | null> {
  const r = await ingestNonVideoRawSource(rawSourceId, objectKey);
  if (r.kind === "deferred") {
    return null;
  }
  return r.eventId;
}

/** 将已处理视频挂到已有事件 */
export async function attachVideoRawToEvent(
  eventId: string,
  rawSourceId: string,
  objectKey: string,
  timelineNote: string,
  row: { original_filename: string; file_type: string; metadata: string },
  segment?: TimelineSegment | null,
): Promise<boolean> {
  const parsed = metaFromRaw(row);
  const ev = await getEventById(eventId);
  if (!ev) {
    return false;
  }
  const note =
    segment?.summary?.trim() ||
    timelineNote.trim() ||
    parsed.summary;
  const videoContent: Record<string, unknown> = { objectKey };
  if (segment) {
    videoContent.startSec = segment.startSec;
    videoContent.endSec = segment.endSec;
  }
  const ord = ev.modules.length;
  await addEventModule(eventId, {
    module_type: "video",
    title: segment?.title?.trim()
      ? segment.title.slice(0, 120)
      : `视频 · ${row.original_filename}`,
    content: videoContent,
    raw_source_ids: [rawSourceId],
    sort_order: ord,
  });
  await addEventModule(eventId, {
    module_type: "summary",
    title: segment ? "片段摘要" : "时间线摘要",
    content: { markdown: note },
    raw_source_ids: [rawSourceId],
    sort_order: ord + 1,
  });
  const segTags = segment?.tags ?? [];
  await updateEvent(eventId, {
    tags: [...new Set([...ev.tags, ...parsed.tags, ...segTags])],
  });
  return true;
}

function rowFallback(): {
  original_filename: string;
  file_type: string;
  metadata: string;
} {
  return {
    original_filename: "video",
    file_type: "video_fpv",
    metadata: "{}",
  };
}

function modulesForVideoSegment(
  rawSourceId: string,
  objectKey: string,
  seg: TimelineSegment,
  sortBase: number,
): Array<{
  module_type: string;
  title: string;
  content: unknown;
  raw_source_ids: string[];
  sort_order: number;
}> {
  const vt = (seg.title?.trim() || "片段").slice(0, 120);
  return [
    {
      module_type: "video",
      title: vt,
      content: {
        objectKey,
        startSec: seg.startSec,
        endSec: seg.endSec,
      },
      raw_source_ids: [rawSourceId],
      sort_order: sortBase,
    },
    {
      module_type: "summary",
      title: "片段摘要",
      content: { markdown: seg.summary },
      raw_source_ids: [rawSourceId],
      sort_order: sortBase + 1,
    },
  ];
}

/** 视频处理完成后：按 memoria 分发 — 新建 / 附加 / 同组 / 仅完成入库 */
export async function dispatchVideoAfterProcessing(
  rawSourceId: string,
  objectKey: string,
  timelineNote: string,
  timelineSegments?: TimelineSegment[] | null,
): Promise<{ created: boolean; eventId: string | null }> {
  const row = await getRawRowAny(rawSourceId);
  const base = row
    ? metaFromRaw(row)
    : {
        title: "视频记忆",
        summary: "视频已处理",
        tags: [] as string[],
        location: null as string | null,
        eventType: null as string | null,
        memoria: {} as MemoriaDirective,
      };

  const segs =
    timelineSegments && timelineSegments.length > 0 ? timelineSegments : null;
  const r = row ?? rowFallback();

  if (base.memoria.deferEventExtraction) {
    return { created: false, eventId: null };
  }

  if (base.memoria.targetEventId) {
    if (segs) {
      for (const seg of segs) {
        const ok = await attachVideoRawToEvent(
          base.memoria.targetEventId,
          rawSourceId,
          objectKey,
          timelineNote,
          r,
          seg,
        );
        if (!ok) {
          throw new Error(`目标事件不存在：${base.memoria.targetEventId}`);
        }
      }
    } else {
      const ok = await attachVideoRawToEvent(
        base.memoria.targetEventId,
        rawSourceId,
        objectKey,
        timelineNote,
        r,
      );
      if (!ok) {
        throw new Error(`目标事件不存在：${base.memoria.targetEventId}`);
      }
    }
    return { created: false, eventId: base.memoria.targetEventId };
  }

  if (base.memoria.eventGroupKey) {
    const existing = await findEventIdByLogicalGroupKey(base.memoria.eventGroupKey);
    if (existing) {
      if (segs) {
        for (const seg of segs) {
          const ok = await attachVideoRawToEvent(
            existing,
            rawSourceId,
            objectKey,
            timelineNote,
            r,
            seg,
          );
          if (!ok) {
            throw new Error("同组事件存在但附加视频失败");
          }
        }
      } else {
        const ok = await attachVideoRawToEvent(
          existing,
          rawSourceId,
          objectKey,
          timelineNote,
          r,
        );
        if (!ok) {
          throw new Error("同组事件存在但附加视频失败");
        }
      }
      return { created: false, eventId: existing };
    }
    if (segs) {
      let firstId: string | null = null;
      for (const seg of segs) {
        const summary = seg.summary.trim() || base.summary;
        const tags = [...new Set([...base.tags, ...(seg.tags ?? [])])];
        const id = await createEventWithModules({
          title: seg.title.trim() || base.title,
          summary,
          location: base.location,
          event_type: base.eventType,
          tags,
          logical_group_key: base.memoria.eventGroupKey,
          modules: modulesForVideoSegment(rawSourceId, objectKey, seg, 0),
        });
        firstId ??= id;
      }
      return { created: true, eventId: firstId };
    }
    const summary =
      timelineNote.trim() || base.summary || "视频处理完成，详见模块。";
    const eventId = await createEventWithModules({
      title: base.title,
      summary,
      location: base.location,
      event_type: base.eventType,
      tags: base.tags,
      logical_group_key: base.memoria.eventGroupKey,
      modules: [
        {
          module_type: "video",
          title: "视频",
          content: { objectKey },
          raw_source_ids: [rawSourceId],
          sort_order: 0,
        },
        {
          module_type: "summary",
          title: "时间线摘要",
          content: { markdown: timelineNote || summary },
          raw_source_ids: [rawSourceId],
          sort_order: 1,
        },
      ],
    });
    return { created: true, eventId };
  }

  if (segs) {
    const groupKey = `ingest:${rawSourceId}`;
    let firstId: string | null = null;
    for (const seg of segs) {
      const summary = seg.summary.trim() || base.summary;
      const tags = [...new Set([...base.tags, ...(seg.tags ?? [])])];
      const id = await createEventWithModules({
        title: seg.title.trim() || base.title,
        summary,
        location: base.location,
        event_type: base.eventType,
        tags,
        logical_group_key: groupKey,
        modules: modulesForVideoSegment(rawSourceId, objectKey, seg, 0),
      });
      firstId ??= id;
    }
    return { created: true, eventId: firstId };
  }

  const eventId = await createEventAfterVideoProcessing(
    rawSourceId,
    objectKey,
    timelineNote,
  );
  return { created: true, eventId };
}

/** 视频处理完成后：一条 Event + 视频模块 + 时间线摘要（无 memoria 时的默认） */
export async function createEventAfterVideoProcessing(
  rawSourceId: string,
  objectKey: string,
  timelineNote: string,
): Promise<string> {
  const row = await getRawRowAny(rawSourceId);
  const base = row
    ? metaFromRaw(row)
    : {
        title: "视频记忆",
        summary: "视频已处理",
        tags: [] as string[],
        location: null as string | null,
        eventType: null as string | null,
        memoria: {} as MemoriaDirective,
      };
  const summary =
    timelineNote.trim() || base.summary || "视频处理完成，详见模块。";
  return createEventWithModules({
    title: base.title,
    summary,
    location: base.location,
    event_type: base.eventType,
    tags: base.tags,
    modules: [
      {
        module_type: "video",
        title: "视频",
        content: { objectKey },
        raw_source_ids: [rawSourceId],
        sort_order: 0,
      },
      {
        module_type: "summary",
        title: "时间线摘要",
        content: { markdown: timelineNote || summary },
        raw_source_ids: [rawSourceId],
        sort_order: 1,
      },
    ],
  });
}
