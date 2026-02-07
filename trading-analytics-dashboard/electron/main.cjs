const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const { spawn } = require("node:child_process");
const http = require("node:http");

const isDev = process.argv.includes("--dev");
const rootDir = path.join(__dirname, "..");
const apiPort = process.env.PORT || "7071";
const apiHealthUrl = `http://127.0.0.1:${apiPort}/api/health`;

let apiProcess = null;

function waitForUrl(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
          return;
        }
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(poll, 400);
      });

      req.on("error", () => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(poll, 400);
      });
    };

    poll();
  });
}

function startApiServer() {
  if (apiProcess) return;
  const serverEntry = path.join(rootDir, "server", "index.mjs");
  apiProcess = spawn(process.execPath, [serverEntry], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: apiPort,
    },
    stdio: "inherit",
  });

  apiProcess.on("exit", () => {
    apiProcess = null;
  });
}

function stopApiServer() {
  if (!apiProcess) return;
  apiProcess.kill("SIGTERM");
}

async function createMainWindow() {
  await waitForUrl(apiHealthUrl);
  if (isDev) {
    await waitForUrl("http://127.0.0.1:5173/");
  }

  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const targetUrl = isDev ? "http://127.0.0.1:5173/" : `http://127.0.0.1:${apiPort}/`;
  await win.loadURL(targetUrl);
}

app.on("before-quit", () => {
  stopApiServer();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.whenReady().then(async () => {
  startApiServer();
  await createMainWindow();
});
