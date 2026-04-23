import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { memoriaDataDir } from "../config/paths.js";
import { getEventById } from "../mvp/event-db.js";
import { extractJpegFrameAt } from "./ffmpeg/extract-frame.js";
import { downloadObjectToFile } from "./storage.js";

export type EventThumbResult = { buffer: Buffer; contentType: string };

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

  const photoMod = ev.modules.find((m) => m.module_type === "photo_wall");
  if (photoMod) {
    const c = photoMod.content as { images?: Array<{ objectKey?: string }> };
    const key = c.images?.[0]?.objectKey?.trim();
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
  }

  const videoMod = ev.modules.find((m) => m.module_type === "video");
  if (videoMod) {
    const c = videoMod.content as {
      objectKey?: string;
      startSec?: number;
    };
    const key = c.objectKey?.trim();
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
  }

  return null;
}
