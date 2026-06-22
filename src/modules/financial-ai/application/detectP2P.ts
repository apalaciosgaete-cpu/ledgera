import type { IntentSignal, TransactionContext } from "../domain/FinancialIntent";

const P2P_KEYWORDS = [
  "P2P", "BINANCE P2P", "PEER TO PEER", "PAGO P2P",
  "TRANSFERENCIA P2P", "COMPRA CRYPTO", "VENTA CRYPTO",
  "KHIPU", "WEBPAY CRYPTO",
];

const P2P_ROUND_AMOUNTS = [
  50_000, 100_000, 200_000, 250_000, 500_000,
  1_000_000, 2_000_000, 5_000_000, 10_000_000,
];

export function detectP2P(ctx: TransactionContext): IntentSignal[] {
  const signals: IntentSignal[] = [];
  const desc = ctx.description.toUpperCase();

  for (const kw of P2P_KEYWORDS) {
    if (desc.includes(kw)) {
      signals.push({ code: "P2P_KEYWORD", weight: 0.6, description: `Keyword "${kw}" en descripción` });
      break;
    }
  }

  const isRound = P2P_ROUND_AMOUNTS.some(
    (a) => Math.abs(ctx.amountClp - a) < a * 0.02,
  );
  if (isRound) {
    signals.push({ code: "ROUND_AMOUNT", weight: 0.2, description: "Monto redondo típico de P2P" });
  }

  if (ctx.amountClp >= 500_000 && ctx.amountClp <= 20_000_000) {
    signals.push({ code: "P2P_AMOUNT_RANGE", weight: 0.1, description: "Rango de monto típico P2P" });
  }

  return signals;
}
