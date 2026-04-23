import { Router } from "express";
import {
  isGeminiConfigured,
  llmConfigHint,
  pingGemini,
  resolveLlmConfig,
} from "../services/gemini-client.js";

export const healthGeminiRouter = Router();

healthGeminiRouter.get("/gemini", async (_req, res) => {
  const meta = resolveLlmConfig();
  if (!isGeminiConfigured()) {
    res.status(503).json({
      ok: false,
      configured: false,
      message: llmConfigHint(),
      provider: meta.provider,
    });
    return;
  }

  try {
    const reply = await pingGemini();
    res.json({
      ok: true,
      configured: true,
      provider: meta.provider,
      model: meta.model,
      baseUrl: meta.baseUrl,
      reply,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(502).json({
      ok: false,
      configured: true,
      provider: meta.provider,
      model: meta.model,
      error: message,
    });
  }
});
