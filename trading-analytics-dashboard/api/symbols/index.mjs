import { app } from "@azure/functions";
import { listSymbols } from "../../shared/store.mjs";

app.http("symbols", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async () => {
    return { jsonBody: listSymbols() };
  },
});
