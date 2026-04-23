import { Router } from "express";
import { isDatabaseReady } from "../db/pool.js";
import {
  addEventModule,
  deleteEventModule,
  getEventById,
  isEventsBackendAvailable,
  listEvents,
  searchEventsByText,
  setEventHighlight,
  updateEvent,
  updateEventModule,
} from "../mvp/event-db.js";
export const eventsRouter = Router();

eventsRouter.get("/", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "events_backend_unavailable" });
      return;
    }
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    if (q) {
      const items = await searchEventsByText(q, pageSize);
      res.json({ items, page: 1, pageSize: items.length, total: items.length });
      return;
    }
    const { items, total } = await listEvents(page, pageSize);
    res.json({ items, page, pageSize, total });
  } catch (e) {
    next(e);
  }
});

eventsRouter.get("/:id", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "events_backend_unavailable" });
      return;
    }
    const ev = await getEventById(req.params.id);
    if (!ev) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    res.json(ev);
  } catch (e) {
    next(e);
  }
});

eventsRouter.put("/:id", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "events_backend_unavailable" });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const patch: Parameters<typeof updateEvent>[1] = {};
    if (typeof body.title === "string") {
      patch.title = body.title;
    }
    if ("summary" in body) {
      patch.summary =
        body.summary === null || body.summary === undefined
          ? null
          : String(body.summary);
    }
    if ("start_time" in body) {
      patch.start_time =
        body.start_time === null || body.start_time === undefined
          ? null
          : String(body.start_time);
    }
    if ("end_time" in body) {
      patch.end_time =
        body.end_time === null || body.end_time === undefined
          ? null
          : String(body.end_time);
    }
    if ("location" in body) {
      patch.location =
        body.location === null || body.location === undefined
          ? null
          : String(body.location);
    }
    if ("event_type" in body) {
      patch.event_type =
        body.event_type === null || body.event_type === undefined
          ? null
          : String(body.event_type);
    }
    if (Array.isArray(body.tags)) {
      patch.tags = body.tags.map(String);
    }
    const ok = await updateEvent(req.params.id, patch);
    if (!ok) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    const ev = await getEventById(req.params.id);
    res.json(ev);
  } catch (e) {
    next(e);
  }
});

eventsRouter.post("/:id/modules", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "events_backend_unavailable" });
      return;
    }
    const body = req.body as {
      module_type?: string;
      title?: string | null;
      content?: unknown;
      raw_source_ids?: string[];
      sort_order?: number;
    };
    if (!body.module_type || typeof body.module_type !== "string") {
      res.status(400).json({ error: "invalid_body", message: "需要 module_type" });
      return;
    }
    const mid = await addEventModule(req.params.id, {
      module_type: body.module_type,
      title: body.title,
      content: body.content,
      raw_source_ids: body.raw_source_ids,
      sort_order: body.sort_order,
    });
    if (!mid) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    res.status(201).json({ id: mid });
  } catch (e) {
    next(e);
  }
});

eventsRouter.put("/:id/modules/:moduleId", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "events_backend_unavailable" });
      return;
    }
    const body = req.body as {
      title?: string | null;
      content?: unknown;
      raw_source_ids?: string[];
      sort_order?: number;
    };
    const ok = await updateEventModule(req.params.id, req.params.moduleId, body);
    if (!ok) {
      res.status(404).json({
        error: "not_found",
        id: req.params.id,
        moduleId: req.params.moduleId,
      });
      return;
    }
    const ev = await getEventById(req.params.id);
    res.json(ev);
  } catch (e) {
    next(e);
  }
});

eventsRouter.delete("/:id/modules/:moduleId", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "events_backend_unavailable" });
      return;
    }
    const ok = await deleteEventModule(req.params.id, req.params.moduleId);
    if (!ok) {
      res.status(404).json({
        error: "not_found",
        id: req.params.id,
        moduleId: req.params.moduleId,
      });
      return;
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

eventsRouter.post("/:id/highlight", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "events_backend_unavailable" });
      return;
    }
    const on =
      typeof req.body?.is_highlighted === "boolean"
        ? req.body.is_highlighted
        : Boolean(req.body?.highlighted);
    const ok = await setEventHighlight(req.params.id, on);
    if (!ok) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    res.json({ ok: true, is_highlighted: on });
  } catch (e) {
    next(e);
  }
});
