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
  trades: [
    {
      id: "T-1001",
      date: "2025-09-04",
      symbol: "NAS100",
      direction: "Long",
      entry: 15432,
      exit: 15580,
      size: 2,
      pnl: 296,
      session: "London",
      notes: "Breakout after CPI",
      isExitRecord: true,
    },
    {
      id: "T-1002",
      date: "2025-10-11",
      symbol: "GBP/USD",
      direction: "Short",
      entry: 1.245,
      exit: 1.238,
      size: 3,
      pnl: 420,
      session: "New York",
      notes: "NY open momentum",
      isExitRecord: true,
    },
    {
      id: "T-1003",
      date: "2025-11-02",
      symbol: "Gold",
      direction: "Long",
      entry: 1988,
      exit: 1980,
      size: 1,
      pnl: -160,
      session: "Tokyo",
      notes: "Reversal failed",
      isExitRecord: true,
    },
    {
      id: "T-1004",
      date: "2025-12-05",
      symbol: "NAS100",
      direction: "Short",
      entry: 16012,
      exit: 15870,
      size: 2,
      pnl: 284,
      session: "London",
      notes: "Intraday fade",
      isExitRecord: true,
    },
    {
      id: "T-1005",
      date: "2025-12-12",
      symbol: "EUR/JPY",
      direction: "Long",
      entry: 163.1,
      exit: 162.4,
      size: 4,
      pnl: -280,
      session: "Tokyo",
      notes: "News whipsaw",
      isExitRecord: true,
    },
    {
      id: "T-1006",
      date: "2025-12-18",
      symbol: "GBP/USD",
      direction: "Long",
      entry: 1.257,
      exit: 1.262,
      size: 5,
      pnl: 250,
      session: "New York",
      notes: "Trend continuation",
      isExitRecord: true,
    },
    {
      id: "T-1007",
      date: "2025-12-22",
      symbol: "Gold",
      direction: "Short",
      entry: 2012,
      exit: 2002,
      size: 2,
      pnl: 200,
      session: "London",
      notes: "Mean reversion",
      isExitRecord: true,
    },
  ],
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
