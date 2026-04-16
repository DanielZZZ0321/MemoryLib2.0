/**
 * 视频入库后的本地资产：时间线索引 timeline.json、每片段切片 clip + event.json
 * 路径：data/video_assets/{videoId}/
 */
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';

export interface TimelineSegmentEntry {
  segmentId: string;
  eventId: string;
  start_ms: number;
  end_ms: number;
  title: string;
  summary: string;
  keywords: string[];
  clipRelativePath: string;
}

export interface TimelineIndexFile {
  version: 1;
  videoId: string;
  cardId?: string;
  uploadFilename: string;
  sourceVideoAbsPath: string;
  assetRoot: string;
  createdAt: string;
  segments: TimelineSegmentEntry[];
}

export type SegmentBuildRow = {
  segmentId: string;
  eventId: string;
  start_ms: number;
  end_ms: number;
  title: string;
  summary: string;
  raw: Record<string, unknown>;
};

function dataDir(): string {
  return path.join(__dirname, '../../data');
}

export function videoAssetRoot(videoId: string): string {
  return path.join(dataDir(), 'video_assets', videoId);
}

function keywordize(title: string, summary: string, raw: Record<string, unknown>): string[] {
  const parts = [title, summary, String(raw.activity_type || ''), String(raw.environment || '')].join(' ');
  const tokens = parts
    .toLowerCase()
    .split(/[\s,.;，。；、/|]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && t.length < 40);
  return [...new Set(tokens)].slice(0, 24);
}

function ffmpegAvailable(): boolean {
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf-8' });
  return r.status === 0;
}

/**
 * 写入时间线索引、每片段 event.json，并尝试用 ffmpeg 切出 clip.mp4
 */
export function buildVideoAssetBundle(opts: {
  videoId: string;
  cardId?: string;
  uploadFilename: string;
  sourceVideoPath: string;
  rows: SegmentBuildRow[];
}): { ok: true; timelinePath: string } | { ok: false; error: string } {
  const root = videoAssetRoot(opts.videoId);
  const segRoot = path.join(root, 'segments');
  try {
    fs.mkdirSync(segRoot, { recursive: true });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'mkdir failed' };
  }

  const withFfmpeg = ffmpegAvailable();
  const segments: TimelineSegmentEntry[] = [];

  for (const row of opts.rows) {
    const dir = path.join(segRoot, row.segmentId);
    fs.mkdirSync(dir, { recursive: true });

    const eventJson = {
      segmentId: row.segmentId,
      eventId: row.eventId,
      videoId: opts.videoId,
      start_ms: row.start_ms,
      end_ms: row.end_ms,
      title: row.title,
      summary: row.summary,
      raw: row.raw,
    };
    fs.writeFileSync(path.join(dir, 'event.json'), JSON.stringify(eventJson, null, 2), 'utf-8');

    const startSec = row.start_ms / 1000;
    const durSec = Math.max(0.5, (row.end_ms - row.start_ms) / 1000);
    const clipPath = path.join(dir, 'clip.mp4');
    let clipOk = false;
    if (withFfmpeg && fs.existsSync(opts.sourceVideoPath)) {
      const args = [
        '-y',
        '-ss',
        String(startSec),
        '-i',
        opts.sourceVideoPath,
        '-t',
        String(durSec),
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '23',
        '-movflags',
        '+faststart',
        '-an',
        clipPath,
      ];
      const ff = spawnSync('ffmpeg', args, { encoding: 'utf-8', timeout: 120000 });
      clipOk = ff.status === 0 && fs.existsSync(clipPath);
      if (!clipOk && ff.stderr) console.warn('[ffmpeg]', row.segmentId, ff.stderr.slice(0, 200));
    }

    const kw = keywordize(row.title, row.summary, row.raw);
    segments.push({
      segmentId: row.segmentId,
      eventId: row.eventId,
      start_ms: row.start_ms,
      end_ms: row.end_ms,
      title: row.title,
      summary: row.summary,
      keywords: kw,
      clipRelativePath: clipOk ? `segments/${row.segmentId}/clip.mp4` : '',
    });
  }

  const index: TimelineIndexFile = {
    version: 1,
    videoId: opts.videoId,
    cardId: opts.cardId,
    uploadFilename: opts.uploadFilename,
    sourceVideoAbsPath: opts.sourceVideoPath,
    assetRoot: root,
    createdAt: new Date().toISOString(),
    segments,
  };
  const timelinePath = path.join(root, 'timeline.json');
  fs.writeFileSync(timelinePath, JSON.stringify(index, null, 2), 'utf-8');

  return { ok: true, timelinePath };
}

export function loadTimelineIndex(videoId: string): TimelineIndexFile | null {
  const p = path.join(videoAssetRoot(videoId), 'timeline.json');
  try {
    if (!fs.existsSync(p)) return null;
    const j = JSON.parse(fs.readFileSync(p, 'utf-8')) as TimelineIndexFile;
    if (j.version !== 1 || !Array.isArray(j.segments)) return null;
    return j;
  } catch {
    return null;
  }
}

/** 简单关键词匹配，用于时间线定位（可后续换 embedding） */
export function scoreSegmentsForQuery(
  timeline: TimelineIndexFile,
  query: string
): Array<{ segment: TimelineSegmentEntry; score: number }> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const terms = [...new Set(q.split(/[\s,，。]+/g).filter((t) => t.length >= 1))];
  const scored: Array<{ segment: TimelineSegmentEntry; score: number }> = [];
  for (const seg of timeline.segments) {
    const hay = `${seg.title} ${seg.summary} ${seg.keywords.join(' ')}`.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (t.length < 2 && terms.length > 1) continue;
      if (hay.includes(t)) score += t.length >= 3 ? 3 : 1;
    }
    if (score > 0) scored.push({ segment: seg, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function resolveClipPath(videoId: string, segment: TimelineSegmentEntry): string | null {
  if (!segment.clipRelativePath) return null;
  const p = path.join(videoAssetRoot(videoId), segment.clipRelativePath);
  return fs.existsSync(p) ? p : null;
}
