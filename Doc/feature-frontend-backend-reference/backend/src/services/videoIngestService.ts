import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { db } from '../db/database';

export type ThemeNode = { id: string; label: string; score: number };
export type ThemeEdge = { source: string; target: string; weight: number };
export type ThemeLayout = Record<string, { x: number; y: number }>;

export interface TimelineEvent {
  start_sec: number;
  end_sec: number;
  title: string;
  summary: string;
  activity_type?: string;
  environment?: string;
}

export interface IngestResult {
  videoId: string;
  cardId: string;
  createdEvents: number;
  createdThemes: number;
  graph: { nodes: ThemeNode[]; edges: ThemeEdge[]; layout: ThemeLayout };
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function getUserId(reqUser: unknown): number | null {
  const u = reqUser as { userId?: unknown };
  return typeof u?.userId === 'number' ? u.userId : null;
}

function runVideoTimelineAnalysis(videoPath: string): { ok: true; events: TimelineEvent[]; raw: unknown } | { ok: false; error: string } {
  const apiKey = process.env.AIHUBMIX_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_AiHubMix_api_key_here') return { ok: false, error: '鏈厤缃?AIHUBMIX_API_KEY' };

  const scriptPath = path.join(__dirname, '../../scripts/video_analysis.py');
  if (!fs.existsSync(scriptPath)) return { ok: false, error: '瑙嗛鍒嗘瀽鑴氭湰涓嶅瓨鍦? };

  const result = spawnSync('python3', [scriptPath, videoPath, '--timeline'], {
    env: { ...process.env, AIHUBMIX_API_KEY: apiKey },
    encoding: 'utf-8',
    timeout: 300000,
  });
  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  if (stderr) console.warn('[video_timeline_analysis] stderr:', stderr);

  try {
    const json = JSON.parse(stdout || '{}') as { success?: boolean; error?: string; events?: TimelineEvent[] };
    if (!json.success) return { ok: false, error: json.error || '鍒嗘瀽澶辫触' };
    const events = Array.isArray(json.events) ? json.events : [];
    return { ok: true, events, raw: json };
  } catch {
    return { ok: false, error: stdout || stderr || '瑙ｆ瀽鍒嗘瀽缁撴灉澶辫触' };
  }
}

async function extractThemesWithLLM(
  timeline: TimelineEvent[],
  topN: number
): Promise<Array<{ name: string; score: number; eventIndices: number[] }>> {
  const cfg = {
    key: process.env.AIHUBMIX_API_KEY?.trim(),
    baseUrl: (process.env.AIHUBMIX_BASE_URL || 'https://aihubmix.com').replace(/\/$/, ''),
    appCode: process.env.AIHUBMIX_APP_CODE || '',
    model: process.env.AIHUBMIX_CHAT_MODEL || 'gpt-4o-mini',
  };
  if (!cfg.key || cfg.key === 'your_AiHubMix_api_key_here') {
    // Fallback: naive themes from titles
    const words = timeline
      .flatMap((e) => e.title.split(/[\s,.;:锛屻€傦紱锛?|]+/g))
      .map((w) => w.trim())
      .filter((w) => w.length >= 2)
      .slice(0, 200);
    const freq = new Map<string, number>();
    for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
    const themes = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([name, c], i) => ({ name, score: c, eventIndices: [i].filter((x) => x < timeline.length) }));
    return themes;
  }

  const url = `${cfg.baseUrl}/v1/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cfg.key}`,
  };
  if (cfg.appCode) headers['APP-Code'] = cfg.appCode;

  const compact = timeline.map((e, i) => ({
    i,
    start_sec: e.start_sec,
    end_sec: e.end_sec,
    title: e.title,
    summary: e.summary,
  }));

  const system = [
    'You are a precise video timeline organizer.',
    `Given timeline events, produce exactly ${topN} themes.`,
    'Return ONLY valid JSON: an array of objects with {name:string, score:number (0-1), eventIndices:number[]} .',
    'eventIndices must reference the provided event indices.',
  ].join('\n');
  const user = `Timeline events JSON:\n${JSON.stringify(compact).slice(0, 12000)}`;

  const body = {
    model: cfg.model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.2,
  };

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = (await resp.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = data.choices?.[0]?.message?.content || '';

  try {
    const parsed = JSON.parse(text) as Array<{ name: string; score: number; eventIndices: number[] }>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t.name === 'string' && Array.isArray(t.eventIndices))
      .slice(0, topN)
      .map((t) => ({
        name: t.name.trim().slice(0, 80),
        score: typeof t.score === 'number' ? t.score : 0.5,
        eventIndices: t.eventIndices.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n >= 0 && n < timeline.length),
      }));
  } catch {
    return [];
  }
}

function buildSixNodeLayout(nodeIds: string[]): ThemeLayout {
  // Fixed template (roughly hex-like). Frontend can rescale.
  const coords = [
    { x: 0, y: -140 },
    { x: 120, y: -60 },
    { x: 120, y: 80 },
    { x: 0, y: 160 },
    { x: -120, y: 80 },
    { x: -120, y: -60 },
  ];
  const layout: ThemeLayout = {};
  nodeIds.slice(0, 6).forEach((id, i) => {
    layout[id] = coords[i] || { x: 0, y: 0 };
  });
  return layout;
}

function buildEdgesFromThemes(
  themeIds: string[],
  themeEventSets: Array<Set<number>>
): ThemeEdge[] {
  const edges: ThemeEdge[] = [];
  for (let i = 0; i < themeIds.length; i++) {
    for (let j = i + 1; j < themeIds.length; j++) {
      const a = themeEventSets[i];
      const b = themeEventSets[j];
      let inter = 0;
      for (const x of a) if (b.has(x)) inter++;
      if (inter > 0) edges.push({ source: themeIds[i], target: themeIds[j], weight: inter });
    }
  }
  return edges;
}

export async function ingestUploadedVideoToGlobalMemory(opts: {
  reqUser: unknown;
  filename: string;
  size?: number;
  cardTitle?: string;
  topThemes?: number;
  timelineEvents?: TimelineEvent[];
}): Promise<{ ok: true; result: IngestResult } | { ok: false; error: string }> {
  const userId = getUserId(opts.reqUser);
  if (!userId) return { ok: false, error: 'Invalid user context' };

  const uploadsDir = path.join(__dirname, '../../uploads');
  const videoPath = path.join(uploadsDir, opts.filename);
  if (!fs.existsSync(videoPath)) return { ok: false, error: 'Video file not found in uploads' };

  const videoId = id('vid');
  const cardId = id('card');

  const timelineRaw = Array.isArray(opts.timelineEvents) ? { ok: true as const, events: opts.timelineEvents, raw: { injected: true } } : runVideoTimelineAnalysis(videoPath);
  if (!timelineRaw.ok) return { ok: false, error: timelineRaw.error };
  const timeline = (timelineRaw.events || []).filter((e) => Number.isFinite(e.start_sec) && Number.isFinite(e.end_sec));
  if (timeline.length === 0) return { ok: false, error: 'Timeline is empty' };

  const topN = Math.max(1, Math.min(12, Number(opts.topThemes || 6)));
  const themes = await extractThemesWithLLM(timeline, Math.min(6, topN));
  const ensuredThemes =
    themes.length > 0
      ? themes.slice(0, Math.min(6, topN))
      : [{ name: 'Video', score: 1, eventIndices: timeline.map((_e, i) => i).slice(0, 50) }];

  const insertVideo = db.prepare(
    `INSERT INTO videos (id, user_id, source_type, source_ref, filename, size, metadata_json)
     VALUES (@id, @user_id, @source_type, @source_ref, @filename, @size, @metadata_json)`
  );
  const insertSegment = db.prepare(
    `INSERT INTO video_segments (id, video_id, start_ms, end_ms, summary, tags_json, raw_json)
     VALUES (@id, @video_id, @start_ms, @end_ms, @summary, @tags_json, @raw_json)`
  );
  const insertEvent = db.prepare(
    `INSERT INTO events_global (id, user_id, video_id, start_ms, end_ms, title, summary, tags_json, media_refs_json)
     VALUES (@id, @user_id, @video_id, @start_ms, @end_ms, @title, @summary, @tags_json, @media_refs_json)`
  );
  const insertTheme = db.prepare(`INSERT INTO themes (id, user_id, name, score) VALUES (@id, @user_id, @name, @score)`);
  const insertThemeEvent = db.prepare(
    `INSERT OR REPLACE INTO theme_event (theme_id, event_id, weight) VALUES (@theme_id, @event_id, @weight)`
  );
  const insertCard = db.prepare(`INSERT INTO cards (id, user_id, title, config_json) VALUES (@id, @user_id, @title, @config_json)`);
  const insertCardGraph = db.prepare(
    `INSERT INTO card_graph (card_id, nodes_json, edges_json, layout_json) VALUES (@card_id, @nodes_json, @edges_json, @layout_json)`
  );
  const insertCardEvent = db.prepare(`INSERT OR REPLACE INTO card_event (card_id, event_id) VALUES (@card_id, @event_id)`);

  const tx = db.transaction(() => {
    insertVideo.run({
      id: videoId,
      user_id: userId,
      source_type: 'upload',
      source_ref: videoPath,
      filename: opts.filename,
      size: opts.size ?? null,
      metadata_json: JSON.stringify({ timeline_raw: timelineRaw.raw }),
    });

    const eventIds: string[] = [];
    for (const e of timeline) {
      const start_ms = Math.max(0, Math.floor(e.start_sec * 1000));
      const end_ms = Math.max(start_ms, Math.floor(e.end_sec * 1000));
      const segmentId = id('seg');
      insertSegment.run({
        id: segmentId,
        video_id: videoId,
        start_ms,
        end_ms,
        summary: e.summary || '',
        tags_json: JSON.stringify([e.activity_type, e.environment].filter(Boolean)),
        raw_json: JSON.stringify(e),
      });

      const eventId = id('evt');
      eventIds.push(eventId);
      insertEvent.run({
        id: eventId,
        user_id: userId,
        video_id: videoId,
        start_ms,
        end_ms,
        title: (e.title || '').trim().slice(0, 120) || `Event ${eventIds.length}`,
        summary: (e.summary || '').trim(),
        tags_json: JSON.stringify([e.activity_type, e.environment].filter(Boolean)),
        media_refs_json: JSON.stringify([{ type: 'video', video_id: videoId, start_ms, end_ms, filename: opts.filename }]),
      });
    }

    const cardTitle = (opts.cardTitle || '').trim().slice(0, 120) || `Video card (${opts.filename})`;
    insertCard.run({ id: cardId, user_id: userId, title: cardTitle, config_json: JSON.stringify({ topThemes: ensuredThemes.length }) });
    for (const evId of eventIds) insertCardEvent.run({ card_id: cardId, event_id: evId });

    const themeNodes: ThemeNode[] = [];
    const themeIds: string[] = [];
    const themeEventSets: Array<Set<number>> = [];
    for (const t of ensuredThemes) {
      const themeId = id('theme');
      themeIds.push(themeId);
      themeNodes.push({ id: themeId, label: t.name, score: t.score });
      themeEventSets.push(new Set(t.eventIndices));
      insertTheme.run({ id: themeId, user_id: userId, name: t.name, score: t.score });

      // Link to events by index
      for (const idx of t.eventIndices) {
        const evId = eventIds[idx];
        if (evId) insertThemeEvent.run({ theme_id: themeId, event_id: evId, weight: 1 });
      }
    }

    const edges = buildEdgesFromThemes(themeIds, themeEventSets);
    const layout = buildSixNodeLayout(themeIds);
    insertCardGraph.run({
      card_id: cardId,
      nodes_json: JSON.stringify(themeNodes),
      edges_json: JSON.stringify(edges),
      layout_json: JSON.stringify(layout),
    });

    return { eventIds, themeNodes, edges, layout };
  });

  try {
    const out = tx();
    return {
      ok: true,
      result: {
        videoId,
        cardId,
        createdEvents: timeline.length,
        createdThemes: ensuredThemes.length,
        graph: { nodes: out.themeNodes, edges: out.edges, layout: out.layout },
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ingest failed';
    return { ok: false, error: msg };
  }
}

