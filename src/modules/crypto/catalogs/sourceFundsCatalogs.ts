export type SourceFundsItemStatus = "available" | "coming_soon";

/** Tipo de wallet o cuenta pública representada en el catálogo. */
export type WalletType = "hot" | "cold" | "network";

export type ConnectionMethod =
  | "api"
  | "aggregator"
  | "manual_upload"
  | "wallet_connect"
  | "address_scan"
  | "device_bridge"
  | "xpub"
  | "account_name";

export type SourceFundsItem = {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  logoUrl: string;
  status: SourceFundsItemStatus;
  connectionMethods: ConnectionMethod[];
  /** Solo aplica a wallets: distingue hardware, wallet digital o red pública. */
  walletType?: WalletType;
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

/**
 * Las wallets se organizan por capacidad real, no por una lista de fabricantes.
 * D'CENT y WebAuth disponen de conexión directa. Las redes públicas cubren el
 * resto de hardware mediante dirección, XPUB o nombre de cuenta.
 */
export const WALLETS: SourceFundsItem[] = [
  {
    id: "dcent",
    name: "D'CENT",
    shortName: "D'CENT",
    domain: "dcentwallet.com",
    logoUrl: "/logos/dcent.svg",
    status: "available",
    connectionMethods: ["device_bridge", "address_scan", "xpub"],
    walletType: "cold",
  },
  {
    id: "webauth",
    name: "WebAuth.com",
    shortName: "WebAuth",
    domain: "webauth.com",
    logoUrl: "/logos/webauth.svg",
    status: "available",
    connectionMethods: ["wallet_connect", "account_name"],
    walletType: "hot",
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    shortName: "Bitcoin",
    domain: "bitcoin.org",
    logoUrl: "/logos/bitcoin.svg",
    status: "available",
    connectionMethods: ["address_scan", "xpub"],
    walletType: "network",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    shortName: "Ethereum",
    domain: "ethereum.org",
    logoUrl: "/logos/ethereum.svg",
    status: "available",
    connectionMethods: ["address_scan"],
    walletType: "network",
  },
  {
    id: "solana",
    name: "Solana",
    shortName: "Solana",
    domain: "solana.com",
    logoUrl: "/logos/solana.svg",
    status: "available",
    connectionMethods: ["address_scan"],
    walletType: "network",
  },
  {
    id: "xpr",
    name: "XPR Network",
    shortName: "XPR",
    domain: "xprnetwork.org",
    logoUrl: "/logos/xpr.svg",
    status: "available",
    connectionMethods: ["account_name", "wallet_connect"],
    walletType: "network",
  },
];

/** Retorna el logo local del item por id; cae al servicio de logos por dominio si no existe. */
export function getLogoUrl(domain: string) {
  const item = [...EXCHANGES, ...WALLETS].find((entry) => entry.domain === domain);
  return item?.logoUrl ?? `https://logo.clearbit.com/${domain}`;
}

export function findExchangeById(id: string) {
  return EXCHANGES.find((item) => item.id === id);
}

export function findWalletById(id: string) {
  return WALLETS.find((item) => item.id === id);
}

/** Wallets físicas conectables directamente. */
export function getColdWallets() {
  return WALLETS.filter((item) => item.walletType === "cold");
}
