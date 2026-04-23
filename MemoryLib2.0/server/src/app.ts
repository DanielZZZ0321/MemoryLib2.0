import cors from "cors";
import express from "express";
import multer from "multer";
import { adminRouter } from "./routes/admin.js";
import { chatRouter } from "./routes/chat.js";
import { filesRouter } from "./routes/files.js";
import { eventsRouter } from "./routes/events.js";
import { keywordsRouter } from "./routes/keywords.js";
import { workspacesRouter } from "./routes/workspaces.js";
import { healthGeminiRouter } from "./routes/health-gemini.js";
import { sendInternalError } from "./utils/http-error-map.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "memoria" });
  });

  app.use("/api/health", healthGeminiRouter);

  app.use("/api/files", filesRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/keywords", keywordsRouter);
  app.use("/api/workspaces", workspacesRouter);
  app.use("/api/chat", chatRouter);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "file_too_large" });
          return;
        }
        res.status(400).json({ error: "upload_error", code: err.code });
        return;
      }
      console.error(err);
      sendInternalError(res, err);
    },
  );

  return app;
}
