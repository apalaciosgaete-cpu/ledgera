import type {
  BinanceDepositRaw,
  BinanceTradeRaw,
  BinanceWithdrawRaw,
  NormalizedImportRecord,
} from "../domain/binanceTypes";

// Extrae el asset base de un par (ej: BTCUSDT → BTC)
function baseAsset(symbol: string): string {
  const stablecoins = ["USDT", "USDC", "BUSD", "TUSD", "DAI", "FDUSD"];
  for (const stable of stablecoins) {
    if (symbol.endsWith(stable)) return symbol.slice(0, -stable.length);
  }
  return symbol.slice(0, -3);
}

export function normalizeTrade(raw: BinanceTradeRaw): NormalizedImportRecord {
  const priceUsd = parseFloat(raw.price);
  const qty      = parseFloat(raw.qty);
  const feeUsd   = raw.commissionAsset === "USDT"
    ? parseFloat(raw.commission)
    : 0;

  return {
    externalId:   `TRADE-${raw.symbol}-${raw.id}`,
    externalType: "TRADE",
    movementType: raw.isBuyer ? "BUY" : "SELL",
    symbol:       baseAsset(raw.symbol),
    quantity:     qty,
    priceUsd,
    feeUsd,
    occurredAt:   new Date(raw.time),
  };
}

export function normalizeDeposit(raw: BinanceDepositRaw): NormalizedImportRecord {
  return {
    externalId:   `DEPOSIT-${raw.id}`,
    externalType: "DEPOSIT",
    movementType: "DEPOSIT",
    symbol:       raw.coin,
    quantity:     parseFloat(raw.amount),
    priceUsd:     0,
    feeUsd:       0,
    occurredAt:   new Date(raw.insertTime),
  };
}

export function normalizeWithdraw(raw: BinanceWithdrawRaw): NormalizedImportRecord {
  return {
    externalId:   `WITHDRAW-${raw.id}`,
    externalType: "WITHDRAW",
    movementType: "WITHDRAW",
    symbol:       raw.coin,
    quantity:     parseFloat(raw.amount),
    priceUsd:     0,
    feeUsd:       parseFloat(raw.transactionFee),
    occurredAt:   new Date(raw.applyTime),
  };
}
