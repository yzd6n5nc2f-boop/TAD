import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  listTrades,
  addTrade,
  listSessions,
  listSymbols,
  updateSettings,
  clearStore,
} from "../shared/store.mjs";
import { buildAnalysisPrompt } from "../shared/analysis.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

export function createApiApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  app.get("/api/trades", (_req, res) => {
    res.json(listTrades());
  });

  app.post("/api/trades", (req, res) => {
    const payload = req.body ?? {};
    if (!payload?.symbol || !payload?.date) {
      return res.status(400).json({ error: "Missing required trade fields." });
    }
    const trade = addTrade(payload);
    return res.status(201).json(trade);
  });

  app.get("/api/sessions", (_req, res) => {
    res.json(listSessions());
  });

  app.get("/api/symbols", (_req, res) => {
    res.json(listSymbols());
  });

  app.post("/api/settings", (req, res) => {
    const settings = req.body ?? {};
    if (!settings?.currency || !settings?.timezone || !settings?.defaultMonth) {
      return res.status(400).json({ error: "Missing required settings fields." });
    }
    return res.json(updateSettings(settings));
  });

  app.post("/api/admin/clear", (_req, res) => {
    const state = clearStore();
    return res.json({
      ok: true,
      trades: state.trades.length,
      ts: new Date().toISOString(),
    });
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { trades, question } = req.body ?? {};
      if (!Array.isArray(trades)) {
        return res.status(400).json({ error: "Missing 'trades' array." });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "OPENAI_API_KEY is not set. Add it to server/.env.",
        });
      }

      const client = new OpenAI({ apiKey });
      const prompt = buildAnalysisPrompt(trades, question);

      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        input: prompt,
      });

      res.json({
        ok: true,
        text: response.output_text,
        id: response.id,
      });
    } catch (err) {
      const message = err?.message || String(err);
      res.status(500).json({ error: message });
    }
  });

  const distPath = path.join(__dirname, "..", "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      return res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

export function startServer(port = Number(process.env.PORT || 7071)) {
  const app = createApiApp();
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`TAD API server listening on http://localhost:${port}`);
      resolve(server);
    });
    server.on("error", reject);
  });
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  startServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
