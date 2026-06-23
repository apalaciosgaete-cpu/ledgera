export type SourceFundsItemStatus = "available" | "coming_soon";

export type SourceFundsItem = {
  id: string;
  name: string;
  shortName: string;
  domain: string;
  status: SourceFundsItemStatus;
  connectionMethods: Array<"api" | "aggregator" | "manual_upload" | "wallet_connect" | "address_scan">;
};

export const EXCHANGES: SourceFundsItem[] = [
  { id: "binance", name: "Binance", shortName: "Binance", domain: "binance.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "coinbase", name: "Coinbase", shortName: "Coinbase", domain: "coinbase.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "kraken", name: "Kraken", shortName: "Kraken", domain: "kraken.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "buda", name: "Buda.com", shortName: "Buda.com", domain: "buda.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "orionx", name: "Orionx", shortName: "Orionx", domain: "orionx.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "crypto-mkt", name: "CryptoMKT", shortName: "CryptoMKT", domain: "cryptomkt.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "okx", name: "OKX", shortName: "OKX", domain: "okx.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bybit", name: "Bybit", shortName: "Bybit", domain: "bybit.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "kucoin", name: "KuCoin", shortName: "KuCoin", domain: "kucoin.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bitget", name: "Bitget", shortName: "Bitget", domain: "bitget.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "gate", name: "Gate.io", shortName: "Gate.io", domain: "gate.io", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bitfinex", name: "Bitfinex", shortName: "Bitfinex", domain: "bitfinex.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bitstamp", name: "Bitstamp", shortName: "Bitstamp", domain: "bitstamp.net", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "gemini", name: "Gemini", shortName: "Gemini", domain: "gemini.com", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "bitso", name: "Bitso", shortName: "Bitso", domain: "bitso.com", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "htx", name: "HTX", shortName: "HTX", domain: "htx.com", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "mexc", name: "MEXC", shortName: "MEXC", domain: "mexc.com", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "bit2me", name: "Bit2Me", shortName: "Bit2Me", domain: "bit2me.com", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
];

export const WALLETS: SourceFundsItem[] = [
  { id: "metamask", name: "MetaMask", shortName: "MetaMask", domain: "metamask.io", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "trust-wallet", name: "Trust Wallet", shortName: "Trust Wallet", domain: "trustwallet.com", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "ledger", name: "Ledger", shortName: "Ledger", domain: "ledger.com", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "trezor", name: "Trezor", shortName: "Trezor", domain: "trezor.io", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "phantom", name: "Phantom", shortName: "Phantom", domain: "phantom.app", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "rabby", name: "Rabby Wallet", shortName: "Rabby", domain: "rabby.io", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "coinbase-wallet", name: "Coinbase Wallet", shortName: "Coinbase Wallet", domain: "coinbase.com", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "exodus", name: "Exodus", shortName: "Exodus", domain: "exodus.com", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "electrum", name: "Electrum", shortName: "Electrum", domain: "electrum.org", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "bluewallet", name: "BlueWallet", shortName: "BlueWallet", domain: "bluewallet.io", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "safe", name: "Safe", shortName: "Safe", domain: "safe.global", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "argent", name: "Argent", shortName: "Argent", domain: "argent.xyz", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "rainbow", name: "Rainbow", shortName: "Rainbow", domain: "rainbow.me", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "okx-wallet", name: "OKX Wallet", shortName: "OKX Wallet", domain: "okx.com", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "binance-web3-wallet", name: "Binance Web3 Wallet", shortName: "Binance Web3", domain: "binance.com", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
];

export function getLogoUrl(domain: string) {
  return `https://logo.clearbit.com/${domain}`;
}

export function findExchangeById(id: string) {
  return EXCHANGES.find((item) => item.id === id);
}

export function findWalletById(id: string) {
  return WALLETS.find((item) => item.id === id);
}
