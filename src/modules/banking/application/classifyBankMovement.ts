export type BankCategory =
  | "CRYPTO_PURCHASE_CANDIDATE"
  | "EXCHANGE_TRANSFER"
  | "NORMAL_EXPENSE"
  | "INCOME"
  | "UNKNOWN";

const CRYPTO_KEYWORDS = [
  "binance",
  "cryptomkt",
  "buda",
  "orionx",
  "crypto",
  "bitcoin",
  "btc",
  "eth",
  "usdt",
  "p2p",
];

const EXCHANGE_KEYWORDS = [
  "transferencia",
  "transf.",
  "traspaso",
  "transf internet",
  "transf. internet",
];

export function classifyBankMovement(
  description: string,
  direction: "INFLOW" | "OUTFLOW",
): { bankCategory: BankCategory; categoryReason: string } {
  const lower = description.toLowerCase();

  if (direction === "INFLOW") {
    return { bankCategory: "INCOME", categoryReason: "Movimiento de entrada" };
  }

  const cryptoMatch = CRYPTO_KEYWORDS.find((kw) => lower.includes(kw));
  if (cryptoMatch) {
    return {
      bankCategory:  "CRYPTO_PURCHASE_CANDIDATE",
      categoryReason: `Coincide con keyword crypto: "${cryptoMatch}"`,
    };
  }

  const exchangeMatch = EXCHANGE_KEYWORDS.find((kw) => lower.includes(kw));
  if (exchangeMatch) {
    return {
      bankCategory:  "EXCHANGE_TRANSFER",
      categoryReason: `Transferencia genérica: "${exchangeMatch}"`,
    };
  }

  return { bankCategory: "NORMAL_EXPENSE", categoryReason: "Gasto comercial sin keyword crypto" };
}
