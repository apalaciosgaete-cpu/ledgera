export type SourceFundsItemStatus = "available" | "coming_soon";

/** Tipo de wallet: "hot" (conectada a internet) o "cold" (almacenamiento en frío / hardware). */
export type WalletType = "hot" | "cold";

export type SourceFundsItem = {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  logoUrl: string;
  status: SourceFundsItemStatus;
  connectionMethods: Array<"api" | "aggregator" | "manual_upload" | "wallet_connect" | "address_scan">;
  /** Solo aplica a wallets: distingue wallets frías de calientes. */
  walletType?: WalletType;
};

const EXCHANGE_CONNECTORS: SourceFundsItem["connectionMethods"] = ["api", "manual_upload"];
const WALLET_CONNECTORS: SourceFundsItem["connectionMethods"] = ["wallet_connect", "address_scan", "manual_upload"];

export const EXCHANGES: SourceFundsItem[] = [
  { id: "binance", name: "Binance", shortName: "Binance", domain: "binance.com", logoUrl: "/logos/binance.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "coinbase", name: "Coinbase", shortName: "Coinbase", domain: "coinbase.com", logoUrl: "/logos/coinbase.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "kraken", name: "Kraken", shortName: "Kraken", domain: "kraken.com", logoUrl: "/logos/kraken.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "buda", name: "Buda.com", shortName: "Buda.com", domain: "buda.com", logoUrl: "/logos/buda.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "orionx", name: "Orionx", shortName: "Orionx", domain: "orionx.com", logoUrl: "/logos/orionx.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "crypto-mkt", name: "CryptoMKT", shortName: "CryptoMKT", domain: "cryptomkt.com", logoUrl: "/logos/cryptomkt.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "okx", name: "OKX", shortName: "OKX", domain: "okx.com", logoUrl: "/logos/okx.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "bybit", name: "Bybit", shortName: "Bybit", domain: "bybit.com", logoUrl: "/logos/bybit.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "kucoin", name: "KuCoin", shortName: "KuCoin", domain: "kucoin.com", logoUrl: "/logos/kucoin.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "bitget", name: "Bitget", shortName: "Bitget", domain: "bitget.com", logoUrl: "/logos/bitget.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "gate", name: "Gate.io", shortName: "Gate.io", domain: "gate.io", logoUrl: "/logos/gate.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "bitfinex", name: "Bitfinex", shortName: "Bitfinex", domain: "bitfinex.com", logoUrl: "/logos/bitfinex.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "bitstamp", name: "Bitstamp", shortName: "Bitstamp", domain: "bitstamp.net", logoUrl: "/logos/bitstamp.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "gemini", name: "Gemini", shortName: "Gemini", domain: "gemini.com", logoUrl: "/logos/gemini.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "bitso", name: "Bitso", shortName: "Bitso", domain: "bitso.com", logoUrl: "/logos/bitso.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "htx", name: "HTX", shortName: "HTX", domain: "htx.com", logoUrl: "/logos/htx.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "mexc", name: "MEXC", shortName: "MEXC", domain: "mexc.com", logoUrl: "/logos/mexc.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
  { id: "bit2me", name: "Bit2Me", shortName: "Bit2Me", domain: "bit2me.com", logoUrl: "/logos/bit2me.svg", status: "available", connectionMethods: EXCHANGE_CONNECTORS },
];

// Solo wallets frías (hardware / almacenamiento en frío).
// Todas quedan habilitadas con conectores activos.
export const WALLETS: SourceFundsItem[] = [
  { id: "ledger", name: "Ledger", shortName: "Ledger", domain: "ledger.com", logoUrl: "/logos/ledger.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "trezor", name: "Trezor", shortName: "Trezor", domain: "trezor.io", logoUrl: "/logos/trezor.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "coldcard", name: "Coldcard", shortName: "Coldcard", domain: "coldcard.com", logoUrl: "/logos/coldcard.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "bitbox", name: "BitBox02", shortName: "BitBox", domain: "bitbox.swiss", logoUrl: "/logos/bitbox.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "tangem", name: "Tangem", shortName: "Tangem", domain: "tangem.com", logoUrl: "/logos/tangem.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "keystone", name: "Keystone", shortName: "Keystone", domain: "keyst.one", logoUrl: "/logos/keystone.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "onekey", name: "OneKey", shortName: "OneKey", domain: "onekey.so", logoUrl: "/logos/onekey.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "keepkey", name: "KeepKey", shortName: "KeepKey", domain: "keepkey.com", logoUrl: "/logos/keepkey.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "safepal", name: "SafePal", shortName: "SafePal", domain: "safepal.com", logoUrl: "/logos/safepal.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "ngrave", name: "NGRAVE", shortName: "NGRAVE", domain: "ngrave.io", logoUrl: "/logos/ngrave.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "ellipal", name: "ELLIPAL", shortName: "ELLIPAL", domain: "ellipal.com", logoUrl: "/logos/ellipal.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "gridplus", name: "GridPlus Lattice1", shortName: "GridPlus", domain: "gridplus.io", logoUrl: "/logos/gridplus.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
  { id: "dcent", name: "D'CENT Wallet", shortName: "D'CENT", domain: "dcentwallet.com", logoUrl: "/logos/dcent.svg", status: "available", connectionMethods: WALLET_CONNECTORS, walletType: "cold" },
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

/** Wallets frías (almacenamiento en frío / hardware). */
export function getColdWallets() {
  return WALLETS.filter((item) => item.walletType === "cold");
}
