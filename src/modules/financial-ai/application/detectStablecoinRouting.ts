import type { IntentSignal } from "../domain/FinancialIntent";

const STABLECOIN_SYMBOLS = ["USDT", "USDC", "BUSD", "TUSD", "DAI", "FDUSD", "PYUSD"];

type StablecoinContext = {
  symbol?:        string | null;
  normalizedType?: string | null;
  amountUsd?:     number | null;
  description?:   string;
};

export function detectStablecoinRouting(ctx: StablecoinContext): IntentSignal[] {
  const signals: IntentSignal[] = [];

  const sym = ctx.symbol?.toUpperCase() ?? "";
  if (STABLECOIN_SYMBOLS.includes(sym)) {
    signals.push({ code: "STABLECOIN_SYMBOL", weight: 0.75, description: `Activo es stablecoin: ${sym}` });
  }

  const desc = ctx.description?.toUpperCase() ?? "";
  for (const s of STABLECOIN_SYMBOLS) {
    if (desc.includes(s)) {
      signals.push({ code: "STABLECOIN_IN_DESC", weight: 0.5, description: `Stablecoin en descripción: ${s}` });
      break;
    }
  }

  if (ctx.normalizedType === "INTERNAL_TRANSFER" && STABLECOIN_SYMBOLS.includes(sym)) {
    signals.push({ code: "STABLECOIN_INTERNAL", weight: 0.3, description: "Transferencia interna en stablecoin" });
  }

  return signals;
}

export function isStablecoin(symbol: string): boolean {
  return STABLECOIN_SYMBOLS.includes(symbol.toUpperCase());
}
