export function buildAnalysisPrompt(trades, question) {
  const sample = trades.slice(0, 500);
  return `You are a trading performance analyst.

Given this JSON array of trades, produce:
1) Summary KPIs (win rate, avg win, avg loss, expectancy, profit factor, max drawdown estimate if possible, best/worst symbol)
2) Pattern findings (time of day, setup/notes correlations, overtrading signals)
3) 5 concrete improvement actions for next week
4) A short checklist for my next session

TRADES_JSON:\n${JSON.stringify(sample)}

User question: ${question ?? "Give me an honest performance review and improvement plan."}
`;
}
