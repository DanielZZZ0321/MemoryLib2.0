import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requirePool } from "../db/pool.js";
import type { RawFileType } from "../types/raw-source.js";

export type SeedPoster = {
  title: string;
  subtitle?: string;
  accent: string;
  background: string;
  icon?: string;
};

export type SeedMedia = {
  id: string;
  type: "photo" | "video" | "audio" | "document";
  title: string;
  url: string;
  caption?: string | null;
  durationSec?: number | null;
  poster?: SeedPoster;
};

export type SeedEvent = {
  id: string;
  title: string;
  summary?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  tags?: string[];
  keywords?: string[];
  layout?: Record<string, unknown>;
  poster: SeedPoster;
  media?: SeedMedia[];
};

export type SeedKeyword = {
  id: string;
  label: string;
  weight?: number;
  color?: string;
};

export type SeedDataset = {
  schemaVersion: number;
  seedSource: string;
  workspace: { name: string; description?: string | null };
  keywords?: SeedKeyword[];
  events: SeedEvent[];
};

export type ImportedDatasetRow = {
  id: string;
  seedSource: string;
  name: string;
  description: string | null;
  events: number;
  updated_at: string;
};

export type AvailableSeedFile = {
  name: string;
  path: string;
  seedSource: string;
  workspaceName: string;
  events: number;
  media: number;
};

export function seedDataDir(): string {
  const serviceDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(serviceDir, "../../..", "data", "seed");
}

function rawTypeForMedia(media: SeedMedia): RawFileType {
  if (media.type === "photo") {
    return "photo";
  }
  if (media.type === "video") {
    return "video_fpv";
  }
  if (media.type === "audio") {
    return "audio";
  }
  return "document";
}

function moduleTypeForMedia(mediaType: SeedMedia["type"]): string {
  if (mediaType === "photo") {
    return "photo_wall";
  }
  if (mediaType === "document") {
    return "file";
  }
  return mediaType;
}

function filenameForMedia(media: SeedMedia): string {
  const parsed = media.url.startsWith("http")
    ? new URL(media.url).pathname
    : media.url;
  const base = path.basename(parsed) || media.id;
  if (path.extname(base)) {
    return base;
  }
  const ext =
    media.type === "photo"
      ? ".jpg"
      : media.type === "video"
        ? ".mp4"
        : media.type === "audio"
          ? ".mp3"
          : ".md";
  return `${base}${ext}`;
}

function contentForModule(
  moduleType: string,
  medias: SeedMedia[],
  eventPoster: SeedPoster,
): Record<string, unknown> {
  if (moduleType === "photo_wall") {
    return {
      poster: medias[0]?.poster ?? eventPoster,
      images: medias.map((media) => ({
        assetId: media.id,
        title: media.title,
        url: media.url,
        caption: media.caption ?? null,
        poster: media.poster ?? eventPoster,
      })),
    };
  }
  if (moduleType === "video") {
    return {
      poster: medias[0]?.poster ?? eventPoster,
      videos: medias,
      startSec: 0,
    };
  }
  if (moduleType === "audio") {
    return { tracks: medias };
  }
  return { files: medias };
}

function validateSeed(seed: SeedDataset): void {
  if (!seed.seedSource || !seed.workspace?.name || !Array.isArray(seed.events)) {
    throw new Error("Invalid seed dataset: expected seedSource, workspace.name, events[]");
  }
}

export async function readSeedFile(seedPath: string): Promise<SeedDataset> {
  const root = seedDataDir();
  const candidates = [path.resolve(root, seedPath), path.resolve(process.cwd(), seedPath)];
  const resolved = candidates.find(
    (candidate) => candidate === root || candidate.startsWith(root + path.sep),
  );
  if (!resolved) {
    throw new Error("Seed path must stay inside data/seed");
  }
  const seed = JSON.parse(await readFile(resolved, "utf8")) as SeedDataset;
  validateSeed(seed);
  return seed;
}

export async function listAvailableSeedFiles(): Promise<AvailableSeedFile[]> {
  const dir = seedDataDir();
  const names = await readdir(dir).catch(() => []);
  const out: AvailableSeedFile[] = [];
  for (const name of names) {
    if (!name.endsWith(".json") || name.includes("manifest")) {
      continue;
    }
    try {
      const seed = await readSeedFile(name);
      out.push({
        name,
        path: name,
        seedSource: seed.seedSource,
        workspaceName: seed.workspace.name,
        events: seed.events.length,
        media: seed.events.reduce((sum, event) => sum + (event.media?.length ?? 0), 0),
      });
    } catch {
      /* ignore invalid seed files */
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listImportedSeedDatasets(): Promise<ImportedDatasetRow[]> {
  const pool = requirePool();
  const res = await pool.query<{
    id: string;
    name: string;
    description: string | null;
    filter_criteria: { seedSource?: string } | null;
    event_ids: string[] | null;
    updated_at: Date;
  }>(
    `SELECT id, name, description, filter_criteria, event_ids, updated_at
     FROM workspace
     WHERE filter_criteria ? 'seedSource'
     ORDER BY updated_at DESC`,
  );
  return res.rows
    .map((row) => ({
      id: row.id,
      seedSource: row.filter_criteria?.seedSource ?? "",
      name: row.name,
      description: row.description,
      events: row.event_ids?.length ?? 0,
      updated_at: row.updated_at.toISOString(),
    }))
    .filter((row) => row.seedSource);
}

export async function deleteSeedDataset(seedSource: string): Promise<number> {
  const pool = requirePool();
  await pool.query("BEGIN");
  try {
    const events = await pool.query<{ id: string }>(
      `SELECT id FROM event WHERE event_type = $1`,
      [seedSource],
    );
    const eventIds = events.rows.map((row) => row.id);
    await pool.query(`DELETE FROM workspace WHERE filter_criteria ->> 'seedSource' = $1`, [
      seedSource,
    ]);
    if (eventIds.length > 0) {
      await pool.query(`DELETE FROM keyword_event_relation WHERE event_id = ANY($1::uuid[])`, [
        eventIds,
      ]);
      await pool.query(`DELETE FROM event_module WHERE event_id = ANY($1::uuid[])`, [
        eventIds,
      ]);
      await pool.query(`DELETE FROM event WHERE id = ANY($1::uuid[])`, [eventIds]);
    }
    await pool.query(`DELETE FROM raw_source WHERE metadata ->> 'seedSource' = $1`, [
      seedSource,
    ]);
    await pool.query(
      `DELETE FROM keyword
       WHERE name LIKE $1
         AND id NOT IN (SELECT keyword_id FROM keyword_event_relation)`,
      [`[seed:${seedSource}] %`],
    );
    await pool.query("COMMIT");
    return eventIds.length;
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function importSeedDataset(seed: SeedDataset): Promise<{
  seedSource: string;
  workspace: string;
  events: number;
}> {
  validateSeed(seed);
  await deleteSeedDataset(seed.seedSource);

  const pool = requirePool();
  await pool.query("BEGIN");
  try {
    const eventIdBySeedId = new Map<string, string>();
    const rawIdsByMediaId = new Map<string, string>();

    for (const event of seed.events) {
      const eventId = randomUUID();
      eventIdBySeedId.set(event.id, eventId);

      await pool.query(
        `INSERT INTO event (id, title, summary, start_time, end_time, location, event_type, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          eventId,
          event.title,
          event.summary ?? null,
          event.startTime ?? null,
          event.endTime ?? null,
          event.location ?? null,
          seed.seedSource,
          event.tags ?? [],
        ],
      );

      for (const media of event.media ?? []) {
        const rawId = randomUUID();
        rawIdsByMediaId.set(media.id, rawId);
        await pool.query(
          `INSERT INTO raw_source (id, file_path, file_type, original_filename, metadata, processing_status)
           VALUES ($1,$2,$3::raw_file_type,$4,$5::jsonb,'completed')`,
          [
            rawId,
            media.url,
            rawTypeForMedia(media),
            filenameForMedia(media),
            {
              seedSource: seed.seedSource,
              seedEventId: event.id,
              seedMediaId: media.id,
              title: media.title,
              caption: media.caption ?? null,
              durationSec: media.durationSec ?? null,
              poster: media.poster ?? event.poster,
            },
          ],
        );
      }

      await pool.query(
        `INSERT INTO event_module (id, event_id, module_type, title, content, raw_source_ids, sort_order)
         VALUES ($1,$2,'summary'::event_module_type,$3,$4::jsonb,$5::uuid[],$6)`,
        [
          randomUUID(),
          eventId,
          "Memory summary",
          {
            markdown: event.summary ?? "",
            summary: event.summary ?? "",
            tags: event.tags ?? [],
            layout: event.layout ?? {},
            poster: event.poster,
            seedEventId: event.id,
          },
          [],
          0,
        ],
      );

      const grouped = new Map<string, SeedMedia[]>();
      for (const media of event.media ?? []) {
        const moduleType = moduleTypeForMedia(media.type);
        grouped.set(moduleType, [...(grouped.get(moduleType) ?? []), media]);
      }

      let sortOrder = 1;
      for (const [moduleType, medias] of grouped) {
        const rawIds = medias
          .map((media) => rawIdsByMediaId.get(media.id))
          .filter((id): id is string => Boolean(id));
        await pool.query(
          `INSERT INTO event_module (id, event_id, module_type, title, content, raw_source_ids, sort_order)
           VALUES ($1,$2,$3::event_module_type,$4,$5::jsonb,$6::uuid[],$7)`,
          [
            randomUUID(),
            eventId,
            moduleType,
            moduleType === "photo_wall"
              ? "Photos"
              : moduleType === "video"
                ? "Videos"
                : moduleType === "audio"
                  ? "Audio"
                  : "Files",
            contentForModule(moduleType, medias, event.poster),
            rawIds,
            sortOrder++,
          ],
        );
      }
    }

    await pool.query(
      `INSERT INTO workspace (id, name, description, filter_criteria, event_ids)
       VALUES ($1,$2,$3,$4::jsonb,$5::uuid[])`,
      [
        randomUUID(),
        seed.workspace.name,
        seed.workspace.description ?? null,
        { seedSource: seed.seedSource, schemaVersion: seed.schemaVersion },
        [...eventIdBySeedId.values()],
      ],
    );

    for (const keyword of seed.keywords ?? []) {
      const storedName = `[seed:${seed.seedSource}] ${keyword.label}`;
      await pool.query(
        `INSERT INTO keyword (id, name, dimension, weight)
         VALUES ($1,$2,'keyword'::keyword_dimension,$3)
         ON CONFLICT (name, dimension) DO UPDATE SET weight = EXCLUDED.weight`,
        [randomUUID(), storedName, keyword.weight ?? 1],
      );
      const idRow = await pool.query<{ id: string }>(
        `SELECT id FROM keyword WHERE name = $1 AND dimension = 'keyword'`,
        [storedName],
      );
      const keywordId = idRow.rows[0]?.id;
      if (!keywordId) {
        continue;
      }
      for (const event of seed.events) {
        if (!(event.keywords ?? []).includes(keyword.id)) {
          continue;
        }
        const eventId = eventIdBySeedId.get(event.id);
        if (!eventId) {
          continue;
        }
        await pool.query(
          `INSERT INTO keyword_event_relation (id, keyword_id, event_id, relevance_score, is_manually_added)
           VALUES ($1,$2,$3,0.92,true)
           ON CONFLICT (keyword_id, event_id) DO NOTHING`,
          [randomUUID(), keywordId, eventId],
        );
      }
    }

    await pool.query("COMMIT");
    return {
      seedSource: seed.seedSource,
      workspace: seed.workspace.name,
      events: seed.events.length,
    };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

export async function exportSeedDataset(seedSource: string): Promise<SeedDataset | null> {
  const pool = requirePool();
  const workspace = await pool.query<{
    name: string;
    description: string | null;
    filter_criteria: Record<string, unknown>;
  }>(
    `SELECT name, description, filter_criteria
     FROM workspace
     WHERE filter_criteria ->> 'seedSource' = $1
     LIMIT 1`,
    [seedSource],
  );
  const w = workspace.rows[0];
  if (!w) {
    return null;
  }

  const events = await pool.query<{
    id: string;
    title: string;
    summary: string | null;
    start_time: Date | null;
    end_time: Date | null;
    location: string | null;
    tags: string[];
  }>(
    `SELECT id, title, summary, start_time, end_time, location, tags
     FROM event
     WHERE event_type = $1
     ORDER BY start_time NULLS LAST, created_at ASC`,
    [seedSource],
  );

  const seedEvents: SeedEvent[] = [];
  for (const event of events.rows) {
    const modules = await pool.query<{
      module_type: string;
      content: Record<string, unknown>;
    }>(
      `SELECT module_type, content
       FROM event_module
       WHERE event_id = $1
       ORDER BY sort_order ASC`,
      [event.id],
    );
    const summaryModule = modules.rows.find((row) => row.module_type === "summary");
    const summaryContent = summaryModule?.content ?? {};
    const poster =
      (summaryContent.poster as SeedPoster | undefined) ?? {
        title: event.title,
        accent: "#2f80ed",
        background: "#e7f0ff",
        icon: "photo",
      };
    const layout = (summaryContent.layout as Record<string, unknown> | undefined) ?? {};
    const media: SeedMedia[] = [];
    for (const row of modules.rows) {
      const content = row.content ?? {};
      if (row.module_type === "photo_wall") {
        const images = Array.isArray(content.images) ? content.images : [];
        for (const image of images as Array<Record<string, unknown>>) {
          media.push({
            id: String(image.assetId ?? randomUUID()),
            type: "photo",
            title: String(image.title ?? image.caption ?? "Photo"),
            url: String(image.url ?? ""),
            caption: image.caption === null || image.caption === undefined ? null : String(image.caption),
            poster: image.poster as SeedPoster | undefined,
          });
        }
      }
      if (row.module_type === "video") {
        const videos = Array.isArray(content.videos) ? content.videos : [];
        for (const video of videos as SeedMedia[]) {
          media.push({ ...video, type: "video" });
        }
      }
      if (row.module_type === "audio") {
        const tracks = Array.isArray(content.tracks) ? content.tracks : [];
        for (const track of tracks as SeedMedia[]) {
          media.push({ ...track, type: "audio" });
        }
      }
      if (row.module_type === "file") {
        const files = Array.isArray(content.files) ? content.files : [];
        for (const file of files as SeedMedia[]) {
          media.push({ ...file, type: "document" });
        }
      }
    }
    seedEvents.push({
      id: event.id,
      title: event.title,
      summary: event.summary,
      startTime: event.start_time?.toISOString() ?? null,
      endTime: event.end_time?.toISOString() ?? null,
      location: event.location,
      tags: event.tags ?? [],
      keywords: [],
      layout,
      poster,
      media,
    });
  }

  return {
    schemaVersion: Number(w.filter_criteria?.schemaVersion ?? 1),
    seedSource,
    workspace: { name: w.name, description: w.description },
    keywords: [],
    events: seedEvents,
  };
}
