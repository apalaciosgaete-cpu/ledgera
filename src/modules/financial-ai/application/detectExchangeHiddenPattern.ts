import type { IntentSignal, TransactionContext } from "../domain/FinancialIntent";

const EXCHANGE_PATTERNS = [
  { pattern: /binance/i,    label: "Binance",    weight: 0.75 },
  { pattern: /kraken/i,     label: "Kraken",     weight: 0.75 },
  { pattern: /coinbase/i,   label: "Coinbase",   weight: 0.75 },
  { pattern: /buda\.com/i,  label: "Buda",       weight: 0.75 },
  { pattern: /orionx/i,     label: "OrionX",     weight: 0.75 },
  { pattern: /cryptomkt/i,  label: "CryptoMKT",  weight: 0.75 },
  { pattern: /okx/i,        label: "OKX",        weight: 0.7  },
  { pattern: /bybit/i,      label: "Bybit",      weight: 0.7  },
  { pattern: /kucoin/i,     label: "KuCoin",     weight: 0.7  },
  { pattern: /huobi/i,      label: "Huobi",      weight: 0.7  },
  { pattern: /ftx/i,        label: "FTX",        weight: 0.6  },
  { pattern: /crypto\.com/i,label: "Crypto.com", weight: 0.7  },
];

const FEE_PATTERNS = [
  { pattern: /fee|comisión|comision/i, label: "Fee de transacción", weight: 0.4 },
  { pattern: /spread/i,               label: "Spread",             weight: 0.35 },
];

export function detectExchangeHiddenPattern(ctx: TransactionContext): IntentSignal[] {
  const signals: IntentSignal[] = [];
  const text = `${ctx.description} ${ctx.bankCategory ?? ""}`;

  for (const { pattern, label, weight } of EXCHANGE_PATTERNS) {
    if (pattern.test(text)) {
      signals.push({ code: "EXCHANGE_PATTERN", weight, description: `Exchange detectado: ${label}` });
      break;
    }
  }

  for (const { pattern, label, weight } of FEE_PATTERNS) {
    if (pattern.test(text)) {
      signals.push({ code: "FEE_PATTERN", weight, description: label });
    }
  }

  // Small amounts often indicate fees
  if (ctx.amountClp < 2_000 && ctx.direction === "OUTFLOW") {
    signals.push({ code: "MICRO_AMOUNT", weight: 0.25, description: "Monto muy pequeño — posible fee" });
  }

  return signals;
}
