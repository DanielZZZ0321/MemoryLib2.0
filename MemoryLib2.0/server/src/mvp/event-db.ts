import { randomUUID } from "node:crypto";
import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import { pool, requirePool } from "../db/pool.js";
import { getSqliteRawDb } from "../db/sqlite-raw-source.js";

export type EventListItem = {
  id: string;
  title: string;
  summary: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  event_type: string | null;
  tags: string[];
  is_highlighted: boolean;
  created_at: string;
};

export type EventModuleDTO = {
  id: string;
  event_id: string;
  module_type: string;
  title: string | null;
  content: unknown;
  raw_source_ids: string[];
  sort_order: number;
};

export type EventDetail = EventListItem & { modules: EventModuleDTO[] };

function parseJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function parseModuleRow(r: {
  id: string;
  event_id: string;
  module_type: string;
  title: string | null;
  content: string;
  raw_source_ids: string;
  sort_order: number;
}): EventModuleDTO {
  return {
    id: r.id,
    event_id: r.event_id,
    module_type: r.module_type,
    title: r.title,
    content: JSON.parse(r.content || "{}") as unknown,
    raw_source_ids: parseJsonArray(r.raw_source_ids),
    sort_order: r.sort_order,
  };
}

export async function listEvents(
  page: number,
  pageSize: number,
): Promise<{ items: EventListItem[]; total: number }> {
  const offset = (page - 1) * pageSize;
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const total = (
      db.prepare(`SELECT count(*) AS c FROM event`).get() as { c: number }
    ).c;
    const rows = db
      .prepare(
        `SELECT * FROM event ORDER BY datetime(created_at) DESC LIMIT ? OFFSET ?`,
      )
      .all(pageSize, offset) as Array<{
      id: string;
      title: string;
      summary: string | null;
      start_time: string | null;
      end_time: string | null;
      location: string | null;
      event_type: string | null;
      tags: string;
      is_highlighted: number;
      created_at: string;
    }>;
    return {
      total,
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        summary: r.summary,
        start_time: r.start_time,
        end_time: r.end_time,
        location: r.location,
        event_type: r.event_type,
        tags: parseJsonArray(r.tags),
        is_highlighted: Boolean(r.is_highlighted),
        created_at: r.created_at,
      })),
    };
  }
  const p = requirePool();
  const count = await p.query<{ c: string }>(
    `SELECT count(*)::text AS c FROM event`,
  );
  const total = Number(count.rows[0]?.c ?? 0);
  const res = await p.query<{
    id: string;
    title: string;
    summary: string | null;
    start_time: Date | null;
    end_time: Date | null;
    location: string | null;
    event_type: string | null;
    tags: string[];
    is_highlighted: boolean;
    created_at: Date;
  }>(
    `SELECT id, title, summary, start_time, end_time, location, event_type, tags, is_highlighted, created_at
     FROM event ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [pageSize, offset],
  );
  return {
    total,
    items: res.rows.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      start_time: r.start_time?.toISOString() ?? null,
      end_time: r.end_time?.toISOString() ?? null,
      location: r.location,
      event_type: r.event_type,
      tags: r.tags ?? [],
      is_highlighted: r.is_highlighted,
      created_at:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
    })),
  };
}

export async function getEventById(id: string): Promise<EventDetail | null> {
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const r = db.prepare(`SELECT * FROM event WHERE id = ?`).get(id) as
      | {
          id: string;
          title: string;
          summary: string | null;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          event_type: string | null;
          tags: string;
          is_highlighted: number;
          created_at: string;
        }
      | undefined;
    if (!r) {
      return null;
    }
    const mods = db
      .prepare(
        `SELECT * FROM event_module WHERE event_id = ? ORDER BY sort_order ASC, created_at ASC`,
      )
      .all(id) as Array<{
      id: string;
      event_id: string;
      module_type: string;
      title: string | null;
      content: string;
      raw_source_ids: string;
      sort_order: number;
    }>;
    return {
      id: r.id,
      title: r.title,
      summary: r.summary,
      start_time: r.start_time,
      end_time: r.end_time,
      location: r.location,
      event_type: r.event_type,
      tags: parseJsonArray(r.tags),
      is_highlighted: Boolean(r.is_highlighted),
      created_at: r.created_at,
      modules: mods.map(parseModuleRow),
    };
  }
  const p = requirePool();
  const er = await p.query<{
    id: string;
    title: string;
    summary: string | null;
    start_time: Date | null;
    end_time: Date | null;
    location: string | null;
    event_type: string | null;
    tags: string[];
    is_highlighted: boolean;
    created_at: Date;
  }>(`SELECT * FROM event WHERE id = $1`, [id]);
  const row = er.rows[0];
  if (!row) {
    return null;
  }
  const mr = await p.query<{
    id: string;
    event_id: string;
    module_type: string;
    title: string | null;
    content: unknown;
    raw_source_ids: string[];
    sort_order: number;
  }>(
    `SELECT id, event_id, module_type, title, content, raw_source_ids, sort_order
     FROM event_module WHERE event_id = $1 ORDER BY sort_order ASC, created_at ASC`,
    [id],
  );
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    start_time: row.start_time?.toISOString() ?? null,
    end_time: row.end_time?.toISOString() ?? null,
    location: row.location,
    event_type: row.event_type,
    tags: row.tags ?? [],
    is_highlighted: row.is_highlighted,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
    modules: mr.rows.map((m) => ({
      id: m.id,
      event_id: m.event_id,
      module_type: m.module_type,
      title: m.title,
      content: m.content,
      raw_source_ids: m.raw_source_ids ?? [],
      sort_order: m.sort_order,
    })),
  };
}

export async function updateEvent(
  id: string,
  patch: Partial<{
    title: string;
    summary: string | null;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    event_type: string | null;
    tags: string[];
  }>,
): Promise<boolean> {
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const cur = db.prepare(`SELECT * FROM event WHERE id = ?`).get(id);
    if (!cur) {
      return false;
    }
    const c = cur as Record<string, unknown>;
    const title = patch.title ?? c.title;
    const summary = patch.summary !== undefined ? patch.summary : c.summary;
    const start_time =
      patch.start_time !== undefined ? patch.start_time : c.start_time;
    const end_time = patch.end_time !== undefined ? patch.end_time : c.end_time;
    const location = patch.location !== undefined ? patch.location : c.location;
    const event_type =
      patch.event_type !== undefined ? patch.event_type : c.event_type;
    const tags =
      patch.tags !== undefined
        ? JSON.stringify(patch.tags)
        : String(c.tags ?? "[]");
    db.prepare(
      `UPDATE event SET title=?, summary=?, start_time=?, end_time=?, location=?, event_type=?, tags=?, updated_at=datetime('now') WHERE id=?`,
    ).run(
      title,
      summary,
      start_time,
      end_time,
      location,
      event_type,
      tags,
      id,
    );
    return true;
  }
  const p = requirePool();
  const cur = await p.query(`SELECT * FROM event WHERE id = $1`, [id]);
  if (cur.rows.length === 0) {
    return false;
  }
  const row = cur.rows[0] as Record<string, unknown>;
  await p.query(
    `UPDATE event SET title=$2, summary=$3, start_time=$4, end_time=$5, location=$6, event_type=$7, tags=$8, updated_at=now()
     WHERE id=$1`,
    [
      id,
      patch.title ?? row.title,
      patch.summary !== undefined ? patch.summary : row.summary,
      patch.start_time !== undefined
        ? patch.start_time
        : row.start_time ?? null,
      patch.end_time !== undefined ? patch.end_time : row.end_time ?? null,
      patch.location !== undefined ? patch.location : row.location ?? null,
      patch.event_type !== undefined ? patch.event_type : row.event_type ?? null,
      patch.tags ?? (row.tags as string[]),
    ],
  );
  return true;
}

export async function setEventHighlight(
  id: string,
  is_highlighted: boolean,
): Promise<boolean> {
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const r = db
      .prepare(`UPDATE event SET is_highlighted=?, updated_at=datetime('now') WHERE id=?`)
      .run(is_highlighted ? 1 : 0, id);
    return r.changes > 0;
  }
  const p = requirePool();
  const r = await p.query(`UPDATE event SET is_highlighted=$2 WHERE id=$1`, [
    id,
    is_highlighted,
  ]);
  return r.rowCount !== null && r.rowCount > 0;
}

export async function addEventModule(
  eventId: string,
  input: {
    module_type: string;
    title?: string | null;
    content: unknown;
    raw_source_ids?: string[];
    sort_order?: number;
  },
): Promise<string | null> {
  const mid = randomUUID();
  const content = JSON.stringify(input.content ?? {});
  const rs = JSON.stringify(input.raw_source_ids ?? []);
  const ord = input.sort_order ?? 0;
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const ex = db.prepare(`SELECT 1 FROM event WHERE id=?`).get(eventId);
    if (!ex) {
      return null;
    }
    db.prepare(
      `INSERT INTO event_module (id, event_id, module_type, title, content, raw_source_ids, sort_order)
       VALUES (?,?,?,?,?,?,?)`,
    ).run(
      mid,
      eventId,
      input.module_type,
      input.title ?? null,
      content,
      rs,
      ord,
    );
    return mid;
  }
  const p = requirePool();
  const ex = await p.query(`SELECT 1 FROM event WHERE id=$1`, [eventId]);
  if (ex.rows.length === 0) {
    return null;
  }
  await p.query(
    `INSERT INTO event_module (id, event_id, module_type, title, content, raw_source_ids, sort_order)
     VALUES ($1,$2,$3::event_module_type,$4,$5::jsonb,$6::uuid[],$7)`,
    [
      mid,
      eventId,
      input.module_type,
      input.title ?? null,
      content,
      input.raw_source_ids ?? [],
      ord,
    ],
  );
  return mid;
}

export async function updateEventModule(
  eventId: string,
  moduleId: string,
  patch: Partial<{
    title: string | null;
    content: unknown;
    raw_source_ids: string[];
    sort_order: number;
  }>,
): Promise<boolean> {
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const cur = db
      .prepare(`SELECT * FROM event_module WHERE id=? AND event_id=?`)
      .get(moduleId, eventId) as
      | {
          title: string | null;
          content: string;
          raw_source_ids: string;
          sort_order: number;
        }
      | undefined;
    if (!cur) {
      return false;
    }
    const title = patch.title !== undefined ? patch.title : cur.title;
    const content =
      patch.content !== undefined
        ? JSON.stringify(patch.content)
        : cur.content;
    const rs =
      patch.raw_source_ids !== undefined
        ? JSON.stringify(patch.raw_source_ids)
        : cur.raw_source_ids;
    const ord =
      patch.sort_order !== undefined ? patch.sort_order : cur.sort_order;
    db.prepare(
      `UPDATE event_module SET title=?, content=?, raw_source_ids=?, sort_order=?, updated_at=datetime('now') WHERE id=? AND event_id=?`,
    ).run(title, content, rs, ord, moduleId, eventId);
    return true;
  }
  const p = requirePool();
  const cur = await p.query(
    `SELECT * FROM event_module WHERE id=$1 AND event_id=$2`,
    [moduleId, eventId],
  );
  if (cur.rows.length === 0) {
    return false;
  }
  const row = cur.rows[0] as Record<string, unknown>;
  await p.query(
    `UPDATE event_module SET title=$3, content=$4::jsonb, raw_source_ids=$5::uuid[], sort_order=$6 WHERE id=$1 AND event_id=$2`,
    [
      moduleId,
      eventId,
      patch.title !== undefined ? patch.title : row.title,
      patch.content !== undefined
        ? JSON.stringify(patch.content)
        : JSON.stringify(row.content),
      patch.raw_source_ids ?? (row.raw_source_ids as string[]),
      patch.sort_order ?? row.sort_order,
    ],
  );
  return true;
}

export async function deleteEventModule(
  eventId: string,
  moduleId: string,
): Promise<boolean> {
  if (isMemoriaDevLite()) {
    const r = getSqliteRawDb()
      .prepare(`DELETE FROM event_module WHERE id=? AND event_id=?`)
      .run(moduleId, eventId);
    return r.changes > 0;
  }
  const p = requirePool();
  const r = await p.query(
    `DELETE FROM event_module WHERE id=$1 AND event_id=$2`,
    [moduleId, eventId],
  );
  return r.rowCount !== null && r.rowCount > 0;
}

/** 按逻辑分组键查找已有事件（多 raw 归入同一记忆单元） */
export async function findEventIdByLogicalGroupKey(
  key: string,
): Promise<string | null> {
  const k = key.trim();
  if (!k) {
    return null;
  }
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const r = db
      .prepare(`SELECT id FROM event WHERE logical_group_key = ? LIMIT 1`)
      .get(k) as { id: string } | undefined;
    return r?.id ?? null;
  }
  if (!pool) {
    return null;
  }
  try {
    const r = await pool.query<{ id: string }>(
      `SELECT id FROM event WHERE logical_group_key = $1 LIMIT 1`,
      [k],
    );
    return r.rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function createEventWithModules(input: {
  title: string;
  summary?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  event_type?: string | null;
  tags?: string[];
  /** 同一批素材共享此键时归入同一事件（SQLite 已迁移列；Postgres 需自行加列） */
  logical_group_key?: string | null;
  modules: Array<{
    module_type: string;
    title?: string | null;
    content: unknown;
    raw_source_ids?: string[];
    sort_order?: number;
  }>;
}): Promise<string> {
  const id = randomUUID();
  const tags = JSON.stringify(input.tags ?? []);
  const lg = input.logical_group_key?.trim() || null;
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    db.prepare(
      `INSERT INTO event (id, title, summary, start_time, end_time, location, event_type, tags, logical_group_key)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      input.title,
      input.summary ?? null,
      input.start_time ?? null,
      input.end_time ?? null,
      input.location ?? null,
      input.event_type ?? null,
      tags,
      lg,
    );
    for (let i = 0; i < input.modules.length; i++) {
      const m = input.modules[i]!;
      const mid = randomUUID();
      db.prepare(
        `INSERT INTO event_module (id, event_id, module_type, title, content, raw_source_ids, sort_order)
         VALUES (?,?,?,?,?,?,?)`,
      ).run(
        mid,
        id,
        m.module_type,
        m.title ?? null,
        JSON.stringify(m.content ?? {}),
        JSON.stringify(m.raw_source_ids ?? []),
        m.sort_order ?? i,
      );
    }
    return id;
  }
  const p = requirePool();
  if (lg) {
    try {
      await p.query(
        `INSERT INTO event (id, title, summary, start_time, end_time, location, event_type, tags, logical_group_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          id,
          input.title,
          input.summary ?? null,
          input.start_time ?? null,
          input.end_time ?? null,
          input.location ?? null,
          input.event_type ?? null,
          input.tags ?? [],
          lg,
        ],
      );
    } catch {
      await p.query(
        `INSERT INTO event (id, title, summary, start_time, end_time, location, event_type, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          id,
          input.title,
          input.summary ?? null,
          input.start_time ?? null,
          input.end_time ?? null,
          input.location ?? null,
          input.event_type ?? null,
          input.tags ?? [],
        ],
      );
    }
  } else {
    await p.query(
      `INSERT INTO event (id, title, summary, start_time, end_time, location, event_type, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        id,
        input.title,
        input.summary ?? null,
        input.start_time ?? null,
        input.end_time ?? null,
        input.location ?? null,
        input.event_type ?? null,
        input.tags ?? [],
      ],
    );
  }
  for (let i = 0; i < input.modules.length; i++) {
    const m = input.modules[i]!;
    const mid = randomUUID();
    await p.query(
      `INSERT INTO event_module (id, event_id, module_type, title, content, raw_source_ids, sort_order)
       VALUES ($1,$2,$3::event_module_type,$4,$5::jsonb,$6::uuid[],$7)`,
      [
        mid,
        id,
        m.module_type,
        m.title ?? null,
        JSON.stringify(m.content ?? {}),
        m.raw_source_ids ?? [],
        m.sort_order ?? i,
      ],
    );
  }
  return id;
}

export async function searchEventsByText(
  q: string,
  limit = 20,
): Promise<EventListItem[]> {
  const term = `%${q.replace(/%/g, "\\%")}%`;
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const rows = db
      .prepare(
        `SELECT * FROM event WHERE title LIKE ? ESCAPE '\\' OR summary LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\'
         ORDER BY datetime(created_at) DESC LIMIT ?`,
      )
      .all(term, term, term, limit) as Array<{
      id: string;
      title: string;
      summary: string | null;
      start_time: string | null;
      end_time: string | null;
      location: string | null;
      event_type: string | null;
      tags: string;
      is_highlighted: number;
      created_at: string;
    }>;
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      start_time: r.start_time,
      end_time: r.end_time,
      location: r.location,
      event_type: r.event_type,
      tags: parseJsonArray(r.tags),
      is_highlighted: Boolean(r.is_highlighted),
      created_at: r.created_at,
    }));
  }
  const p = requirePool();
  const pattern = `%${q}%`;
  const res = await p.query<{
    id: string;
    title: string;
    summary: string | null;
    start_time: Date | null;
    end_time: Date | null;
    location: string | null;
    event_type: string | null;
    tags: string[];
    is_highlighted: boolean;
    created_at: Date;
  }>(
    `SELECT * FROM event WHERE title ILIKE $1 OR summary ILIKE $1
     OR COALESCE(array_to_string(tags, ','), '') ILIKE $1
     ORDER BY created_at DESC LIMIT $2`,
    [pattern, limit],
  );
  return res.rows.map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    start_time: r.start_time?.toISOString() ?? null,
    end_time: r.end_time?.toISOString() ?? null,
    location: r.location,
    event_type: r.event_type,
    tags: r.tags ?? [],
    is_highlighted: r.is_highlighted,
    created_at:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
  }));
}

export function isEventsBackendAvailable(): boolean {
  return isMemoriaDevLite() || Boolean(pool);
}
