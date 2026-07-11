export type ExchangeApiMode = "ccxt" | "orionx" | "cryptomkt";

export type ExchangeApiConfig = {
  id: string;
  name: string;
  mode: ExchangeApiMode;
  ccxtId?: string;
  requiresPassphrase: boolean;
  secretLabel?: string;
  passphraseLabel?: string;
};

export const EXCHANGE_API_CONFIGS: Record<string, ExchangeApiConfig> = {
  coinbase: {
    id: "coinbase",
    name: "Coinbase",
    mode: "ccxt",
    ccxtId: "coinbase",
    requiresPassphrase: false,
    secretLabel: "API Secret o clave privada",
  },
  kraken: {
    id: "kraken",
    name: "Kraken",
    mode: "ccxt",
    ccxtId: "kraken",
    requiresPassphrase: false,
  },
  orionx: {
    id: "orionx",
    name: "Orionx",
    mode: "orionx",
    requiresPassphrase: false,
  },
  "crypto-mkt": {
    id: "crypto-mkt",
    name: "CryptoMKT",
    mode: "cryptomkt",
    requiresPassphrase: false,
  },
  okx: {
    id: "okx",
    name: "OKX",
    mode: "ccxt",
    ccxtId: "okx",
    requiresPassphrase: true,
    passphraseLabel: "Passphrase de API",
  },
  bybit: {
    id: "bybit",
    name: "Bybit",
    mode: "ccxt",
    ccxtId: "bybit",
    requiresPassphrase: false,
  },
  kucoin: {
    id: "kucoin",
    name: "KuCoin",
    mode: "ccxt",
    ccxtId: "kucoin",
    requiresPassphrase: true,
    passphraseLabel: "Passphrase de API",
  },
  bitget: {
    id: "bitget",
    name: "Bitget",
    mode: "ccxt",
    ccxtId: "bitget",
    requiresPassphrase: true,
    passphraseLabel: "Passphrase de API",
  },
  gate: {
    id: "gate",
    name: "Gate.io",
    mode: "ccxt",
    ccxtId: "gate",
    requiresPassphrase: false,
  },
  bitfinex: {
    id: "bitfinex",
    name: "Bitfinex",
    mode: "ccxt",
    ccxtId: "bitfinex",
    requiresPassphrase: false,
  },
  bitstamp: {
    id: "bitstamp",
    name: "Bitstamp",
    mode: "ccxt",
    ccxtId: "bitstamp",
    requiresPassphrase: false,
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    mode: "ccxt",
    ccxtId: "gemini",
    requiresPassphrase: false,
  },
  bitso: {
    id: "bitso",
    name: "Bitso",
    mode: "ccxt",
    ccxtId: "bitso",
    requiresPassphrase: false,
  },
  htx: {
    id: "htx",
    name: "HTX",
    mode: "ccxt",
    ccxtId: "htx",
    requiresPassphrase: false,
  },
  mexc: {
    id: "mexc",
    name: "MEXC",
    mode: "ccxt",
    ccxtId: "mexc",
    requiresPassphrase: false,
  },
};

export const API_CONNECTABLE_EXCHANGE_IDS = Object.freeze(
  Object.keys(EXCHANGE_API_CONFIGS),
);

export function getExchangeApiConfig(exchangeId: string): ExchangeApiConfig | null {
  return EXCHANGE_API_CONFIGS[exchangeId] ?? null;
}

export function isApiConnectableExchange(exchangeId: string): boolean {
  return exchangeId === "binance" || exchangeId === "buda" || Boolean(EXCHANGE_API_CONFIGS[exchangeId]);
}
