import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import { memoriaDataDir } from "../config/paths.js";

type LoggedRequest = Request & {
  body?: unknown;
};

function bodySize(body: unknown): number {
  if (body === undefined) {
    return 0;
  }
  try {
    return Buffer.byteLength(JSON.stringify(body), "utf8");
  } catch {
    return 0;
  }
}

async function appendTransferLog(entry: Record<string, unknown>): Promise<void> {
  const dir = path.join(memoriaDataDir(), "logs");
  await mkdir(dir, { recursive: true });
  await appendFile(
    path.join(dir, "data-transfer.log"),
    `${JSON.stringify(entry)}\n`,
    "utf8",
  );
}

export function dataTransferLogger(
  req: LoggedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.path.startsWith("/api/")) {
    next();
    return;
  }

  const start = Date.now();
  const requestBytes = bodySize(req.body);
  res.on("finish", () => {
    const contentLength = res.getHeader("content-length");
    void appendTransferLog({
      at: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      requestBytes,
      responseBytes:
        typeof contentLength === "number"
          ? contentLength
          : typeof contentLength === "string"
            ? Number(contentLength) || undefined
            : undefined,
      durationMs: Date.now() - start,
    }).catch((error: unknown) => {
      console.warn(
        "[data-transfer-log] write failed",
        error instanceof Error ? error.message : error,
      );
    });
  });
  next();
}
