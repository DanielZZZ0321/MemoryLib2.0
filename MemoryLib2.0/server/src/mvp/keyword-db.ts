import { randomUUID } from "node:crypto";
import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import { pool, requirePool } from "../db/pool.js";
import { getSqliteRawDb } from "../db/sqlite-raw-source.js";
import { listEvents } from "./event-db.js";

export type GraphNode = {
  id: string;
  type: "keyword" | "event";
  name?: string;
  title?: string;
  dimension?: string;
  thumbUrl?: string | null;
  highlighted?: boolean;
};

export type GraphLink = { source: string; target: string };

export type KeywordWithEvents = {
  id: string;
  name: string;
  dimension: string;
  weight: number;
  events: Array<{ id: string; title: string; thumbUrl: string | null }>;
};

function thumbForEvent(eventId: string): string {
  return `/api/files/event-thumb?eventId=${encodeURIComponent(eventId)}`;
}

export async function listKeywordsWithEvents(
  dimension: "person" | "keyword",
): Promise<KeywordWithEvents[]> {
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const kws = db
      .prepare(`SELECT * FROM keyword WHERE dimension = ? ORDER BY weight DESC`)
      .all(dimension) as Array<{
      id: string;
      name: string;
      dimension: string;
      weight: number;
    }>;
    const out: KeywordWithEvents[] = [];
    for (const k of kws) {
      const rels = db
        .prepare(
          `SELECT e.id, e.title FROM keyword_event_relation r JOIN event e ON e.id = r.event_id WHERE r.keyword_id = ?`,
        )
        .all(k.id) as Array<{ id: string; title: string }>;
      const events = [];
      for (const e of rels) {
        events.push({
          id: e.id,
          title: e.title,
          thumbUrl: thumbForEvent(e.id),
        });
      }
      out.push({
        id: k.id,
        name: k.name,
        dimension: k.dimension,
        weight: k.weight,
        events,
      });
    }
    return out;
  }
  const p = requirePool();
  const kws = await p.query<{
    id: string;
    name: string;
    dimension: string;
    weight: number;
  }>(
    `SELECT id, name, dimension::text, weight FROM keyword WHERE dimension = $1::keyword_dimension ORDER BY weight DESC`,
    [dimension],
  );
  const out: KeywordWithEvents[] = [];
  for (const k of kws.rows) {
    const rels = await p.query<{ id: string; title: string }>(
      `SELECT e.id, e.title FROM keyword_event_relation r JOIN event e ON e.id = r.event_id WHERE r.keyword_id = $1`,
      [k.id],
    );
    const events = [];
    for (const e of rels.rows) {
      events.push({
        id: e.id,
        title: e.title,
        thumbUrl: thumbForEvent(e.id),
      });
    }
    out.push({
      id: k.id,
      name: k.name,
      dimension: k.dimension,
      weight: k.weight,
      events,
    });
  }
  return out;
}

export async function buildKeywordGraph(
  dimension: "person" | "keyword",
): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  const kws = await listKeywordsWithEvents(dimension);
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const eventSeen = new Set<string>();
  for (const k of kws) {
    nodes.push({
      id: `k:${k.id}`,
      type: "keyword",
      name: k.name,
      dimension: k.dimension,
    });
    for (const e of k.events) {
      if (!eventSeen.has(e.id)) {
        eventSeen.add(e.id);
        nodes.push({
          id: `e:${e.id}`,
          type: "event",
          title: e.title,
          thumbUrl: e.thumbUrl,
          highlighted: false,
        });
      }
      links.push({ source: `k:${k.id}`, target: `e:${e.id}` });
    }
  }
  for (const n of nodes) {
    if (n.type !== "event") {
      continue;
    }
    const eid = n.id.slice(2);
    const ev = await getEventHighlightSqliteOrPg(eid);
    n.highlighted = ev;
  }
  return { nodes, links };
}

async function getEventHighlightSqliteOrPg(eventId: string): Promise<boolean> {
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const r = db
      .prepare(`SELECT is_highlighted FROM event WHERE id=?`)
      .get(eventId) as { is_highlighted: number } | undefined;
    return Boolean(r?.is_highlighted);
  }
  const p = requirePool();
  const r = await p.query<{ is_highlighted: boolean }>(
    `SELECT is_highlighted FROM event WHERE id=$1`,
    [eventId],
  );
  return Boolean(r.rows[0]?.is_highlighted);
}

export async function clearAndInsertKeywords(
  dimension: "person" | "keyword",
  pairs: Array<{ name: string; eventIds: string[]; weight?: number }>,
): Promise<void> {
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const delRels = db.prepare(
      `DELETE FROM keyword_event_relation WHERE keyword_id IN (SELECT id FROM keyword WHERE dimension=?)`,
    );
    delRels.run(dimension);
    db.prepare(`DELETE FROM keyword WHERE dimension=?`).run(dimension);
    for (const p of pairs) {
      const kid = randomUUID();
      db.prepare(
        `INSERT INTO keyword (id, name, dimension, weight) VALUES (?,?,?,?)`,
      ).run(kid, p.name, dimension, p.weight ?? 1);
      for (const eid of p.eventIds) {
        const rid = randomUUID();
        db.prepare(
          `INSERT INTO keyword_event_relation (id, keyword_id, event_id, relevance_score, is_manually_added)
           VALUES (?,?,?,?,0)`,
        ).run(rid, kid, eid, 0.8);
      }
    }
    return;
  }
  const poolc = requirePool();
  await poolc.query(
    `DELETE FROM keyword_event_relation WHERE keyword_id IN (SELECT id FROM keyword WHERE dimension = $1::keyword_dimension)`,
    [dimension],
  );
  await poolc.query(
    `DELETE FROM keyword WHERE dimension = $1::keyword_dimension`,
    [dimension],
  );
  for (const p of pairs) {
    const kid = randomUUID();
    await poolc.query(
      `INSERT INTO keyword (id, name, dimension, weight) VALUES ($1,$2,$3::keyword_dimension,$4)`,
      [kid, p.name, dimension, p.weight ?? 1],
    );
    for (const eid of p.eventIds) {
      const rid = randomUUID();
      await poolc.query(
        `INSERT INTO keyword_event_relation (id, keyword_id, event_id, relevance_score, is_manually_added)
         VALUES ($1,$2,$3,$4,false)`,
        [rid, kid, eid, 0.8],
      );
    }
  }
}

export async function regenerateKeywordsHeuristic(
  dimension: "person" | "keyword",
): Promise<void> {
  const { items } = await listEvents(1, 500);
  if (dimension === "person") {
    const map = new Map<string, Set<string>>();
    for (const e of items) {
      for (const t of e.tags) {
        if (t.length < 2) {
          continue;
        }
        if (!map.has(t)) {
          map.set(t, new Set());
        }
        map.get(t)!.add(e.id);
      }
    }
    const pairs = [...map.entries()]
      .filter(([, s]) => s.size > 0)
      .slice(0, 8)
      .map(([name, ids]) => ({
        name,
        eventIds: [...ids],
        weight: ids.size,
      }));
    await clearAndInsertKeywords("person", pairs);
    return;
  }
  const freq = new Map<string, Set<string>>();
  for (const e of items) {
    const blob = `${e.title} ${e.summary ?? ""} ${e.tags.join(" ")}`;
    const words = blob
      .split(/[\s,，.;；]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2);
    const seen = new Set<string>();
    for (const w of words) {
      if (seen.has(w)) {
        continue;
      }
      seen.add(w);
      if (!freq.has(w)) {
        freq.set(w, new Set());
      }
      freq.get(w)!.add(e.id);
    }
  }
  const pairs = [...freq.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 6)
    .map(([name, ids]) => ({
      name,
      eventIds: [...ids],
      weight: ids.size,
    }));
  await clearAndInsertKeywords("keyword", pairs);
}

export async function regenerateKeywordsWithGemini(
  dimension: "person" | "keyword",
): Promise<void> {
  const { generateText, isGeminiConfigured } = await import(
    "../services/gemini-client.js"
  );
  if (!isGeminiConfigured()) {
    await regenerateKeywordsHeuristic(dimension);
    return;
  }
  const { items } = await listEvents(1, 80);
  if (items.length === 0) {
    await clearAndInsertKeywords(dimension, []);
    return;
  }
  const lines = items.map(
    (e) => `- id:${e.id} title:${e.title} tags:${e.tags.join(",")} summary:${(e.summary ?? "").slice(0, 120)}`,
  );
  const prompt =
    dimension === "person"
      ? `从下列事件中提取最多 6 个「人物/称呼」主题关键词（中文短语）。返回 JSON 数组：[{"name":"张三","eventIds":["uuid",...]},...] 仅 JSON，无其它文字。\n${lines.join("\n")}`
      : `从下列事件中提取 3～5 个记忆主题关键词（中文短语，如「家庭时光」「项目讨论」）。返回 JSON 数组：[{"name":"...","eventIds":["uuid",...]},...] 仅 JSON。\n${lines.join("\n")}`;
  const raw = await generateText({
    messages: [{ role: "user", content: prompt }],
    maxTokens: 1024,
    temperature: 0.2,
  });
  let parsed: Array<{ name?: string; eventIds?: string[] }> = [];
  try {
    const m = raw.match(/\[[\s\S]*\]/);
    parsed = JSON.parse(m?.[0] ?? raw) as typeof parsed;
  } catch {
    await regenerateKeywordsHeuristic(dimension);
    return;
  }
  const pairs = parsed
    .filter((x) => x.name && Array.isArray(x.eventIds))
    .map((x) => ({
      name: String(x.name),
      eventIds: (x.eventIds ?? []).filter((id) => items.some((i) => i.id === id)),
      weight: (x.eventIds ?? []).length,
    }));
  await clearAndInsertKeywords(dimension, pairs);
}

export async function addEventToKeyword(
  keywordId: string,
  eventId: string,
): Promise<boolean> {
  if (isMemoriaDevLite()) {
    const db = getSqliteRawDb();
    const rid = randomUUID();
    try {
      db.prepare(
        `INSERT INTO keyword_event_relation (id, keyword_id, event_id, relevance_score, is_manually_added)
         VALUES (?,?,?,?,1)`,
      ).run(rid, keywordId, eventId, 1);
      return true;
    } catch {
      return false;
    }
  }
  const p = requirePool();
  try {
    const rid = randomUUID();
    await p.query(
      `INSERT INTO keyword_event_relation (id, keyword_id, event_id, relevance_score, is_manually_added)
       VALUES ($1,$2,$3,$4,true)`,
      [rid, keywordId, eventId, 1],
    );
    return true;
  } catch {
    return false;
  }
}

export function isKeywordBackendAvailable(): boolean {
  return isMemoriaDevLite() || Boolean(pool);
}
