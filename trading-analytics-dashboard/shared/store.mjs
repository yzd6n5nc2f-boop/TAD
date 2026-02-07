import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clone = (value) => {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const isNode = typeof process !== "undefined" && Boolean(process.versions?.node);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDataPath = path.join(__dirname, "..", ".data", "tad-store.json");
const dataPath = process.env.TAD_DATA_PATH || defaultDataPath;

const ensureDir = () => {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
};

const loadFromDisk = () => {
  try {
    const raw = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err?.code === "ENOENT") {
      ensureDir();
      const seeded = clone(seedData);
      fs.writeFileSync(dataPath, JSON.stringify(seeded, null, 2));
      return seeded;
    }
    throw err;
  }
};

const saveToDisk = (data) => {
  ensureDir();
  const tmpPath = `${dataPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, dataPath);
};

const monthFromDate = (date) => {
  const d = new Date(date);
  const shortYear = `${d.getFullYear()}`.slice(-2);
  return `${d.toLocaleString("en-GB", { month: "short" })}${shortYear}`;
};

const currentMonthLabel = () => monthFromDate(new Date().toISOString());

export const seedData = {
  trades: [],
  sessions: [
    { name: "London", region: "Europe", open: "08:00", close: "16:30" },
    { name: "New York", region: "Americas", open: "13:30", close: "21:00" },
    { name: "Tokyo", region: "Asia", open: "00:00", close: "08:00" },
  ],
  symbols: [
    { symbol: "NAS100", description: "US Tech 100 CFD" },
    { symbol: "GBP/USD", description: "British Pound / US Dollar" },
    { symbol: "Gold", description: "Spot Gold" },
    { symbol: "EUR/JPY", description: "Euro / Japanese Yen" },
  ],
  settings: {
    currency: "GBP",
    timezone: "UTC",
    defaultMonth: currentMonthLabel(),
  },
};

let store = null;

export function getStore() {
  if (!store) {
    store = isNode ? loadFromDisk() : clone(seedData);
  }
  return store;
}

export function resetStore() {
  store = clone(seedData);
  if (isNode) saveToDisk(store);
  return store;
}

export function clearStore() {
  const current = getStore();
  store = {
    ...current,
    trades: [],
    settings: {
      ...current.settings,
      defaultMonth: currentMonthLabel(),
    },
  };
  if (isNode) saveToDisk(store);
  return store;
}

export function listTrades() {
  return getStore().trades;
}

export function addTrade(input) {
  const trade = { ...input, id: input.id ?? `T-${Date.now()}` };
  const current = getStore();
  store = { ...current, trades: [trade, ...current.trades] };
  if (isNode) saveToDisk(store);
  return trade;
}

export function listSessions() {
  return getStore().sessions;
}

export function listSymbols() {
  return getStore().symbols;
}

export function updateSettings(settings) {
  const current = getStore();
  store = { ...current, settings };
  if (isNode) saveToDisk(store);
  return settings;
}
