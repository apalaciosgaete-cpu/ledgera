import type { IntentSignal, TransactionContext } from "../domain/FinancialIntent";

const INTERNAL_KEYWORDS = [
  "TRASPASO", "TRANSFERENCIA PROPIA", "MISMO TITULAR",
  "CUENTA PROPIA", "ENTRE CUENTAS", "ABONO PROPIO",
  "CARGO PROPIO", "SAVING",
];

const EXCHANGE_DEPOSIT_KEYWORDS = [
  "BINANCE", "KRAKEN", "COINBASE", "BUDA", "ORIONX", "CRYPTOMKT",
  "EXCHANGE", "WALLET", "CRYPTO DEPOSIT",
];

export function detectInternalTransfer(ctx: TransactionContext): IntentSignal[] {
  const signals: IntentSignal[] = [];
  const desc = ctx.description.toUpperCase();

  for (const kw of INTERNAL_KEYWORDS) {
    if (desc.includes(kw)) {
      signals.push({ code: "INTERNAL_KEYWORD", weight: 0.7, description: `Transferencia interna: "${kw}"` });
      break;
    }
  }

  for (const kw of EXCHANGE_DEPOSIT_KEYWORDS) {
    if (desc.includes(kw)) {
      signals.push({ code: "EXCHANGE_KEYWORD", weight: 0.65, description: `Exchange detectado: "${kw}"` });
      break;
    }
  }

  return signals;
}
