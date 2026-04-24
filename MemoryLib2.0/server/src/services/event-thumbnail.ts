import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { memoriaDataDir } from "../config/paths.js";
import { getEventById } from "../mvp/event-db.js";
import { extractJpegFrameAt } from "./ffmpeg/extract-frame.js";
import { downloadObjectToFile } from "./storage.js";

export type EventThumbResult = { buffer: Buffer; contentType: string } | { redirectUrl: string };

type SeedPoster = {
  title?: string;
  subtitle?: string;
  accent?: string;
  background?: string;
  icon?: string;
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readPoster(raw: unknown): SeedPoster | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const p = raw as Record<string, unknown>;
  const title = typeof p.title === "string" ? p.title : undefined;
  const subtitle = typeof p.subtitle === "string" ? p.subtitle : undefined;
  const accent = typeof p.accent === "string" ? p.accent : undefined;
  const background =
    typeof p.background === "string" ? p.background : undefined;
  const icon = typeof p.icon === "string" ? p.icon : undefined;
  if (!title && !subtitle && !accent && !background) {
    return null;
  }
  return { title, subtitle, accent, background, icon };
}

function renderSeedPosterSvg(poster: SeedPoster, fallbackTitle: string): EventThumbResult {
  const title = escapeXml((poster.title || fallbackTitle).slice(0, 28));
  const subtitle = escapeXml((poster.subtitle || "Memoria").slice(0, 32));
  const icon = escapeXml((poster.icon || "memory").slice(0, 12));
  const accent = poster.accent || "#4f8cff";
  const background = poster.background || "#eef4ff";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${escapeXml(background)}"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
  </defs>
  <rect width="320" height="320" rx="52" fill="url(#bg)"/>
  <circle cx="246" cy="76" r="46" fill="${escapeXml(accent)}" opacity="0.16"/>
  <circle cx="82" cy="238" r="64" fill="${escapeXml(accent)}" opacity="0.12"/>
  <rect x="42" y="42" width="236" height="236" rx="42" fill="#ffffff" opacity="0.64"/>
  <circle cx="104" cy="112" r="34" fill="${escapeXml(accent)}"/>
  <text x="104" y="118" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#ffffff">${icon}</text>
  <text x="48" y="202" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="#111827">${title}</text>
  <text x="48" y="234" font-family="Arial, sans-serif" font-size="18" fill="#4b5563">${subtitle}</text>
</svg>`;
  return {
    buffer: Buffer.from(svg, "utf8"),
    contentType: "image/svg+xml; charset=utf-8",
  };
}

function sniffImageType(buf: Buffer): "image/jpeg" | "image/png" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 4 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  return null;
}

async function ensureThumbDir(): Promise<string> {
  const d = path.join(memoriaDataDir(), "thumbnails");
  await mkdir(d, { recursive: true });
  return d;
}

/**
 * 事件缩略图：优先 photo_wall 首图 → 视频关键帧（模块 startSec 或 0）→ null（由路由回退占位图）
 */
export async function resolveEventThumbnail(
  eventId: string,
): Promise<EventThumbResult | null> {
  const ev = await getEventById(eventId);
  if (!ev) {
    return null;
  }

  // Helper: detect if a URL points to a playable video (cannot be used as img src)
  function isVideoUrl(url: string): boolean {
    const lower = url.toLowerCase().split('?')[0];
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.avi') || lower.endsWith('.mkv');
  }

  // Aggressive generic search for ANY image/video URL matching frontend logic
  // First pass: prefer images (skip video URLs)
  let firstVideoUrl: string | null = null;
  for (const m of ev.modules) {
    if (!m.content || typeof m.content !== "object") continue;
    const content = m.content as Record<string, unknown>;
    const keys = ["images", "photos", "media", "videos", "audios", "audio"];
    for (const key of keys) {
      const arr = content[key];
      if (Array.isArray(arr) && arr.length > 0) {
        for (const item of arr) {
          const url: string | null = typeof item === "string" ? item : (item && typeof item === "object" ? (item as any).url : null);
          if (typeof url === "string" && url.trim()) {
            const trimmed = url.trim();
            if (!isVideoUrl(trimmed)) {
              // It's an image URL – return immediately
              return { redirectUrl: trimmed };
            } else if (!firstVideoUrl) {
              // Remember first video as fallback
              firstVideoUrl = trimmed;
            }
          }
        }
      }
    }
  }
  // Second pass: if all we found was a video, use it (frontend may handle it later)
  if (firstVideoUrl) {
    // Try to find a thumbnail/poster field from the same item before falling through to video URL
    for (const m of ev.modules) {
      if (!m.content || typeof m.content !== "object") continue;
      const content = m.content as Record<string, unknown>;
      const keys = ["images", "photos", "media", "videos"];
      for (const key of keys) {
        const arr = content[key];
        if (Array.isArray(arr)) {
          for (const item of arr) {
            if (item && typeof item === "object") {
              const legacy = (item as any).legacy;
              const thumb: string | undefined = (item as any).thumbnail ?? legacy?.thumbnail;
              if (typeof thumb === "string" && thumb.trim() && !isVideoUrl(thumb.trim())) {
                return { redirectUrl: thumb.trim() };
              }
            }
          }
        }
      }
    }
    // No thumbnail found, use video URL as last resort (browser will fail gracefully)
    return { redirectUrl: firstVideoUrl };
  }

  // Fallback 1: Legacy photo_wall objectKey parsing
  const photoMod = ev.modules.find((m) => m.module_type === "photo_wall" || m.module_type === "media");
  if (photoMod) {
    const c = photoMod.content as {
      images?: Array<{ objectKey?: string; poster?: unknown; url?: string } | string>;
      media?: Array<{ objectKey?: string; poster?: unknown; url?: string } | string>;
      poster?: unknown;
    };
    const imagesArray = c.images ?? c.media;
    const firstImg = imagesArray?.[0];
    const key = typeof firstImg === 'object' && firstImg !== null ? firstImg.objectKey?.trim() : undefined;
    const url = typeof firstImg === 'string' ? firstImg : firstImg?.url?.trim();

    if (key) {
      const h = createHash("sha256").update(`p:${key}`).digest("hex").slice(0, 40);
      const dir = await ensureThumbDir();
      const cacheBin = path.join(dir, `${h}.bin`);
      const cacheCt = path.join(dir, `${h}.ctype`);
      try {
        const [buf, ct] = await Promise.all([
          readFile(cacheBin),
          readFile(cacheCt, "utf8"),
        ]);
        return {
          buffer: buf,
          contentType: ct.trim() || "image/jpeg",
        };
      } catch {
        /* 无缓存 */
      }
      const tmpDir = await mkdtemp(path.join(os.tmpdir(), "memoria-th-"));
      const dl = path.join(tmpDir, "src");
      try {
        await downloadObjectToFile(key, dl);
        const buf = await readFile(dl);
        const ct = sniffImageType(buf) ?? "image/jpeg";
        await writeFile(cacheBin, buf);
        await writeFile(cacheCt, ct, "utf8");
        return { buffer: buf, contentType: ct };
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    }
    if (url) {
      return { redirectUrl: url };
    }
    const posterObj = typeof firstImg === 'object' && firstImg !== null ? firstImg.poster : undefined;
    const poster = readPoster(posterObj) ?? readPoster(c.poster);
    if (poster) {
      return renderSeedPosterSvg(poster, ev.title);
    }
  }

  const videoMod = ev.modules.find((m) => m.module_type === "video");
  if (videoMod) {
    const c = videoMod.content as {
      objectKey?: string;
      url?: string;
      startSec?: number;
      poster?: unknown;
      videos?: Array<{ poster?: unknown; url?: string } | string>;
    };
    const firstVid = c.videos?.[0];
    const key = c.objectKey?.trim();
    const url = c.url?.trim() || (typeof firstVid === 'string' ? firstVid : firstVid?.url?.trim());

    if (key) {
      const t =
        typeof c.startSec === "number" && Number.isFinite(c.startSec)
          ? Math.max(0, c.startSec)
          : 0;
      const h = createHash("sha256")
        .update(`v:${key}:${t}`)
        .digest("hex")
        .slice(0, 40);
      const dir = await ensureThumbDir();
      const cachePath = path.join(dir, `${h}.jpg`);
      try {
        const buf = await readFile(cachePath);
        return { buffer: buf, contentType: "image/jpeg" };
      } catch {
        /* */
      }
      const tmpDir = await mkdtemp(path.join(os.tmpdir(), "memoria-thv-"));
      const videoP = path.join(tmpDir, "v.dat");
      const jpegP = path.join(tmpDir, "frame.jpg");
      try {
        await downloadObjectToFile(key, videoP);
        await extractJpegFrameAt(videoP, t, jpegP);
        const buf = await readFile(jpegP);
        await writeFile(cachePath, buf);
        return { buffer: buf, contentType: "image/jpeg" };
      } catch (e) {
        console.warn(
          "[event-thumb] 视频缩略图失败",
          eventId,
          e instanceof Error ? e.message : e,
        );
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    }
    if (url) {
      return { redirectUrl: url };
    }
    const posterObj = typeof firstVid === 'object' && firstVid !== null ? firstVid.poster : undefined;
    const poster = readPoster(posterObj) ?? readPoster(c.poster);
    if (poster) {
      return renderSeedPosterSvg(poster, ev.title);
    }
  }

  const summaryMod = ev.modules.find((m) => m.module_type === "summary");
  if (summaryMod) {
    const c = summaryMod.content as { poster?: unknown };
    const poster = readPoster(c.poster);
    if (poster) {
      return renderSeedPosterSvg(poster, ev.title);
    }
  }

  return null;
}
