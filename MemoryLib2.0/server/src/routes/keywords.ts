import { Router } from "express";
import { isDatabaseReady } from "../db/pool.js";
import { isEventsBackendAvailable } from "../mvp/event-db.js";
import {
  addEventToKeyword,
  buildKeywordGraph,
  listKeywordsWithEvents,
  regenerateKeywordsHeuristic,
  regenerateKeywordsWithGemini,
} from "../mvp/keyword-db.js";

export const keywordsRouter = Router();

keywordsRouter.get("/graph", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "backend_unavailable" });
      return;
    }
    const d = req.query.dimension;
    if (d === "both") {
      const [person, keyword] = await Promise.all([
        buildKeywordGraph("person"),
        buildKeywordGraph("keyword"),
      ]);
      res.json({ person, keyword });
      return;
    }
    const dimension = d === "person" ? "person" : "keyword";
    const graph = await buildKeywordGraph(dimension);
    res.json(graph);
  } catch (e) {
    next(e);
  }
});

keywordsRouter.get("/", async (_req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "backend_unavailable" });
      return;
    }
    const [person, keyword] = await Promise.all([
      listKeywordsWithEvents("person"),
      listKeywordsWithEvents("keyword"),
    ]);
    res.json({ person, keyword });
  } catch (e) {
    next(e);
  }
});

keywordsRouter.post("/regenerate", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "backend_unavailable" });
      return;
    }
    const body = req.body as { dimension?: string; useGemini?: boolean };
    const dim =
      body.dimension === "person" || body.dimension === "keyword"
        ? body.dimension
        : "keyword";
    if (body.useGemini) {
      await regenerateKeywordsWithGemini(dim);
    } else {
      await regenerateKeywordsHeuristic(dim);
    }
    res.json({ ok: true, dimension: dim });
  } catch (e) {
    next(e);
  }
});

keywordsRouter.get("/:dimension", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "backend_unavailable" });
      return;
    }
    const { dimension } = req.params;
    if (dimension !== "person" && dimension !== "keyword") {
      res.status(400).json({ error: "invalid_dimension" });
      return;
    }
    const keywords = await listKeywordsWithEvents(dimension);
    res.json({ dimension, keywords });
  } catch (e) {
    next(e);
  }
});

keywordsRouter.post("/:keywordId/events", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "backend_unavailable" });
      return;
    }
    const eventId =
      typeof req.body?.eventId === "string"
        ? req.body.eventId
        : typeof req.body?.event_id === "string"
          ? req.body.event_id
          : "";
    if (!eventId) {
      res.status(400).json({ error: "invalid_body", message: "需要 eventId" });
      return;
    }
    const ok = await addEventToKeyword(req.params.keywordId, eventId);
    if (!ok) {
      res.status(400).json({ error: "add_failed", keywordId: req.params.keywordId });
      return;
    }
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});
