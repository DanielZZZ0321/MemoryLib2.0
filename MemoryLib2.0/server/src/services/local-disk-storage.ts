import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { memoriaDataDir } from "../config/paths.js";

export function localStorageRoot(): string {
  return path.join(memoriaDataDir(), "storage");
}

export async function ensureLocalStorageRoot(): Promise<void> {
  await mkdir(localStorageRoot(), { recursive: true });
}

/** 将 object key 映射为本地绝对路径（禁止跳出根目录） */
export function localPathForObjectKey(key: string): string {
  const normalized = key.replace(/^[/\\]+/, "").replace(/\.\./g, "_");
  return path.join(localStorageRoot(), normalized);
}

export async function localPutFromFile(
  key: string,
  sourceFilePath: string,
): Promise<void> {
  await ensureLocalStorageRoot();
  const dest = localPathForObjectKey(key);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(sourceFilePath, dest);
}

export async function localDownloadToFile(
  key: string,
  destPath: string,
): Promise<void> {
  const src = localPathForObjectKey(key);
  await pipeline(createReadStream(src), createWriteStream(destPath));
}

export async function localDeleteObject(key: string): Promise<void> {
  try {
    await unlink(localPathForObjectKey(key));
  } catch {
    /* ignore */
  }
}
