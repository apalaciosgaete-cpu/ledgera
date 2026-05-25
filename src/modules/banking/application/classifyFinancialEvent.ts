import type {
  FinancialEventClassification,
  FinancialEventType,
} from "../domain/financialEventTypes";

type ClassifyFinancialEventInput = {
  bankDescription: string;
  bankDirection: "INFLOW" | "OUTFLOW";
  bankAmountClp: number;
  cryptoType?: string | null;
  cryptoSource?: string | null;
  amountDiffPct?: number | null;
  dateDiffDays?: number | null;
};

const EXCHANGE_KEYWORDS = [
  "BINANCE",
  "BUDAPAY",
  "BUDA",
  "ORIONX",
  "COINBASE",
  "KRAKEN",
  "OKX",
  "KUCOIN",
  "BYBIT",
  "CRYPTO",
];

const P2P_KEYWORDS = [
  "P2P",
  "PEER",
  "TRANSFERENCIA TERCERO",
  "TERCERO",
];

function hasAnyKeyword(text: string, keywords: string[]): string | null {
  const upper = text.toUpperCase();

  return keywords.find((keyword) => upper.includes(keyword)) ?? null;
}

function isAmountClose(diffPct?: number | null): boolean {
  return typeof diffPct === "number" && Number.isFinite(diffPct) && diffPct <= 0.05;
}

function isDateClose(days?: number | null): boolean {
  return typeof days === "number" && Number.isFinite(days) && days <= 1;
}

function buildResult(
  eventType: FinancialEventType,
  certainty: "HIGH" | "MEDIUM" | "LOW",
  label: string,
  reason: string,
  evidence: string[],
): FinancialEventClassification {
  return {
    eventType,
    certainty,
    label,
    reason,
    evidence,
  };
}

export function classifyFinancialEvent(
  input: ClassifyFinancialEventInput,
): FinancialEventClassification {
  const evidence: string[] = [];

  const exchangeKeyword = hasAnyKeyword(input.bankDescription, EXCHANGE_KEYWORDS);
  const p2pKeyword = hasAnyKeyword(input.bankDescription, P2P_KEYWORDS);

  if (exchangeKeyword) {
    evidence.push(`Descripción bancaria contiene ${exchangeKeyword}`);
  }

  if (p2pKeyword) {
    evidence.push(`Descripción bancaria contiene ${p2pKeyword}`);
  }

  if (input.cryptoSource) {
    evidence.push(`Movimiento crypto proviene de ${input.cryptoSource}`);
  }

  if (input.cryptoType) {
    evidence.push(`Movimiento crypto tipo ${input.cryptoType}`);
  }

  if (isAmountClose(input.amountDiffPct)) {
    evidence.push("Monto compatible dentro de 5%");
  } else if (typeof input.amountDiffPct === "number") {
    evidence.push(`Diferencia de monto ${(input.amountDiffPct * 100).toFixed(1)}%`);
  }

  if (isDateClose(input.dateDiffDays)) {
    evidence.push("Fecha compatible dentro de 1 día");
  } else if (typeof input.dateDiffDays === "number") {
    evidence.push(`Diferencia de fecha ${input.dateDiffDays.toFixed(1)} días`);
  }

  if (p2pKeyword) {
    return buildResult(
      "P2P",
      exchangeKeyword || input.cryptoSource ? "HIGH" : "MEDIUM",
      "Operación P2P detectada",
      "La descripción bancaria contiene señales P2P.",
      evidence,
    );
  }

  if (
    input.bankDirection === "OUTFLOW" &&
    (input.cryptoType === "BUY" || input.cryptoType === "DEPOSIT")
  ) {
    return buildResult(
      input.cryptoType === "BUY" ? "CRYPTO_BUY" : "EXCHANGE_DEPOSIT",
      exchangeKeyword && isAmountClose(input.amountDiffPct) && isDateClose(input.dateDiffDays)
        ? "HIGH"
        : "MEDIUM",
      input.cryptoType === "BUY"
        ? "Compra crypto detectada"
        : "Ingreso a exchange detectado",
      "Salida bancaria compatible con movimiento crypto de entrada o compra.",
      evidence,
    );
  }

  if (
    input.bankDirection === "INFLOW" &&
    (input.cryptoType === "SELL" || input.cryptoType === "WITHDRAWAL")
  ) {
    return buildResult(
      input.cryptoType === "SELL" ? "CRYPTO_SELL" : "EXCHANGE_WITHDRAWAL",
      exchangeKeyword && isAmountClose(input.amountDiffPct) && isDateClose(input.dateDiffDays)
        ? "HIGH"
        : "MEDIUM",
      input.cryptoType === "SELL"
        ? "Venta crypto detectada"
        : "Retiro desde exchange detectado",
      "Entrada bancaria compatible con venta o retiro desde exchange.",
      evidence,
    );
  }

  if (
    input.bankDirection === "OUTFLOW" &&
    exchangeKeyword &&
    !input.cryptoType
  ) {
    return buildResult(
      "EXCHANGE_DEPOSIT",
      "MEDIUM",
      "Ingreso a exchange probable",
      "Salida bancaria contiene referencia a exchange, pero aún no hay movimiento crypto asociado.",
      evidence,
    );
  }

  if (
    input.bankDirection === "INFLOW" &&
    exchangeKeyword &&
    !input.cryptoType
  ) {
    return buildResult(
      "EXCHANGE_WITHDRAWAL",
      "MEDIUM",
      "Retiro desde exchange probable",
      "Entrada bancaria contiene referencia a exchange, pero aún no hay movimiento crypto asociado.",
      evidence,
    );
  }

  return buildResult(
    "UNKNOWN",
    "LOW",
    "Evento financiero no clasificado",
    "No hay evidencia suficiente para clasificar automáticamente.",
    evidence,
  );
}
