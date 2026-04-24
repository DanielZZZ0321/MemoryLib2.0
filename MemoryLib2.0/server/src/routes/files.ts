import { Router } from "express";
import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import { resolveEventThumbnail } from "../services/event-thumbnail.js";
import {
  getPresignedGetUrl,
  isStorageConfigured,
  pipeObjectToResponse,
} from "../services/storage.js";
import { sendInternalError } from "../utils/http-error-map.js";

export const filesRouter = Router();

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function safeObjectKey(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }
  const k = raw.trim();
  if (k.includes("..")) {
    return null;
  }
  return k;
}

filesRouter.get("/event-thumb", async (req, res, next) => {
  try {
    const eventId =
      typeof req.query.eventId === "string" ? req.query.eventId.trim() : "";
    if (!eventId) {
      res.status(400).json({ error: "invalid_eventId" });
      return;
    }
    const thumb = await resolveEventThumbnail(eventId);
    if (!thumb) {
      res.redirect(
        302,
        `/api/files/placeholder?event=${encodeURIComponent(eventId)}`,
      );
      return;
    }
    if ('redirectUrl' in thumb) {
      res.redirect(302, thumb.redirectUrl);
      return;
    }
    res.setHeader("Content-Type", thumb.contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(thumb.buffer);
  } catch (e) {
    next(e);
  }
});

filesRouter.get("/placeholder", (_req, res) => {
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(PNG_1X1);
});

filesRouter.get("/object", async (req, res, next) => {
  try {
    const key = safeObjectKey(req.query.key);
    if (!key) {
      res.status(400).json({ error: "invalid_key" });
      return;
    }
    if (!isStorageConfigured()) {
      res.status(503).json({ error: "storage_not_configured" });
      return;
    }
    if (!isMemoriaDevLite()) {
      const url = await getPresignedGetUrl(key);
      res.redirect(302, url);
      return;
    }
    await pipeObjectToResponse(key, res);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    const msg = e instanceof Error ? e.message : String(e);
    if (code === "ENOENT" || /NoSuchKey|NotFound/i.test(msg)) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    if (!res.headersSent) {
      sendInternalError(res, e);
      return;
    }
    next(e);
  }
});
