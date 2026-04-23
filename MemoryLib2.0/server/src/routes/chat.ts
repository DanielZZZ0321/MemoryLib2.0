import { Router } from "express";
import { isDatabaseReady } from "../db/pool.js";
import {
  getEventById,
  isEventsBackendAvailable,
  searchEventsByText,
} from "../mvp/event-db.js";
import {
  generateText,
  isGeminiConfigured,
  streamText,
  type ChatMessage,
} from "../services/gemini-client.js";

export const chatRouter = Router();

chatRouter.post("/", async (req, res, next) => {
  try {
    if (!isGeminiConfigured()) {
      res.status(503).json({ error: "llm_not_configured" });
      return;
    }
    const messages = req.body?.messages as ChatMessage[] | undefined;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        error: "invalid_body",
        message: "需要 messages 数组",
      });
      return;
    }
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    (res as { flushHeaders?: () => void }).flushHeaders?.();
    try {
      for await (const chunk of streamText({ messages })) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.end();
    }
  } catch (e) {
    next(e);
  }
});

chatRouter.post("/query-events", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isEventsBackendAvailable()) {
      res.status(503).json({ error: "backend_unavailable" });
      return;
    }
    const q = typeof req.body?.query === "string" ? req.body.query.trim() : "";
    if (!q) {
      res.status(400).json({ error: "invalid_query" });
      return;
    }
    const items = await searchEventsByText(q, 30);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

chatRouter.post("/analyze-event", async (req, res, next) => {
  try {
    if (!isGeminiConfigured()) {
      res.status(503).json({ error: "llm_not_configured" });
      return;
    }
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
      res.status(400).json({ error: "invalid_eventId" });
      return;
    }
    const ev = await getEventById(eventId);
    if (!ev) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    const analysis = await generateText({
      messages: [
        {
          role: "user",
          content: `请用中文简要分析以下记忆事件（标题、摘要、标签），给出 3～5 条洞察，段落形式即可：\n标题：${ev.title}\n摘要：${ev.summary ?? ""}\n标签：${ev.tags.join(",")}`,
        },
      ],
      maxTokens: 800,
    });
    res.json({ analysis });
  } catch (e) {
    next(e);
  }
});

chatRouter.post("/generate-tasks", async (req, res, next) => {
  try {
    if (!isGeminiConfigured()) {
      res.status(503).json({ error: "llm_not_configured" });
      return;
    }
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
      res.status(400).json({ error: "invalid_eventId" });
      return;
    }
    const ev = await getEventById(eventId);
    if (!ev) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    const raw = await generateText({
      messages: [
        {
          role: "user",
          content: `根据事件生成 3～8 条可执行的后续待办（中文）。仅返回 JSON 数组，元素形如 {"title":"...","priority":"low|medium|high"}。\n事件：${ev.title}\n${ev.summary ?? ""}`,
        },
      ],
      maxTokens: 600,
    });
    let tasks: unknown[] = [];
    try {
      const m = raw.match(/\[[\s\S]*\]/);
      tasks = JSON.parse(m?.[0] ?? raw) as unknown[];
    } catch {
      tasks = [];
    }
    res.json({ tasks });
  } catch (e) {
    next(e);
  }
});
