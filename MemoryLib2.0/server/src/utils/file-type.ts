import type { RawFileType, UploadMetadata } from "../types/raw-source.js";

const VIDEO_EXT = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm"]);
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"]);
const DOC_EXT = new Set([".pdf", ".doc", ".docx", ".txt", ".md", ".markdown"]);
const AUDIO_EXT = new Set([".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

/** 根据 MIME 与扩展名推断 raw_file_type；视频可通过 metadata.captureKind 区分录屏 */
export function inferRawFileType(
  mimetype: string,
  originalFilename: string,
  meta?: UploadMetadata,
): RawFileType {
  const ext = extOf(originalFilename);
  const mt = mimetype.toLowerCase();

  if (mt.startsWith("video/") || VIDEO_EXT.has(ext)) {
    return meta?.captureKind === "screen" ? "screen_recording" : "video_fpv";
  }
  if (mt.startsWith("image/") || IMAGE_EXT.has(ext)) {
    return "photo";
  }
  if (
    mt.startsWith("audio/") ||
    AUDIO_EXT.has(ext) ||
    mt === "application/ogg"
  ) {
    return "audio";
  }
  if (
    mt === "application/pdf" ||
    mt.includes("word") ||
    mt === "text/plain" ||
    mt === "text/markdown" ||
    DOC_EXT.has(ext)
  ) {
    return "document";
  }

  return "document";
}

export function isVideoRawType(t: RawFileType): boolean {
  return t === "video_fpv" || t === "screen_recording";
}
