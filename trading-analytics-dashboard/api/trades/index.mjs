import { app } from "@azure/functions";
import { listTrades, addTrade } from "../../shared/store.mjs";

app.http("trades", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (req) => {
    if (req.method === "GET") {
      return { jsonBody: listTrades() };
    }

    if (req.method === "POST") {
      const payload = (await req.json().catch(() => ({}))) ?? {};
      if (!payload?.symbol || !payload?.date) {
        return {
          status: 400,
          jsonBody: { error: "Missing required trade fields." },
        };
      }
      const trade = addTrade(payload);
      return { status: 201, jsonBody: trade };
    }

    return { status: 405 };
  },
});
