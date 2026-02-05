import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["--watch", "./server/index.mjs"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "development",
    PORT: process.env.PORT || "7071",
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
