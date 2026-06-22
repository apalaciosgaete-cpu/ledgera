export const EXCHANGE_PROVIDER = {
  BINANCE:     "BINANCE",
  BINANCE_TAX: "BINANCE_TAX",
  KRAKEN:      "KRAKEN",
  COINBASE:    "COINBASE",
  BYBIT:       "BYBIT",
  OKX:         "OKX",
} as const;

export type ExchangeProvider = typeof EXCHANGE_PROVIDER[keyof typeof EXCHANGE_PROVIDER];

export const EXCHANGE_PROVIDER_LABELS: Record<ExchangeProvider, string> = {
  BINANCE:     "Binance Spot",
  BINANCE_TAX: "Binance Tax",
  KRAKEN:      "Kraken",
  COINBASE:    "Coinbase",
  BYBIT:       "Bybit",
  OKX:         "OKX",
};
