import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Response } from "express";
import { createReadStream, createWriteStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import {
  ensureLocalStorageRoot,
  localDeleteObject,
  localDownloadToFile,
  localPathForObjectKey,
  localPutFromFile,
} from "./local-disk-storage.js";

function getBucket(): string {
  return process.env.STORAGE_BUCKET ?? "memoria";
}

function createClient(): S3Client {
  const endpointHost = process.env.STORAGE_ENDPOINT ?? "localhost";
  const port = process.env.STORAGE_PORT ?? "9000";
  const useSsl = process.env.STORAGE_USE_SSL === "true";
  const accessKeyId = process.env.STORAGE_ACCESS_KEY ?? "";
  const secretAccessKey = process.env.STORAGE_SECRET_KEY ?? "";
  const endpoint = `${useSsl ? "https" : "http"}://${endpointHost}:${port}`;

  return new S3Client({
    region: "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

let client: S3Client | null = null;
let bucketEnsured = false;

function getClient(): S3Client {
  if (!client) {
    client = createClient();
  }
  return client;
}

/** 首次上传前调用：本地模式建目录；S3/MinIO 模式检查或创建 bucket */
export async function ensureBucketExists(): Promise<void> {
  if (isMemoriaDevLite()) {
    await ensureLocalStorageRoot();
    bucketEnsured = true;
    return;
  }
  const c = getClient();
  const Bucket = getBucket();
  try {
    await c.send(new HeadBucketCommand({ Bucket }));
  } catch {
    await c.send(new CreateBucketCommand({ Bucket }));
  }
  bucketEnsured = true;
}

async function ensureBucketOnce(): Promise<void> {
  if (!bucketEnsured) {
    await ensureBucketExists();
  }
}

export async function putObjectFromFile(params: {
  key: string;
  filePath: string;
  contentType?: string;
}): Promise<void> {
  if (isMemoriaDevLite()) {
    await ensureBucketOnce();
    await localPutFromFile(params.key, params.filePath);
    return;
  }
  await ensureBucketOnce();
  const Body = createReadStream(params.filePath);
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: params.key,
      Body,
      ContentType: params.contentType,
    }),
  );
}

export async function downloadObjectToFile(
  key: string,
  destPath: string,
): Promise<void> {
  if (isMemoriaDevLite()) {
    await ensureBucketOnce();
    await localDownloadToFile(key, destPath);
    return;
  }
  await ensureBucketOnce();
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
  );
  if (!res.Body) {
    throw new Error("对象 Body 为空");
  }
  const body = res.Body as Readable;
  await pipeline(body, createWriteStream(destPath));
}

export async function getPresignedGetUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  if (isMemoriaDevLite()) {
    await ensureBucketOnce();
    return `local://${key}`;
  }
  await ensureBucketOnce();
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

export function isStorageConfigured(): boolean {
  if (isMemoriaDevLite()) {
    return true;
  }
  return Boolean(process.env.STORAGE_ACCESS_KEY && process.env.STORAGE_SECRET_KEY);
}

export async function deleteObject(key: string): Promise<void> {
  if (isMemoriaDevLite()) {
    await localDeleteObject(key);
    return;
  }
  await ensureBucketOnce();
  await getClient().send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
  );
}

/** 将对象流式写入 HTTP 响应；对象不存在时抛出带 code 的错误 */
export async function pipeObjectToResponse(
  key: string,
  res: Response,
  opts?: { contentType?: string },
): Promise<void> {
  if (isMemoriaDevLite()) {
    await ensureBucketOnce();
    const fsPath = localPathForObjectKey(key);
    try {
      await stat(fsPath);
    } catch {
      const e = new Error("object_not_found");
      (e as NodeJS.ErrnoException).code = "ENOENT";
      throw e;
    }
    if (opts?.contentType) {
      res.setHeader("Content-Type", opts.contentType);
    }
    createReadStream(fsPath).pipe(res);
    return;
  }
  await ensureBucketOnce();
  const out = await getClient().send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
  );
  if (!out.Body) {
    throw new Error("empty_body");
  }
  if (out.ContentType) {
    res.setHeader("Content-Type", out.ContentType);
  } else if (opts?.contentType) {
    res.setHeader("Content-Type", opts.contentType);
  }
  const body = out.Body as Readable;
  body.pipe(res);
}
