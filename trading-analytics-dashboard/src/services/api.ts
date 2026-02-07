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

const STORAGE_KEY = "ta-dashboard-data-v2";
let memoryStore: StoredData | null = null;

function monthFromDate(date: string) {
  const d = new Date(date);
  const shortYear = `${d.getFullYear()}`.slice(-2);
  return `${d.toLocaleString("en-GB", { month: "short" })}${shortYear}`;
}

function currentMonthLabel() {
  return monthFromDate(new Date().toISOString());
}

const seedData: StoredData = {
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
