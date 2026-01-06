import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Area,
  AreaChart,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  ListOrdered,
  Clock3,
  Boxes,
  FilePieChart,
  Settings,
  LineChart as LineChartIcon,
  CalendarDays,
  ChevronDown,
  Dot,
  MoreHorizontal,
  Upload,
  Plus,
  Link2,
} from "lucide-react";
import {
  Trade,
  Session,
  Symbol,
  Settings as UserSettings,
  listTrades,
  listSessions,
  listSymbols,
  createTrade,
  updateSettings,
} from "../services/api";

type TabKey =
  | "dashboard"
  | "trades"
  | "sessions"
  | "symbols"
  | "tradingview"
  | "reports"
  | "settings";

type TradeForm = {
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

declare global {
  interface Window {
    TradingView: any;
  }
}

const monthOptions = ["Sep25", "Oct25", "Nov25", "Dec25"];

const TradingViewWidget: React.FC<{ symbol: string }> = ({ symbol }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!window.TradingView || !containerRef.current) {
        setLoadError(true);
        return;
      }
      containerRef.current.innerHTML = "";
      try {
        new window.TradingView.widget({
          autosize: true,
          symbol,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          toolbar_bg: "#f3f6fb",
          enable_publishing: false,
          allow_symbol_change: true,
          save_image: true,
          container_id: containerRef.current.id,
        });
      } catch (err) {
        console.warn("Failed to init TradingView", err);
        setLoadError(true);
      }
    };
    script.onerror = () => setLoadError(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [symbol]);

  return (
    <div className="widget-frame" style={{ minHeight: 640 }}>
      <div className="surface-padding flex-between">
        <div>
          <p className="card-title" style={{ margin: 0 }}>NAS100 Advanced Chart</p>
          <p className="card-subtext">Powered by TradingView</p>
        </div>
        <div className="pill-muted">Live</div>
      </div>
      <div
        id="tradingview_widget"
        ref={containerRef}
        style={{ height: 600 }}
        aria-label="TradingView chart"
      />
      {loadError && (
        <div className="surface-padding" style={{ color: "#b91c1c" }}>
          Unable to load TradingView right now. Please try again later.
        </div>
      )}
    </div>
  );
};

function formatCurrency(value: number, currency: "GBP" | "USD") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function monthFromDate(date: string) {
  const d = new Date(date);
  const shortYear = `${d.getFullYear()}`.slice(-2);
  return `${d.toLocaleString("en-GB", { month: "short" })}${shortYear}`;
}

function computeDrawdown(series: { pnl: number }[]) {
  let peak = 0;
  let maxDd = 0;
  let equity = 0;
  series.forEach((p) => {
    equity += p.pnl;
    peak = Math.max(peak, equity);
    maxDd = Math.min(maxDd, equity - peak);
  });
  return maxDd;
}

const StatCard: React.FC<{ title: string; value: string; accent?: string }> = ({
  title,
  value,
  accent,
}) => (
  <div className="stat-card">
    <div className="stat-title">{title}</div>
    <div className="stat-value" style={{ color: accent ?? "#0f172a" }}>
      {value}
    </div>
  </div>
);

const DetailField: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="detail-row">
    <div className="detail-label">{label}</div>
    <div className="detail-value">{value}</div>
  </div>
);

const Card: React.FC<React.PropsWithChildren<{ title?: string; actions?: React.ReactNode }>> = ({
  title,
  actions,
  children,
}) => (
  <div className="surface-card surface-padding">
    {title && (
      <div className="flex-between" style={{ marginBottom: 6 }}>
        <p className="card-title" style={{ margin: 0 }}>
          {title}
        </p>
        {actions}
      </div>
    )}
    {children}
  </div>
);

const TableHeader: React.FC<{ columns: string[] }> = ({ columns }) => (
  <thead>
    <tr>
      {columns.map((col) => (
        <th key={col}>{col}</th>
      ))}
    </tr>
  </thead>
);

const DashboardView: React.FC<{
  trades: Trade[];
  selectedTrade?: Trade;
  onSelectTrade: (trade: Trade) => void;
  currency: "GBP" | "USD";
  exitsOnly: boolean;
  onToggleExits: () => void;
  activeMonth: string;
  onMonthChange: (m: string) => void;
}> = ({
  trades,
  selectedTrade,
  onSelectTrade,
  currency,
  exitsOnly,
  onToggleExits,
  activeMonth,
  onMonthChange,
}) => {
  const filtered = useMemo(
    () =>
      trades
        .filter((t) => monthFromDate(t.date) === activeMonth)
        .filter((t) => (exitsOnly ? Boolean(t.exit) || t.isExitRecord : true)),
    [trades, activeMonth, exitsOnly]
  );

  const stats = useMemo(() => {
    const net = filtered.reduce((acc, t) => acc + t.pnl, 0);
    const wins = filtered.filter((t) => t.pnl > 0);
    const losses = filtered.filter((t) => t.pnl < 0);
    const winRate = filtered.length ? (wins.length / filtered.length) * 100 : 0;
    const avgWin = wins.length ? wins.reduce((acc, t) => acc + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((acc, t) => acc + t.pnl, 0) / losses.length : 0;
    const drawdown = computeDrawdown(filtered);

    return { net, winRate, avgWin, avgLoss, totalTrades: filtered.length, drawdown };
  }, [filtered]);

  const equityCurve = useMemo(() => {
    let running = 0;
    return filtered
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((trade) => {
        running += trade.pnl;
        return { date: trade.date, equity: running, pnl: trade.pnl };
      });
  }, [filtered]);

  const dailyPnL = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((t) => {
      map.set(t.date, (map.get(t.date) ?? 0) + t.pnl);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, value]) => ({ date, pnl: value }));
  }, [filtered]);

  const trade = selectedTrade ?? filtered[0];

  return (
    <div className="content">
      <div className="surface-card surface-padding">
        <div className="month-row">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {monthOptions.map((m) => (
              <button
                key={m}
                className={`month-chip ${activeMonth === m ? "active" : ""}`}
                onClick={() => onMonthChange(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="toggle" style={{ marginLeft: "auto" }}>
            Exits only
            <div className={`switch ${exitsOnly ? "on" : ""}`} onClick={onToggleExits} />
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard title="Net P&L" value={formatCurrency(stats.net, currency)} />
        <StatCard title="Total Trades" value={`${stats.totalTrades}`} />
        <StatCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
        <StatCard title="Avg Win" value={formatCurrency(stats.avgWin, currency)} accent="#16a34a" />
        <StatCard title="Avg Loss" value={formatCurrency(stats.avgLoss, currency)} accent="#dc2626" />
        <StatCard title="Max Drawdown" value={formatCurrency(stats.drawdown, currency)} />
      </div>

      <div className="grid-3">
        <Card title="Equity Curve">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve} margin={{ left: 0, right: 0, top: 12, bottom: 0 }}>
                <defs>
                  <linearGradient id="equity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f66c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2f66c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="equity" stroke="#2f66c7" fill="url(#equity)" strokeWidth={2} />
                <Line type="monotone" dataKey="equity" stroke="#1d4ed8" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Daily P&L">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPnL} margin={{ top: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {dailyPnL.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.pnl >= 0 ? "#16a34a" : "#dc2626"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Trade Details"
          actions={<MoreHorizontal size={18} color="#6b7280" aria-label="More options" />}
        >
          {trade ? (
            <div className="trade-details">
              <DetailField label="Symbol" value={trade.symbol} />
              <DetailField label="Direction" value={trade.direction} />
              <DetailField label="Entry" value={trade.entry} />
              <DetailField label="Exit" value={trade.exit ?? "-"} />
              <DetailField label="Size" value={trade.size} />
              <DetailField label="Session" value={trade.session ?? "-"} />
              <DetailField
                label="P&L"
                value={
                  <span className={trade.pnl >= 0 ? "positive" : "negative"}>
                    {formatCurrency(trade.pnl, currency)}
                  </span>
                }
              />
              <DetailField label="Notes" value={trade.notes ?? "--"} />
            </div>
          ) : (
            <div className="card-subtext">Select a trade to see details.</div>
          )}
        </Card>
      </div>

      <Card title="Recent Trades">
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <TableHeader columns={["Date", "Symbol", "Dir", "Entry", "Exit", "Size", "P&L", "Session"]} />
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => onSelectTrade(t)} style={{ cursor: "pointer" }}>
                  <td>{t.date}</td>
                  <td>{t.symbol}</td>
                  <td>
                    <span className="tag">
                      <Dot size={14} />
                      {t.direction}
                    </span>
                  </td>
                  <td>{t.entry}</td>
                  <td>{t.exit ?? "-"}</td>
                  <td>{t.size}</td>
                  <td className={t.pnl >= 0 ? "positive" : "negative"}>{formatCurrency(t.pnl, currency)}</td>
                  <td>{t.session ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span className="pill-muted">Prev</span>
          <span className="pill-muted">1</span>
          <span className="pill-muted">Next</span>
        </div>
      </Card>
    </div>
  );
};

const TradesView: React.FC<{
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
  onAddTrade: (trade: TradeForm) => Promise<void>;
  currency: "GBP" | "USD";
}> = ({ trades, onSelectTrade, onAddTrade, currency }) => {
  const [form, setForm] = useState<TradeForm>({
    date: new Date().toISOString().slice(0, 10),
    symbol: "NAS100",
    direction: "Long",
    entry: 0,
    exit: undefined,
    size: 1,
    pnl: 0,
    session: "London",
    notes: "",
    isExitRecord: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddTrade(form);
    setForm({ ...form, pnl: 0, entry: 0, exit: undefined, notes: "" });
  };

  const exportCsv = () => {
    const header = "id,date,symbol,direction,entry,exit,size,pnl,session";
    const rows = trades.map(
      (t) =>
        `${t.id},${t.date},${t.symbol},${t.direction},${t.entry},${t.exit ?? ""},${t.size},${t.pnl},${t.session ?? ""}`
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "trades.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="content">
      <Card
        title="Trades"
        actions={
          <div className="actions">
            <button className="button" onClick={exportCsv}>
              <Upload size={16} /> Export
            </button>
          </div>
        }
      >
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <TableHeader columns={["Date", "Symbol", "Dir", "Entry", "Exit", "Size", "P&L", "Session"]} />
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} onClick={() => onSelectTrade(t)} style={{ cursor: "pointer" }}>
                  <td>{t.date}</td>
                  <td>{t.symbol}</td>
                  <td>{t.direction}</td>
                  <td>{t.entry}</td>
                  <td>{t.exit ?? "-"}</td>
                  <td>{t.size}</td>
                  <td className={t.pnl >= 0 ? "positive" : "negative"}>{formatCurrency(t.pnl, currency)}</td>
                  <td>{t.session ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Add Trade">
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            <div className="detail-label">Date</div>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </label>
          <label>
            <div className="detail-label">Symbol</div>
            <input
              className="input"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              required
            />
          </label>
          <label>
            <div className="detail-label">Direction</div>
            <select
              className="select"
              value={form.direction}
              onChange={(e) => setForm({ ...form, direction: e.target.value as "Long" | "Short" })}
            >
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </label>
          <label>
            <div className="detail-label">Entry</div>
            <input
              className="input"
              type="number"
              value={form.entry}
              onChange={(e) => setForm({ ...form, entry: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            <div className="detail-label">Exit</div>
            <input
              className="input"
              type="number"
              value={form.exit ?? ""}
              onChange={(e) =>
                setForm({ ...form, exit: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </label>
          <label>
            <div className="detail-label">Size</div>
            <input
              className="input"
              type="number"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            <div className="detail-label">P&L</div>
            <input
              className="input"
              type="number"
              value={form.pnl}
              onChange={(e) => setForm({ ...form, pnl: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            <div className="detail-label">Session</div>
            <input
              className="input"
              value={form.session ?? ""}
              onChange={(e) => setForm({ ...form, session: e.target.value })}
            />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            <div className="detail-label">Notes</div>
            <textarea
              className="input"
              style={{ minHeight: 80 }}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label className="toggle">
              Exits only
              <div
                className={`switch ${form.isExitRecord ? "on" : ""}`}
                onClick={() => setForm({ ...form, isExitRecord: !form.isExitRecord })}
              />
            </label>
            <button className="button primary" type="submit">
              <Plus size={16} /> Save Trade
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const SessionsView: React.FC<{
  sessions: Session[];
  trades: Trade[];
  onAssign: (tradeId: string, session: string) => void;
}> = ({ sessions, trades, onAssign }) => {
  const [selectedTradeId, setSelectedTradeId] = useState(trades[0]?.id ?? "");
  const [selectedSession, setSelectedSession] = useState(sessions[0]?.name ?? "");

  return (
    <div className="content">
      <Card title="Sessions">
        <table className="table">
          <TableHeader columns={["Name", "Region", "Open", "Close"]} />
          <tbody>
            {sessions.map((s) => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td>{s.region}</td>
                <td>{s.open}</td>
                <td>{s.close}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Assign Trade to Session">
        <div className="form-grid">
          <label>
            <div className="detail-label">Trade</div>
            <select
              className="select"
              value={selectedTradeId}
              onChange={(e) => setSelectedTradeId(e.target.value)}
            >
              {trades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} — {t.symbol}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="detail-label">Session</div>
            <select
              className="select"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              {sessions.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="button primary" onClick={() => onAssign(selectedTradeId, selectedSession)}>
          <Link2 size={16} /> Link Trade
        </button>
      </Card>
    </div>
  );
};

const SymbolsView: React.FC<{ symbols: Symbol[]; onAdd: (s: Symbol) => void; onRemove: (sym: string) => void }> = ({
  symbols,
  onAdd,
  onRemove,
}) => {
  const [form, setForm] = useState<Symbol>({ symbol: "", description: "" });

  return (
    <div className="content">
      <Card title="Symbols">
        <table className="table">
          <TableHeader columns={["Symbol", "Description", ""]} />
          <tbody>
            {symbols.map((s) => (
              <tr key={s.symbol}>
                <td>{s.symbol}</td>
                <td>{s.description}</td>
                <td>
                  <button className="button" onClick={() => onRemove(s.symbol)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Add Symbol">
        <div className="form-grid">
          <label>
            <div className="detail-label">Symbol</div>
            <input
              className="input"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            />
          </label>
          <label>
            <div className="detail-label">Description</div>
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
        </div>
        <button
          className="button primary"
          onClick={() => {
            if (!form.symbol) return;
            onAdd(form);
            setForm({ symbol: "", description: "" });
          }}
        >
          <Plus size={16} /> Add Symbol
        </button>
      </Card>
    </div>
  );
};

const ReportsView: React.FC<{ trades: Trade[]; currency: "GBP" | "USD" }> = ({ trades, currency }) => {
  const profitFactor = useMemo(() => {
    const wins = trades.filter((t) => t.pnl > 0).reduce((a, b) => a + b.pnl, 0);
    const losses = trades.filter((t) => t.pnl < 0).reduce((a, b) => a + Math.abs(b.pnl), 0);
    return losses ? wins / losses : wins;
  }, [trades]);

  const expectancy = useMemo(() => trades.reduce((acc, t) => acc + t.pnl, 0) / (trades.length || 1), [trades]);
  const best = useMemo(() => Math.max(...trades.map((t) => t.pnl)), [trades]);
  const worst = useMemo(() => Math.min(...trades.map((t) => t.pnl)), [trades]);
  const curve = useMemo(() => {
    let run = 0;
    return trades.map((t) => {
      run += t.pnl;
      return { date: t.date, equity: run };
    });
  }, [trades]);

  return (
    <div className="content">
      <div className="stat-grid">
        <StatCard title="Profit Factor" value={profitFactor.toFixed(2)} />
        <StatCard title="Expectancy" value={formatCurrency(expectancy, currency)} />
        <StatCard title="Best Day" value={formatCurrency(best, currency)} accent="#16a34a" />
        <StatCard title="Worst Day" value={formatCurrency(worst, currency)} accent="#dc2626" />
      </div>

      <Card title="Equity Overview">
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="equity" stroke="#2f66c7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

const SettingsView: React.FC<{ settings: UserSettings; onSave: (s: UserSettings) => void }> = ({
  settings,
  onSave,
}) => {
  const [draft, setDraft] = useState(settings);

  useEffect(() => setDraft(settings), [settings]);

  return (
    <div className="content">
      <Card title="Preferences">
        <div className="form-grid">
          <label>
            <div className="detail-label">Currency</div>
            <select
              className="select"
              value={draft.currency}
              onChange={(e) => setDraft({ ...draft, currency: e.target.value as "GBP" | "USD" })}
            >
              <option value="GBP">GBP</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label>
            <div className="detail-label">Timezone</div>
            <input
              className="input"
              value={draft.timezone}
              onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
            />
          </label>
          <label>
            <div className="detail-label">Default Month</div>
            <select
              className="select"
              value={draft.defaultMonth}
              onChange={(e) => setDraft({ ...draft, defaultMonth: e.target.value })}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="button primary" onClick={() => onSave(draft)}>
          Save Settings
        </button>
      </Card>
    </div>
  );
};

const TradingAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | undefined>();
  const [exitsOnly, setExitsOnly] = useState(false);
  const [settingsState, setSettingsState] = useState<UserSettings>({
    currency: "GBP",
    timezone: "UTC",
    defaultMonth: "Dec25",
  });
  const [activeMonth, setActiveMonth] = useState(settingsState.defaultMonth);

  useEffect(() => {
    async function load() {
      const [tradeList, sessionList, symbolList] = await Promise.all([
        listTrades(),
        listSessions(),
        listSymbols(),
      ]);
      setTrades(tradeList);
      setSessions(sessionList);
      setSymbols(symbolList);
      if (!selectedTrade && tradeList.length) setSelectedTrade(tradeList[0]);
    }
    load();
  }, []);

  useEffect(() => {
    setActiveMonth(settingsState.defaultMonth);
  }, [settingsState.defaultMonth]);

  const handleAddTrade = async (input: TradeForm) => {
    const newTrade = await createTrade({ ...input });
    setTrades((prev) => [newTrade, ...prev]);
    setSelectedTrade(newTrade);
  };

  const assignSession = (tradeId: string, session: string) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === tradeId ? { ...t, session } : t))
    );
  };

  const addSymbol = (symbol: Symbol) => {
    setSymbols((prev) => [...prev, symbol]);
  };

  const removeSymbol = (sym: string) => {
    setSymbols((prev) => prev.filter((s) => s.symbol !== sym));
  };

  const handleSaveSettings = async (draft: UserSettings) => {
    const saved = await updateSettings(draft);
    setSettingsState(saved);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo-mark">V</div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={18} /> <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeTab === "trades" ? "active" : ""}`}
            onClick={() => setActiveTab("trades")}
          >
            <ListOrdered size={18} /> <span>Trades</span>
          </button>
          <button
            className={`nav-item ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => setActiveTab("sessions")}
          >
            <Clock3 size={18} /> <span>Sessions</span>
          </button>
          <button
            className={`nav-item ${activeTab === "symbols" ? "active" : ""}`}
            onClick={() => setActiveTab("symbols")}
          >
            <Boxes size={18} /> <span>Symbols</span>
          </button>
          <button
            className={`nav-item ${activeTab === "tradingview" ? "active" : ""}`}
            onClick={() => setActiveTab("tradingview")}
          >
            <LineChartIcon size={18} /> <span>TradingView</span>
          </button>
          <button
            className={`nav-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            <FilePieChart size={18} /> <span>Reports</span>
          </button>
          <button
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={18} /> <span>Settings</span>
          </button>
        </nav>
        <div className="sidebar-footer">InnoWeb Ventures Ltd</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <div className="brand-badge">TAD</div>
            Trading Account Analytics
          </div>
          <div className="date-pill">
            <CalendarDays size={16} /> Dec 1, 2025 - Dec 31, 2025 <ChevronDown size={16} />
          </div>
        </header>

        {activeTab === "dashboard" && (
          <DashboardView
            trades={trades}
            selectedTrade={selectedTrade}
            onSelectTrade={setSelectedTrade}
            currency={settingsState.currency}
            exitsOnly={exitsOnly}
            onToggleExits={() => setExitsOnly((v) => !v)}
            activeMonth={activeMonth}
            onMonthChange={setActiveMonth}
          />
        )}
        {activeTab === "trades" && (
          <TradesView
            trades={trades}
            onSelectTrade={setSelectedTrade}
            onAddTrade={handleAddTrade}
            currency={settingsState.currency}
          />
        )}
        {activeTab === "sessions" && (
          <SessionsView sessions={sessions} trades={trades} onAssign={assignSession} />
        )}
        {activeTab === "symbols" && (
          <SymbolsView symbols={symbols} onAdd={addSymbol} onRemove={removeSymbol} />
        )}
        {activeTab === "tradingview" && (
          <div className="content">
            <TradingViewWidget symbol="OANDA:NAS100USD" />
          </div>
        )}
        {activeTab === "reports" && (
          <ReportsView trades={trades} currency={settingsState.currency} />
        )}
        {activeTab === "settings" && (
          <SettingsView settings={settingsState} onSave={handleSaveSettings} />
        )}
      </main>
    </div>
  );
};

export default TradingAnalyticsDashboard;
