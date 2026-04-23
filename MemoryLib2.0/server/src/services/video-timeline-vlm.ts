import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import type { TimelineSegment } from "../types/video-timeline.js";
import { extractJpegFrameAt } from "./ffmpeg/extract-frame.js";
import { ffprobeVideoDurationSeconds } from "./ffmpeg/ffprobe-meta.js";
import { generateVisionText, isGeminiConfigured } from "./gemini-client.js";

function maxTimelineFrames(): number {
  const n = Number(process.env.VIDEO_TIMELINE_MAX_FRAMES ?? "8");
  if (!Number.isFinite(n) || n < 1) {
    return 8;
  }
  return Math.min(24, Math.floor(n));
}

function frameTimestamps(durationSec: number, count: number): number[] {
  if (count <= 0) {
    return [];
  }
  const d = Math.max(0.1, durationSec);
  if (count === 1) {
    return [0];
  }
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push((i / (count - 1)) * d);
  }
  return out;
}

function jpegToDataUrl(buf: Buffer): string {
  const b64 = buf.toString("base64");
  return `data:image/jpeg;base64,${b64}`;
}

function extractJsonArraySlice(raw: string): string | null {
  const t = raw.trim();
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start === -1 || end <= start) {
    return null;
  }
  return t.slice(start, end + 1);
}

function asNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeSegments(
  raw: unknown[],
  durationSec: number,
): TimelineSegment[] {
  const d = Math.max(0.1, durationSec);
  const out: TimelineSegment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const o = item as Record<string, unknown>;
    const startSec = asNum(o.startSec) ?? asNum(o.start) ?? 0;
    let endSec = asNum(o.endSec) ?? asNum(o.end) ?? d;
    const title =
      typeof o.title === "string" ? o.title.trim() : "片段";
    const summary =
      typeof o.summary === "string"
        ? o.summary.trim()
        : typeof o.description === "string"
          ? o.description.trim()
          : title;
    const tags = Array.isArray(o.tags)
      ? o.tags.map((t) => String(t)).filter(Boolean)
      : [];
    let s = Math.max(0, Math.min(startSec, d));
    let e = Math.max(0, Math.min(endSec, d));
    if (e < s) {
      [s, e] = [e, s];
    }
    if (e - s < 0.05) {
      e = Math.min(d, s + 0.5);
    }
    out.push({ startSec: s, endSec: e, title, summary, tags });
  }
  out.sort((a, b) => a.startSec - b.startSec);
  return out;
}

/**
 * 对本地视频路径均匀抽帧，经 VLM 产出时间线片段；无密钥 / ffprobe 失败时返回 []。
 */
export async function analyzeVideoTimelineWithVlm(
  videoPath: string,
): Promise<TimelineSegment[]> {
  if (!isGeminiConfigured()) {
    return [];
  }
  let durationSec: number;
  try {
    durationSec = await ffprobeVideoDurationSeconds(videoPath);
  } catch (e) {
    console.warn(
      "[video-timeline-vlm] ffprobe 失败，跳过 VLM",
      e instanceof Error ? e.message : e,
    );
    return [];
  }

  const n = maxTimelineFrames();
  const times = frameTimestamps(durationSec, n);
  const framePaths: string[] = [];
  try {
    for (let i = 0; i < times.length; i++) {
      const fp = path.join(
        path.dirname(videoPath),
        `.vlm-frame-${i}-${randomUUID().slice(0, 8)}.jpg`,
      );
      try {
        await extractJpegFrameAt(videoPath, times[i]!, fp);
        framePaths.push(fp);
      } catch (err) {
        console.warn(
          `[video-timeline-vlm] 抽帧 ${i} @ ${times[i]} 失败`,
          err instanceof Error ? err.message : err,
        );
      }
    }
    if (framePaths.length === 0) {
      return [];
    }

    const parts: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: [
          `视频总时长约 ${durationSec.toFixed(2)} 秒。`,
          `下面 ${framePaths.length} 张图按时间顺序均匀采样，对应时间（秒）依次为：${times
            .slice(0, framePaths.length)
            .map((t) => t.toFixed(2))
            .join(", ")}。`,
          "",
          "请根据画面与时间点，将视频划分为若干连续片段。",
          "只输出一个 JSON 数组，不要 markdown 代码块，不要其它说明。",
          "每个元素格式：",
          '{"startSec":数字,"endSec":数字,"title":"短标题","summary":"一两句中文描述","tags":["可选关键词"]}',
          "要求：startSec/endSec 在 0 到时长之间，按时间递增，片段可衔接覆盖全片。",
        ].join("\n"),
      },
    ];
    for (const fp of framePaths) {
      const buf = await readFile(fp);
      parts.push({
        type: "image_url",
        image_url: { url: jpegToDataUrl(buf) },
      });
    }

    const rawText = await generateVisionText({
      system:
        "你是视频理解助手。只输出合法 JSON 数组，元素字段：startSec, endSec, title, summary, tags。使用中文 title/summary。",
      userParts: parts,
      temperature: 0.15,
      maxTokens: 4096,
    });

    const slice = extractJsonArraySlice(rawText);
    if (!slice) {
      console.warn("[video-timeline-vlm] 响应中未找到 JSON 数组");
      return [];
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(slice) as unknown;
    } catch {
      console.warn("[video-timeline-vlm] JSON 解析失败");
      return [];
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    return normalizeSegments(parsed, durationSec);
  } finally {
    await Promise.all(framePaths.map((p) => unlink(p).catch(() => {})));
  }
}
