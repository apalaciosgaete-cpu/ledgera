export type SourceFundsItemStatus = "available" | "coming_soon";

export type ConnectionMethod = "api" | "aggregator" | "manual_upload";

export type SourceFundsItem = {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  logoUrl: string;
  status: SourceFundsItemStatus;
  connectionMethods: ConnectionMethod[];
};

// Los exchanges con API mantienen también la carga manual como respaldo.
const API_AND_FILE_CONNECTORS: ConnectionMethod[] = ["api", "manual_upload"];
const BUDA_CONNECTORS: ConnectionMethod[] = ["api"];
const EXCHANGE_FILE_CONNECTORS: ConnectionMethod[] = ["manual_upload"];

export const EXCHANGES: SourceFundsItem[] = [
  { id: "binance", name: "Binance", shortName: "Binance", domain: "binance.com", logoUrl: "/logos/binance.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "coinbase", name: "Coinbase", shortName: "Coinbase", domain: "coinbase.com", logoUrl: "/logos/coinbase.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "kraken", name: "Kraken", shortName: "Kraken", domain: "kraken.com", logoUrl: "/logos/kraken.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "buda", name: "Buda.com", shortName: "Buda.com", domain: "buda.com", logoUrl: "/logos/buda.svg", status: "available", connectionMethods: BUDA_CONNECTORS },
  { id: "orionx", name: "Orionx", shortName: "Orionx", domain: "orionx.com", logoUrl: "/logos/orionx.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "crypto-mkt", name: "CryptoMKT", shortName: "CryptoMKT", domain: "cryptomkt.com", logoUrl: "/logos/cryptomkt.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "okx", name: "OKX", shortName: "OKX", domain: "okx.com", logoUrl: "/logos/okx.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "bybit", name: "Bybit", shortName: "Bybit", domain: "bybit.com", logoUrl: "/logos/bybit.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "kucoin", name: "KuCoin", shortName: "KuCoin", domain: "kucoin.com", logoUrl: "/logos/kucoin.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "bitget", name: "Bitget", shortName: "Bitget", domain: "bitget.com", logoUrl: "/logos/bitget.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "gate", name: "Gate.io", shortName: "Gate.io", domain: "gate.io", logoUrl: "/logos/gate.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "bitfinex", name: "Bitfinex", shortName: "Bitfinex", domain: "bitfinex.com", logoUrl: "/logos/bitfinex.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "bitstamp", name: "Bitstamp", shortName: "Bitstamp", domain: "bitstamp.net", logoUrl: "/logos/bitstamp.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "gemini", name: "Gemini", shortName: "Gemini", domain: "gemini.com", logoUrl: "/logos/gemini.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "bitso", name: "Bitso", shortName: "Bitso", domain: "bitso.com", logoUrl: "/logos/bitso.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "htx", name: "HTX", shortName: "HTX", domain: "htx.com", logoUrl: "/logos/htx.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "mexc", name: "MEXC", shortName: "MEXC", domain: "mexc.com", logoUrl: "/logos/mexc.svg", status: "available", connectionMethods: API_AND_FILE_CONNECTORS },
  { id: "bit2me", name: "Bit2Me", shortName: "Bit2Me", domain: "bit2me.com", logoUrl: "/logos/bit2me.svg", status: "available", connectionMethods: EXCHANGE_FILE_CONNECTORS },
];

/** Retorna el logo local del exchange por dominio; cae al servicio externo si no existe. */
export function getLogoUrl(domain: string) {
  const item = EXCHANGES.find((entry) => entry.domain === domain);
  return item?.logoUrl ?? `https://logo.clearbit.com/${domain}`;
}

export function findExchangeById(id: string) {
  return EXCHANGES.find((item) => item.id === id);
}
