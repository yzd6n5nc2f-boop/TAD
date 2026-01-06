import { app } from "@azure/functions";

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    return {
      jsonBody: { ok: true, data: { status: "ok", time: new Date().toISOString() } }
    };
  }
});