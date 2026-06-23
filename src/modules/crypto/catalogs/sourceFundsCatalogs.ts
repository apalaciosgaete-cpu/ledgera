export type SourceFundsItemStatus = "available" | "coming_soon";

export type SourceFundsItem = {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  logoUrl: string;
  status: SourceFundsItemStatus;
  connectionMethods: Array<"api" | "aggregator" | "manual_upload" | "wallet_connect" | "address_scan">;
};

export const EXCHANGES: SourceFundsItem[] = [
  { id: "binance", name: "Binance", shortName: "Binance", domain: "binance.com", logoUrl: "/logos/binance.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "coinbase", name: "Coinbase", shortName: "Coinbase", domain: "coinbase.com", logoUrl: "/logos/coinbase.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "kraken", name: "Kraken", shortName: "Kraken", domain: "kraken.com", logoUrl: "/logos/kraken.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "buda", name: "Buda.com", shortName: "Buda.com", domain: "buda.com", logoUrl: "/logos/buda.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "orionx", name: "Orionx", shortName: "Orionx", domain: "orionx.com", logoUrl: "/logos/orionx.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "crypto-mkt", name: "CryptoMKT", shortName: "CryptoMKT", domain: "cryptomkt.com", logoUrl: "/logos/cryptomkt.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "okx", name: "OKX", shortName: "OKX", domain: "okx.com", logoUrl: "/logos/okx.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bybit", name: "Bybit", shortName: "Bybit", domain: "bybit.com", logoUrl: "/logos/bybit.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "kucoin", name: "KuCoin", shortName: "KuCoin", domain: "kucoin.com", logoUrl: "/logos/kucoin.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bitget", name: "Bitget", shortName: "Bitget", domain: "bitget.com", logoUrl: "/logos/bitget.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "gate", name: "Gate.io", shortName: "Gate.io", domain: "gate.io", logoUrl: "/logos/gate.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bitfinex", name: "Bitfinex", shortName: "Bitfinex", domain: "bitfinex.com", logoUrl: "/logos/bitfinex.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bitstamp", name: "Bitstamp", shortName: "Bitstamp", domain: "bitstamp.net", logoUrl: "/logos/bitstamp.svg", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "gemini", name: "Gemini", shortName: "Gemini", domain: "gemini.com", logoUrl: "/logos/gemini.svg", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "bitso", name: "Bitso", shortName: "Bitso", domain: "bitso.com", logoUrl: "/logos/bitso.svg", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "htx", name: "HTX", shortName: "HTX", domain: "htx.com", logoUrl: "/logos/htx.svg", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "mexc", name: "MEXC", shortName: "MEXC", domain: "mexc.com", logoUrl: "/logos/mexc.svg", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "bit2me", name: "Bit2Me", shortName: "Bit2Me", domain: "bit2me.com", logoUrl: "/logos/bit2me.svg", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
];

export const WALLETS: SourceFundsItem[] = [
  { id: "metamask", name: "MetaMask", shortName: "MetaMask", domain: "metamask.io", logoUrl: "/logos/metamask.svg", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "trust-wallet", name: "Trust Wallet", shortName: "Trust Wallet", domain: "trustwallet.com", logoUrl: "/logos/trust-wallet.svg", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "ledger", name: "Ledger", shortName: "Ledger", domain: "ledger.com", logoUrl: "/logos/ledger.svg", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "trezor", name: "Trezor", shortName: "Trezor", domain: "trezor.io", logoUrl: "/logos/trezor.svg", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "phantom", name: "Phantom", shortName: "Phantom", domain: "phantom.app", logoUrl: "/logos/phantom.svg", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "rabby", name: "Rabby Wallet", shortName: "Rabby", domain: "rabby.io", logoUrl: "/logos/rabby.svg", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "coinbase-wallet", name: "Coinbase Wallet", shortName: "Coinbase Wallet", domain: "coinbase.com", logoUrl: "/logos/coinbase-wallet.svg", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "exodus", name: "Exodus", shortName: "Exodus", domain: "exodus.com", logoUrl: "/logos/exodus.svg", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "electrum", name: "Electrum", shortName: "Electrum", domain: "electrum.org", logoUrl: "/logos/electrum.svg", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "bluewallet", name: "BlueWallet", shortName: "BlueWallet", domain: "bluewallet.io", logoUrl: "/logos/bluewallet.svg", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "safe", name: "Safe", shortName: "Safe", domain: "safe.global", logoUrl: "/logos/safe.svg", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "argent", name: "Argent", shortName: "Argent", domain: "argent.xyz", logoUrl: "/logos/argent.svg", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "rainbow", name: "Rainbow", shortName: "Rainbow", domain: "rainbow.me", logoUrl: "/logos/rainbow.svg", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "okx-wallet", name: "OKX Wallet", shortName: "OKX Wallet", domain: "okx.com", logoUrl: "/logos/okx-wallet.svg", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "binance-web3-wallet", name: "Binance Web3 Wallet", shortName: "Binance Web3", domain: "binance.com", logoUrl: "/logos/binance-web3-wallet.svg", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
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
