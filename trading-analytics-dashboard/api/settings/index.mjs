import { app } from "@azure/functions";
import { updateSettings } from "../../shared/store.mjs";

app.http("settings", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (req) => {
    const settings = (await req.json().catch(() => ({}))) ?? {};
    if (!settings?.currency || !settings?.timezone || !settings?.defaultMonth) {
      return {
        status: 400,
        jsonBody: { error: "Missing required settings fields." },
      };
    }
    return { jsonBody: updateSettings(settings) };
  },
});
