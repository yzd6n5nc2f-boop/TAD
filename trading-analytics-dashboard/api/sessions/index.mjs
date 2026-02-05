import { app } from "@azure/functions";
import { listSessions } from "../../shared/store.mjs";

app.http("sessions", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    return { jsonBody: listSessions() };
  },
});
