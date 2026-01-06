export type Trade = {
  id: string;
  date: string;
  symbol: string;
  direction: "Long" | "Short";
  entry: number;
  exit?: number;
  size: number;
  pnl: number;
  session?: string;
  notes?: string;
  isExitRecord?: boolean;
};

export type NewTrade = Omit<Trade, "id">;

export type Session = {
  name: string;
  region: string;
  open: string;
  close: string;
};

export type Symbol = {
  symbol: string;
  description: string;
};

export type Settings = {
  currency: "GBP" | "USD";
  timezone: string;
  defaultMonth: string;
};

type StoredData = {
  trades: Trade[];
  sessions: Session[];
  symbols: Symbol[];
  settings: Settings;
};

const STORAGE_KEY = "ta-dashboard-data-v1";
let memoryStore: StoredData | null = null;

const seedData: StoredData = {
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
    defaultMonth: "Dec25",
  },
};

function getLocal(): StoredData {
  if (memoryStore) return memoryStore;
  if (typeof window === "undefined" || !window.localStorage) {
    memoryStore = { ...seedData };
    return memoryStore;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      memoryStore = JSON.parse(raw) as StoredData;
      return memoryStore;
    } catch (err) {
      console.warn("Failed to parse local data", err);
    }
  }

  memoryStore = { ...seedData };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
  return memoryStore;
}

function persist(data: StoredData) {
  memoryStore = data;
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

async function tryApi<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (_err) {
    return null;
  }
}

export async function health(): Promise<{ ok: boolean; source: "api" | "local" }> {
  const apiHealth = await tryApi<{ ok: boolean }>("/api/health");
  if (apiHealth?.ok) return { ok: true, source: "api" };
  return { ok: true, source: "local" };
}

export async function listTrades(): Promise<Trade[]> {
  const apiTrades = await tryApi<Trade[]>("/api/trades");
  if (apiTrades) return apiTrades;
  return getLocal().trades;
}

export async function createTrade(input: NewTrade): Promise<Trade> {
  const payload = { ...input, id: `T-${Date.now()}` } satisfies Trade;
  const apiTrade = await tryApi<Trade>("/api/trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (apiTrade) return apiTrade;

  const store = getLocal();
  const updated = { ...store, trades: [payload, ...store.trades] };
  persist(updated);
  return payload;
}

export async function listSessions(): Promise<Session[]> {
  const apiSessions = await tryApi<Session[]>("/api/sessions");
  if (apiSessions) return apiSessions;
  return getLocal().sessions;
}

export async function listSymbols(): Promise<Symbol[]> {
  const apiSymbols = await tryApi<Symbol[]>("/api/symbols");
  if (apiSymbols) return apiSymbols;
  return getLocal().symbols;
}

export async function updateSettings(settings: Settings): Promise<Settings> {
  const apiSettings = await tryApi<Settings>("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });

  if (apiSettings) return apiSettings;

  const store = getLocal();
  const updated = { ...store, settings };
  persist(updated);
  return settings;
}
