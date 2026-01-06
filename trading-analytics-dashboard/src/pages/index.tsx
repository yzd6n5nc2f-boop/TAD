import React, { useMemo, useState } from "react";
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
  Legend,
} from "recharts";
import { BarChart3, Settings, FileText, Activity, Target } from "lucide-react";

type TabKey =
  | "trades"
  | "sessions"
  | "symbols"
  | "tradingview"
  | "reports"
  | "settings";

type Trade = {
  id: number;
  date: string;
  symbol: string;
  direction: "Long" | "Short";
  entry: number;
  exit: number;
  size: number;
  pnl: number;
};

const trades: Trade[] = [
  { id: 1, date: "2024-06-03", symbol: "AAPL", direction: "Long", entry: 188.2, exit: 192.1, size: 100, pnl: 390 },
  { id: 2, date: "2024-06-04", symbol: "MSFT", direction: "Short", entry: 430.5, exit: 426.3, size: 50, pnl: 210 },
  { id: 3, date: "2024-06-05", symbol: "TSLA", direction: "Long", entry: 175.4, exit: 169.1, size: 60, pnl: -378 },
  { id: 4, date: "2024-06-06", symbol: "NVDA", direction: "Long", entry: 112.7, exit: 119.2, size: 80, pnl: 520 },
  { id: 5, date: "2024-06-07", symbol: "AMZN", direction: "Short", entry: 178.3, exit: 182.7, size: 70, pnl: -308 },
  { id: 6, date: "2024-06-10", symbol: "META", direction: "Long", entry: 475.9, exit: 489.4, size: 40, pnl: 540 },
];

const sessions = [
  { date: "2024-06-03", trades: 3, volume: 180, pnl: 390 },
  { date: "2024-06-04", trades: 2, volume: 120, pnl: 210 },
  { date: "2024-06-05", trades: 4, volume: 220, pnl: -378 },
  { date: "2024-06-06", trades: 3, volume: 160, pnl: 520 },
  { date: "2024-06-07", trades: 2, volume: 140, pnl: -308 },
  { date: "2024-06-10", trades: 3, volume: 130, pnl: 540 },
];

const symbols = [
  { symbol: "AAPL", volume: 100, pnl: 390 },
  { symbol: "MSFT", volume: 50, pnl: 210 },
  { symbol: "TSLA", volume: 60, pnl: -378 },
  { symbol: "NVDA", volume: 80, pnl: 520 },
  { symbol: "AMZN", volume: 70, pnl: -308 },
  { symbol: "META", volume: 40, pnl: 540 },
];

const containerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "240px 1fr",
  minHeight: "100vh",
  background: "#0f172a",
  color: "#e2e8f0",
  fontFamily: "Inter, system-ui, sans-serif",
};

const sidebarStyle: React.CSSProperties = {
  background: "#0b1224",
  borderRight: "1px solid rgba(148,163,184,0.2)",
  padding: "24px 16px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const navButtonBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid transparent",
  background: "transparent",
  color: "inherit",
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "left",
};

const headerStyle: React.CSSProperties = {
  padding: "24px 28px 12px",
  borderBottom: "1px solid rgba(148,163,184,0.15)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const cardStyle: React.CSSProperties = {
  background: "#0b1224",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: "12px",
  padding: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  marginBottom: "12px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  color: "#e2e8f0",
  fontSize: "14px",
};

const tableHeaderCell: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "1px solid rgba(148,163,184,0.15)",
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  fontSize: "12px",
};

const tableCell: React.CSSProperties = {
  padding: "12px 10px",
  borderBottom: "1px solid rgba(148,163,184,0.08)",
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function StatCard({ title, value, accent }: { title: string; value: string; accent?: string }) {
  return (
    <div style={{ ...cardStyle, minWidth: 160, background: "#0c162b" }}>
      <div style={{ color: "#94a3b8", fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent ?? "#e2e8f0" }}>{value}</div>
    </div>
  );
}

function TradesView() {
  const summary = useMemo(() => {
    const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
    const wins = trades.filter((t) => t.pnl > 0);
    const losses = trades.filter((t) => t.pnl < 0);
    const winRate = (wins.length / trades.length) * 100;
    const avgWin = wins.length ? wins.reduce((acc, t) => acc + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((acc, t) => acc + t.pnl, 0) / losses.length : 0;

    return { totalPnL, winRate, avgWin, avgLoss };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <StatCard
          title="Total PnL"
          value={`$${formatCurrency(summary.totalPnL)}`}
          accent={summary.totalPnL >= 0 ? "#22c55e" : "#ef4444"}
        />
        <StatCard title="Win Rate" value={`${summary.winRate.toFixed(1)}%`} accent="#38bdf8" />
        <StatCard title="Avg Win" value={`$${formatCurrency(summary.avgWin)}`} accent="#22c55e" />
        <StatCard title="Avg Loss" value={`$${formatCurrency(summary.avgLoss)}`} accent="#ef4444" />
      </div>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <div style={sectionTitle}>Performance Trend</div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sessions} margin={{ left: 4, right: 4, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="date" stroke="#94a3b8" tickMargin={10} />
              <YAxis stroke="#94a3b8" tickMargin={8} />
              <Tooltip
                contentStyle={{ background: "#0b1224", border: "1px solid rgba(148,163,184,0.2)" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Line type="monotone" dataKey="pnl" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTitle}>Recent Trades</div>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderCell}>Date</th>
                <th style={tableHeaderCell}>Symbol</th>
                <th style={tableHeaderCell}>Direction</th>
                <th style={tableHeaderCell}>Entry</th>
                <th style={tableHeaderCell}>Exit</th>
                <th style={tableHeaderCell}>Size</th>
                <th style={tableHeaderCell}>PnL</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id}>
                  <td style={tableCell}>{trade.date}</td>
                  <td style={tableCell}>{trade.symbol}</td>
                  <td style={tableCell}>{trade.direction}</td>
                  <td style={tableCell}>${trade.entry.toFixed(2)}</td>
                  <td style={tableCell}>${trade.exit.toFixed(2)}</td>
                  <td style={tableCell}>{trade.size}</td>
                  <td
                    style={{
                      ...tableCell,
                      color: trade.pnl >= 0 ? "#22c55e" : "#ef4444",
                      fontWeight: 700,
                    }}
                  >
                    {trade.pnl >= 0 ? "+" : "-"}${Math.abs(trade.pnl).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SessionsView() {
  return (
    <div style={cardStyle}>
      <div style={sectionTitle}>Session Overview</div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sessions} margin={{ left: 4, right: 4, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="date" stroke="#94a3b8" tickMargin={10} />
            <YAxis stroke="#94a3b8" tickMargin={8} />
            <Tooltip
              contentStyle={{ background: "#0b1224", border: "1px solid rgba(148,163,184,0.2)" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend wrapperStyle={{ color: "#e2e8f0" }} />
            <Bar dataKey="trades" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            <Bar dataKey="pnl" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SymbolsView() {
  return (
    <div style={cardStyle}>
      <div style={sectionTitle}>Symbol Performance</div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={symbols} margin={{ left: 4, right: 4, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="symbol" stroke="#94a3b8" tickMargin={10} />
            <YAxis stroke="#94a3b8" tickMargin={8} />
            <Tooltip
              contentStyle={{ background: "#0b1224", border: "1px solid rgba(148,163,184,0.2)" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Bar dataKey="pnl" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TradingViewPlaceholder() {
  return (
    <div style={{ ...cardStyle, textAlign: "center" }}>
      <div style={sectionTitle}>TradingView</div>
      <p style={{ color: "#94a3b8", marginBottom: 12 }}>
        Integrate your favorite chart widgets or trading view components here.
      </p>
      <div
        style={{
          border: "1px dashed rgba(148,163,184,0.4)",
          borderRadius: "12px",
          padding: "40px 12px",
          color: "#cbd5e1",
          background: "rgba(148,163,184,0.05)",
        }}
      >
        Chart placeholder
      </div>
    </div>
  );
}

function ReportsView() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <div style={{ ...cardStyle, flex: 2, minWidth: 340 }}>
        <div style={sectionTitle}>Equity Curve</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sessions} margin={{ left: 4, right: 4, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="date" stroke="#94a3b8" tickMargin={10} />
              <YAxis stroke="#94a3b8" tickMargin={8} />
              <Tooltip
                contentStyle={{ background: "#0b1224", border: "1px solid rgba(148,163,184,0.2)" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Line type="monotone" dataKey="pnl" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ ...cardStyle, flex: 1, minWidth: 260 }}>
        <div style={sectionTitle}>Notes</div>
        <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
          Summaries, key risk reminders, or links to external reports can live here. Use this space to
          highlight what is working and what needs adjustment.
        </p>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div style={{ ...cardStyle, maxWidth: 640 }}>
      <div style={sectionTitle}>Settings</div>
      <div style={{ color: "#94a3b8", lineHeight: 1.6 }}>
        Connect brokers, choose your base currency, and configure notifications. Save credentials as secrets when
        deploying and avoid committing them to the repository.
      </div>
    </div>
  );
}

const tabMeta: { key: TabKey; label: string; icon?: React.ReactNode }[] = [
  { key: "trades", label: "Trades", icon: <Activity size={18} /> },
  { key: "sessions", label: "Sessions", icon: <BarChart3 size={18} /> },
  { key: "symbols", label: "Symbols", icon: <Target size={18} /> },
  { key: "tradingview", label: "TradingView", icon: <FileText size={18} /> },
  { key: "reports", label: "Reports", icon: <FileText size={18} /> },
  { key: "settings", label: "Settings", icon: <Settings size={18} /> },
];

const TabContent: Record<TabKey, React.ReactNode> = {
  trades: <TradesView />,
  sessions: <SessionsView />,
  symbols: <SymbolsView />,
  tradingview: <TradingViewPlaceholder />,
  reports: <ReportsView />,
  settings: <SettingsView />,
};

export default function TradingAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("trades");

  return (
    <div style={containerStyle}>
      <aside style={sidebarStyle}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Navigation</div>
        {tabMeta.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              style={{
                ...navButtonBase,
                background: isActive ? "rgba(56,189,248,0.12)" : "transparent",
                borderColor: isActive ? "rgba(56,189,248,0.5)" : "transparent",
                color: isActive ? "#e0f2fe" : "#e2e8f0",
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </aside>

      <main>
        <header style={headerStyle}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>Trading Analytics Dashboard</div>
            <div style={{ color: "#94a3b8", marginTop: 6 }}>Monitor trades, measure performance, and keep a disciplined edge.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                background: "#38bdf8",
                border: "none",
                color: "#0b1224",
                padding: "10px 14px",
                borderRadius: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Export
            </button>
            <button
              style={{
                background: "transparent",
                border: "1px solid rgba(148,163,184,0.4)",
                color: "#e2e8f0",
                padding: "10px 14px",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              New trade
            </button>
          </div>
        </header>

        <div style={{ padding: "20px 28px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
          {TabContent[activeTab]}
        </div>
      </main>
    </div>
  );
}
