import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BRANCH = "feature/frontend-backend";
const OUTPUT_DIR = path.resolve("data/seed");

const memorylibPaths = [
  "data/memorylibs/1.json",
  "data/memorylibs/2.json",
  "data/memorylibs/6.json",
  "data/memorylibs/sample.json",
];

const campusPath = "frontend/public/_campus_life.json";

const palette = [
  { accent: "#2f80ed", background: "#e7f0ff", icon: "photo" },
  { accent: "#22a06b", background: "#e9f8ee", icon: "leaf" },
  { accent: "#db6b2f", background: "#fff0e8", icon: "table" },
  { accent: "#7c5cff", background: "#f0ebff", icon: "graph" },
  { accent: "#ef6f91", background: "#ffe7ee", icon: "video" },
  { accent: "#1aa39a", background: "#dff8f3", icon: "meeting" },
];

function gitShow(filePath) {
  return execFileSync("git", ["show", `${BRANCH}:${filePath}`], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });
}

function hash(input) {
  let h = 2166136261;
  for (const ch of input) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function slug(input, fallback = "item") {
  const ascii = String(input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || `${fallback}-${hash(String(input ?? fallback)).slice(0, 6)}`;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function parseMonthDay(dateRange, year) {
  const first = String(dateRange ?? "1.1").split("-")[0] ?? "1.1";
  const match = first.match(/(\d{1,2})\.(\d{1,2})/);
  const month = match ? Number(match[1]) : 1;
  const day = match ? Number(match[2]) : 1;
  return { year: Number(year) || 2026, month, day };
}

function isoAt(base, hms) {
  const parts = String(hms ?? "00:00:00").split(":").map(Number);
  const [hour = 0, minute = 0, second = 0] = parts;
  return `${base.year}-${String(base.month).padStart(2, "0")}-${String(base.day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}+08:00`;
}

function mediaType(type) {
  if (type === "image") {
    return "photo";
  }
  if (type === "video") {
    return "video";
  }
  if (type === "audio") {
    return "audio";
  }
  return "document";
}

function makeKeywords(events, extras = []) {
  const labels = unique([
    ...extras,
    ...events.flatMap((event) => event.tags ?? []),
    ...events.flatMap((event) => event.media?.length ? ["Media"] : []),
  ]);
  return labels.map((label, index) => ({
    id: slug(label, "keyword"),
    label,
    weight: Math.max(1, 5 - Math.floor(index / 4)),
    color: palette[index % palette.length].accent,
  }));
}

function keywordIds(tags, keywordMap, includeMedia) {
  return unique([
    ...(tags ?? []).map((tag) => keywordMap.get(tag)),
    includeMedia ? keywordMap.get("Media") : null,
  ]);
}

function convertMedia(media, eventId, eventPoster) {
  return (media ?? []).map((item, index) => {
    const type = mediaType(item.type);
    const poster = {
      title: item.caption || item.title || `${type} ${index + 1}`,
      subtitle: item.timestamp || item.url,
      accent: eventPoster.accent,
      background: eventPoster.background,
      icon: type === "video" ? "video" : type === "photo" ? "photo" : type,
    };
    return {
      id: `${eventId}-media-${index + 1}`,
      type,
      title: item.caption || item.title || `${type} ${index + 1}`,
      url: item.url,
      caption: item.caption ?? null,
      durationSec: item.duration ?? item.durationSec ?? undefined,
      poster,
      legacy: {
        thumbnail: item.thumbnail,
        timestamp: item.timestamp,
      },
    };
  });
}

function convertEvents(rawEvents, options, keywordMap) {
  const base = options.baseDate;
  const count = Math.max(rawEvents.length, 1);
  return rawEvents.map((event, index) => {
    const eventId = `${options.idPrefix}-${slug(event.title, "event")}-${index}`;
    const p = palette[index % palette.length];
    const angle = (Math.PI * 2 * index) / count;
    const poster = {
      title: event.title,
      subtitle: event.location || event.start_hms || options.workspaceName,
      accent: p.accent,
      background: p.background,
      icon: (event.media ?? []).some((m) => m.type === "video") ? "video" : p.icon,
    };
    const tags = unique([...(event.tags ?? []), event.mood ? `Mood: ${event.mood}` : null]);
    return {
      id: eventId,
      title: event.title,
      summary: event.summary ?? "",
      startTime: isoAt(base, event.start_hms),
      endTime: isoAt(base, event.end_hms),
      location: event.location ?? null,
      tags,
      keywords: keywordIds(tags, keywordMap, (event.media ?? []).length > 0),
      layout: {
        cluster: options.cluster,
        x: Math.round(Math.cos(angle) * options.radius),
        y: Math.round(Math.sin(angle) * options.radius),
      },
      poster,
      media: convertMedia(event.media, eventId, poster),
      legacy: {
        sourceBranch: BRANCH,
        sourcePath: options.sourcePath,
        eventIndex: event.event_index,
        startSec: event.start_sec,
        endSec: event.end_sec,
        mood: event.mood,
      },
    };
  });
}

function makeSeed({ seedSource, workspaceName, description, rawEvents, sourcePath, baseDate, extras = [] }) {
  const keywords = makeKeywords(rawEvents, extras);
  const keywordMap = new Map(keywords.map((keyword) => [keyword.label, keyword.id]));
  const events = convertEvents(
    rawEvents,
    {
      idPrefix: seedSource,
      workspaceName,
      sourcePath,
      baseDate,
      cluster: seedSource.includes("campus") ? "campus-life" : "legacy-memorylib",
      radius: seedSource.includes("campus") ? 260 : 170,
    },
    keywordMap,
  );
  return {
    schemaVersion: 1,
    seedSource,
    workspace: {
      name: workspaceName,
      description,
    },
    keywords,
    events,
  };
}

function writeSeed(filename, seed) {
  writeFileSync(path.join(OUTPUT_DIR, filename), `${JSON.stringify(seed, null, 2)}\n`, "utf8");
}

mkdirSync(OUTPUT_DIR, { recursive: true });

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceBranch: BRANCH,
  outputs: [],
};

for (const sourcePath of memorylibPaths) {
  const old = JSON.parse(gitShow(sourcePath));
  const id = path.basename(sourcePath, ".json");
  const seedSource = `frontend-backend-memorylib-${slug(id)}`;
  const filename = `${seedSource}.json`;
  const seed = makeSeed({
    seedSource,
    workspaceName: old.title,
    description: `Converted from ${BRANCH}:${sourcePath}. Legacy date range: ${old.dateRange}; color: ${old.color}.`,
    rawEvents: old.events ?? [],
    sourcePath,
    baseDate: parseMonthDay(old.dateRange, old.year),
    extras: ["Legacy MemoryLib"],
  });
  writeSeed(filename, seed);
  manifest.outputs.push({
    sourcePath,
    outputPath: `data/seed/${filename}`,
    events: seed.events.length,
    media: seed.events.reduce((sum, event) => sum + event.media.length, 0),
  });
}

const campusEvents = JSON.parse(gitShow(campusPath));
const campusSeed = makeSeed({
  seedSource: "frontend-backend-campus-life",
  workspaceName: "校园生活 MemoryLib",
  description: `Converted from ${BRANCH}:${campusPath}. Campus-life dataset with opening ceremony, study, research, clubs, culture, MR, exchange, and graduation memories.`,
  rawEvents: campusEvents,
  sourcePath: campusPath,
  baseDate: { year: 2026, month: 9, day: 1 },
  extras: ["Campus", "Student Life", "HKUST(GZ)"],
});
writeSeed("frontend-backend-campus-life.json", campusSeed);
manifest.outputs.push({
  sourcePath: campusPath,
  outputPath: "data/seed/frontend-backend-campus-life.json",
  events: campusSeed.events.length,
  media: campusSeed.events.reduce((sum, event) => sum + event.media.length, 0),
});

writeFileSync(
  path.join(OUTPUT_DIR, "frontend-backend-datasets.manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `Converted ${manifest.outputs.length} datasets into ${OUTPUT_DIR}`,
);
