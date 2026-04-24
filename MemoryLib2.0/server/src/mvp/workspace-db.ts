import { randomUUID } from "node:crypto";
import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import { pool, requirePool } from "../db/pool.js";
import { getSqliteRawDb } from "../db/sqlite-raw-source.js";
import type { EventListItem } from "./event-db.js";
import { listEvents } from "./event-db.js";

export type WorkspaceRow = {
  id: string;
  name: string;
  description: string | null;
  filter_criteria: Record<string, unknown>;
  event_ids: string[];
  created_at: string;
  updated_at: string;
};

function parseCriteria(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function listWorkspaces(): Promise<WorkspaceRow[]> {
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const rows = db
      .prepare(`SELECT * FROM workspace ORDER BY datetime(updated_at) DESC`)
      .all() as Array<{
      id: string;
      name: string;
      description: string | null;
      filter_criteria: string;
      event_ids: string;
      created_at: string;
      updated_at: string;
    }>;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      filter_criteria: parseCriteria(r.filter_criteria),
      event_ids: JSON.parse(r.event_ids || "[]") as string[],
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }
  const p = requirePool();
  const res = await p.query<{
    id: string;
    name: string;
    description: string | null;
    filter_criteria: unknown;
    event_ids: string[];
    created_at: Date;
    updated_at: Date;
  }>(`SELECT * FROM workspace ORDER BY updated_at DESC`);
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    filter_criteria: (r.filter_criteria ?? {}) as Record<string, unknown>,
    event_ids: r.event_ids ?? [],
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  }));
}

export async function getWorkspace(id: string): Promise<WorkspaceRow | null> {
  const all = await listWorkspaces();
  return all.find((w) => w.id === id) ?? null;
}

export async function createWorkspace(input: {
  name: string;
  description?: string | null;
  filter_criteria?: Record<string, unknown>;
}): Promise<string> {
  const id = randomUUID();
  const fc = JSON.stringify(input.filter_criteria ?? {});
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const ids = await resolveEventIdsForFilter(input.filter_criteria ?? {});
    db.prepare(
      `INSERT INTO workspace (id, name, description, filter_criteria, event_ids)
       VALUES (?,?,?,?,?)`,
    ).run(
      id,
      input.name,
      input.description ?? null,
      fc,
      JSON.stringify(ids),
    );
    return id;
  }
  const p = requirePool();
  const ids = await resolveEventIdsForFilter(input.filter_criteria ?? {});
  await p.query(
    `INSERT INTO workspace (id, name, description, filter_criteria, event_ids)
     VALUES ($1,$2,$3,$4::jsonb,$5::uuid[])`,
    [
      id,
      input.name,
      input.description ?? null,
      input.filter_criteria ?? {},
      ids,
    ],
  );
  return id;
}

export async function updateWorkspace(
  id: string,
  patch: Partial<{
    name: string;
    description: string | null;
    filter_criteria: Record<string, unknown>;
  }>,
): Promise<boolean> {
  if (isMemoriaDevLite()) {
    const cur = await getWorkspace(id);
    if (!cur) {
      return false;
    }
    const name = patch.name ?? cur.name;
    const desc =
      patch.description !== undefined ? patch.description : cur.description;
    const fc =
      patch.filter_criteria !== undefined
        ? patch.filter_criteria
        : cur.filter_criteria;
    const fcStr = JSON.stringify(fc);
    const ids = await resolveEventIdsForFilter(fc);
    getSqliteRawDb()
      .prepare(
        `UPDATE workspace SET name=?, description=?, filter_criteria=?, event_ids=?, updated_at=datetime('now') WHERE id=?`,
      )
      .run(name, desc, fcStr, JSON.stringify(ids), id);
    return true;
  }
  const p = requirePool();
  const cur = await getWorkspace(id);
  if (!cur) {
    return false;
  }
  const fc = patch.filter_criteria ?? cur.filter_criteria;
  const ids = await resolveEventIdsForFilter(fc);
  await p.query(
    `UPDATE workspace SET name=$2, description=$3, filter_criteria=$4::jsonb, event_ids=$5::uuid[], updated_at=now() WHERE id=$1`,
    [
      id,
      patch.name ?? cur.name,
      patch.description !== undefined ? patch.description : cur.description,
      fc,
      ids,
    ],
  );
  return true;
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  if (isMemoriaDevLite()) {
    const r = getSqliteRawDb()
      .prepare(`DELETE FROM workspace WHERE id=?`)
      .run(id);
    return r.changes > 0;
  }
  const p = requirePool();
  const r = await p.query(`DELETE FROM workspace WHERE id=$1`, [id]);
  return r.rowCount !== null && r.rowCount > 0;
}

export async function resolveEventIdsForFilter(
  fc: Record<string, unknown>,
): Promise<string[]> {
  const seedSource =
    typeof fc.seedSource === "string" && fc.seedSource.trim()
      ? fc.seedSource.trim()
      : "";
  const text =
    typeof fc.text === "string" && fc.text.trim()
      ? fc.text.trim().toLowerCase()
      : "";
  const tag =
    typeof fc.tag === "string" && fc.tag.trim() ? fc.tag.trim() : "";
  const { items } = await listEvents(1, 500);
  let filtered: EventListItem[] = items;
  if (seedSource) {
    filtered = filtered.filter((e) => e.event_type === seedSource);
  }
  if (text) {
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(text) ||
        (e.summary ?? "").toLowerCase().includes(text),
    );
  }
  if (tag) {
    filtered = filtered.filter((e) =>
      e.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())),
    );
  }
  return filtered.map((e) => e.id);
}

export async function getWorkspaceEvents(
  workspaceId: string,
): Promise<EventListItem[]> {
  const w = await getWorkspace(workspaceId);
  if (!w) {
    return [];
  }
  const { items } = await listEvents(1, 500);
  const set = new Set(w.event_ids);
  const seedSource =
    typeof w.filter_criteria.seedSource === "string" &&
    w.filter_criteria.seedSource.trim()
      ? w.filter_criteria.seedSource.trim()
      : "";
  return items.filter(
    (e) => set.has(e.id) && (!seedSource || e.event_type === seedSource),
  );
}

export function isWorkspaceBackendAvailable(): boolean {
  return isMemoriaDevLite() || Boolean(pool);
}
