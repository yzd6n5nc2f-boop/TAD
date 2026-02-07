import { clearStore } from "../shared/store.mjs";

const state = clearStore();

console.log("Database cleared.");
console.log(`Trades: ${state.trades.length}`);
console.log(`Default month: ${state.settings.defaultMonth}`);
