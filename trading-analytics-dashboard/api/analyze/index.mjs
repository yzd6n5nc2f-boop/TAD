import { app } from "@azure/functions";
import OpenAI from "openai";
import { buildAnalysisPrompt } from "../../shared/analysis.mjs";

app.http("analyze", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (req) => {
    try {
      const { trades, question } = (await req.json().catch(() => ({}))) ?? {};
      if (!Array.isArray(trades)) {
        return { status: 400, jsonBody: { error: "Missing 'trades' array." } };
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return {
          status: 400,
          jsonBody: { error: "OPENAI_API_KEY is not set." },
        };
      }

      const client = new OpenAI({ apiKey });
      const prompt = buildAnalysisPrompt(trades, question);
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        input: prompt,
      });

      return {
        jsonBody: { ok: true, text: response.output_text, id: response.id },
      };
    } catch (err) {
      const message = err?.message || String(err);
      return { status: 500, jsonBody: { error: message } };
    }
  },
});
