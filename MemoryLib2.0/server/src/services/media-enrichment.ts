import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateVisionText, isGeminiConfigured } from "./gemini-client.js";
import { downloadObjectToFile } from "./storage.js";

function autoEnrichEnabled(): boolean {
  const v = process.env.AUTO_MEDIA_ENRICH;
  if (v === "false" || v === "0" || v === "no") {
    return false;
  }
  return true;
}

function mimeFromBuffer(buf: Buffer): string | null {
  if (buf.length < 12) {
    return null;
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return "image/png";
  }
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    return "image/gif";
  }
  if (
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const t = raw.trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end <= start) {
    return null;
  }
  try {
    return JSON.parse(t.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type PhotoEnrichmentPatch = {
  aiTitle: string;
  aiSummary: string;
  aiTags: string[];
  aiExtractedAt: string;
};

/**
 * 从存储中的图片对象拉取并调用 VLM，生成写入 raw_source.metadata 的字段（供 metaFromRaw 使用）。
 * 受 AUTO_MEDIA_ENRICH 与 LLM 配置控制。
 */
export async function tryEnrichPhotoObjectKey(
  objectKey: string,
  contentTypeHint?: string,
): Promise<PhotoEnrichmentPatch | null> {
  if (!autoEnrichEnabled() || !isGeminiConfigured()) {
    return null;
  }
  const dir = await mkdtemp(path.join(os.tmpdir(), "memoria-enrich-"));
  const fpath = path.join(dir, "src.bin");
  try {
    await downloadObjectToFile(objectKey, fpath);
    const buf = await readFile(fpath);
    const sniffed = mimeFromBuffer(buf);
    const fromHint =
      contentTypeHint?.startsWith("image/") === true
        ? contentTypeHint.split(";")[0]!.trim()
        : null;
    const dataMime = sniffed ?? fromHint;
    if (!dataMime) {
      return null;
    }
    const url = `data:${dataMime};base64,${buf.toString("base64")}`;

    const rawText = await generateVisionText({
      system:
        "你只输出一个 JSON 对象，不要 markdown。字段：title（中文短标题）、summary（1～3 句中文描述）、tags（3～8 个关键词的字符串数组）。不要编造画面中看不清的人名。",
      userParts: [
        {
          type: "text",
          text: "分析该图片，输出 JSON：{title,summary,tags}",
        },
        { type: "image_url", image_url: { url } },
      ],
      maxTokens: 1024,
      temperature: 0.2,
      model: process.env.MEDIA_ENRICH_MODEL?.trim() || undefined,
    });

    const o = extractJsonObject(rawText);
    if (!o) {
      return null;
    }
    const title =
      typeof o.title === "string" ? o.title.trim().slice(0, 120) : "";
    const summary =
      typeof o.summary === "string"
        ? o.summary.trim().slice(0, 800)
        : typeof o.description === "string"
          ? o.description.trim().slice(0, 800)
          : "";
    const tagsRaw = Array.isArray(o.tags) ? o.tags.map(String) : [];
    const aiTags = [
      ...new Set(tagsRaw.map((t) => t.trim()).filter(Boolean)),
    ].slice(0, 16);
    if (!title && !summary && aiTags.length === 0) {
      return null;
    }
    return {
      aiTitle: title || "照片",
      aiSummary: summary || title || "照片",
      aiTags,
      aiExtractedAt: new Date().toISOString(),
    };
  } catch (e) {
    console.warn(
      "[media-enrich] 照片分析失败",
      e instanceof Error ? e.message : e,
    );
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
