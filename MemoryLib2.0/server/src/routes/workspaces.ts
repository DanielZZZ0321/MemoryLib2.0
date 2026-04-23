import { Router } from "express";
import { isDatabaseReady } from "../db/pool.js";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  getWorkspaceEvents,
  isWorkspaceBackendAvailable,
  listWorkspaces,
  updateWorkspace,
} from "../mvp/workspace-db.js";

export const workspacesRouter = Router();

workspacesRouter.get("/", async (_req, res, next) => {
  try {
    if (!isDatabaseReady() || !isWorkspaceBackendAvailable()) {
      res.status(503).json({ error: "workspace_backend_unavailable" });
      return;
    }
    const items = await listWorkspaces();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

workspacesRouter.post("/", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isWorkspaceBackendAvailable()) {
      res.status(503).json({ error: "workspace_backend_unavailable" });
      return;
    }
    const body = req.body as {
      name?: string;
      description?: string | null;
      filter_criteria?: Record<string, unknown>;
    };
    if (!body.name || typeof body.name !== "string") {
      res.status(400).json({ error: "invalid_body", message: "需要 name" });
      return;
    }
    const id = await createWorkspace({
      name: body.name,
      description: body.description,
      filter_criteria: body.filter_criteria,
    });
    res.status(201).json({ id });
  } catch (e) {
    next(e);
  }
});

workspacesRouter.get("/:id/events", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isWorkspaceBackendAvailable()) {
      res.status(503).json({ error: "workspace_backend_unavailable" });
      return;
    }
    const w = await getWorkspace(req.params.id);
    if (!w) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    const items = await getWorkspaceEvents(req.params.id);
    res.json({ id: req.params.id, items });
  } catch (e) {
    next(e);
  }
});

workspacesRouter.get("/:id", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isWorkspaceBackendAvailable()) {
      res.status(503).json({ error: "workspace_backend_unavailable" });
      return;
    }
    const w = await getWorkspace(req.params.id);
    if (!w) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    res.json(w);
  } catch (e) {
    next(e);
  }
});

workspacesRouter.put("/:id", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isWorkspaceBackendAvailable()) {
      res.status(503).json({ error: "workspace_backend_unavailable" });
      return;
    }
    const body = req.body as {
      name?: string;
      description?: string | null;
      filter_criteria?: Record<string, unknown>;
    };
    const ok = await updateWorkspace(req.params.id, body);
    if (!ok) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    const w = await getWorkspace(req.params.id);
    res.json(w);
  } catch (e) {
    next(e);
  }
});

workspacesRouter.delete("/:id", async (req, res, next) => {
  try {
    if (!isDatabaseReady() || !isWorkspaceBackendAvailable()) {
      res.status(503).json({ error: "workspace_backend_unavailable" });
      return;
    }
    const ok = await deleteWorkspace(req.params.id);
    if (!ok) {
      res.status(404).json({ error: "not_found", id: req.params.id });
      return;
    }
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
