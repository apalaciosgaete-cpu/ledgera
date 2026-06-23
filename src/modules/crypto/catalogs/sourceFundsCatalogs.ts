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
  { id: "binance", name: "Binance", shortName: "Binance", domain: "binance.com", logoUrl: "https://cdn.simpleicons.org/binance", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "coinbase", name: "Coinbase", shortName: "Coinbase", domain: "coinbase.com", logoUrl: "https://cdn.simpleicons.org/coinbase", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "kraken", name: "Kraken", shortName: "Kraken", domain: "kraken.com", logoUrl: "https://cdn.simpleicons.org/kraken", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "buda", name: "Buda.com", shortName: "Buda.com", domain: "buda.com", logoUrl: "https://logo.clearbit.com/buda.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "orionx", name: "Orionx", shortName: "Orionx", domain: "orionx.com", logoUrl: "https://logo.clearbit.com/orionx.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "crypto-mkt", name: "CryptoMKT", shortName: "CryptoMKT", domain: "cryptomkt.com", logoUrl: "https://logo.clearbit.com/cryptomkt.com", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "okx", name: "OKX", shortName: "OKX", domain: "okx.com", logoUrl: "https://cdn.simpleicons.org/okx", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bybit", name: "Bybit", shortName: "Bybit", domain: "bybit.com", logoUrl: "https://cdn.simpleicons.org/bybit", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "kucoin", name: "KuCoin", shortName: "KuCoin", domain: "kucoin.com", logoUrl: "https://cdn.simpleicons.org/kucoin", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bitget", name: "Bitget", shortName: "Bitget", domain: "bitget.com", logoUrl: "https://cdn.simpleicons.org/bitget", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "gate", name: "Gate.io", shortName: "Gate.io", domain: "gate.io", logoUrl: "https://cdn.simpleicons.org/gateio", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bitfinex", name: "Bitfinex", shortName: "Bitfinex", domain: "bitfinex.com", logoUrl: "https://cdn.simpleicons.org/bitfinex", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "bitstamp", name: "Bitstamp", shortName: "Bitstamp", domain: "bitstamp.net", logoUrl: "https://cdn.simpleicons.org/bitstamp", status: "available", connectionMethods: ["api", "manual_upload"] },
  { id: "gemini", name: "Gemini", shortName: "Gemini", domain: "gemini.com", logoUrl: "https://cdn.simpleicons.org/gemini", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "bitso", name: "Bitso", shortName: "Bitso", domain: "bitso.com", logoUrl: "https://cdn.simpleicons.org/bitso", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "htx", name: "HTX", shortName: "HTX", domain: "htx.com", logoUrl: "https://logo.clearbit.com/htx.com", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "mexc", name: "MEXC", shortName: "MEXC", domain: "mexc.com", logoUrl: "https://cdn.simpleicons.org/mexc", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
  { id: "bit2me", name: "Bit2Me", shortName: "Bit2Me", domain: "bit2me.com", logoUrl: "https://cdn.simpleicons.org/bit2me", status: "coming_soon", connectionMethods: ["api", "manual_upload"] },
];

export const WALLETS: SourceFundsItem[] = [
  { id: "metamask", name: "MetaMask", shortName: "MetaMask", domain: "metamask.io", logoUrl: "https://cdn.simpleicons.org/metamask", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "trust-wallet", name: "Trust Wallet", shortName: "Trust Wallet", domain: "trustwallet.com", logoUrl: "https://cdn.simpleicons.org/trustwallet", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "ledger", name: "Ledger", shortName: "Ledger", domain: "ledger.com", logoUrl: "https://cdn.simpleicons.org/ledger", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "trezor", name: "Trezor", shortName: "Trezor", domain: "trezor.io", logoUrl: "https://cdn.simpleicons.org/trezor", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "phantom", name: "Phantom", shortName: "Phantom", domain: "phantom.app", logoUrl: "https://cdn.simpleicons.org/phantom", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "rabby", name: "Rabby Wallet", shortName: "Rabby", domain: "rabby.io", logoUrl: "https://logo.clearbit.com/rabby.io", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "coinbase-wallet", name: "Coinbase Wallet", shortName: "Coinbase Wallet", domain: "coinbase.com", logoUrl: "https://cdn.simpleicons.org/coinbase", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "exodus", name: "Exodus", shortName: "Exodus", domain: "exodus.com", logoUrl: "https://cdn.simpleicons.org/exodus", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "electrum", name: "Electrum", shortName: "Electrum", domain: "electrum.org", logoUrl: "https://cdn.simpleicons.org/electrum", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "bluewallet", name: "BlueWallet", shortName: "BlueWallet", domain: "bluewallet.io", logoUrl: "https://logo.clearbit.com/bluewallet.io", status: "available", connectionMethods: ["address_scan", "manual_upload"] },
  { id: "safe", name: "Safe", shortName: "Safe", domain: "safe.global", logoUrl: "https://cdn.simpleicons.org/safe", status: "available", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "argent", name: "Argent", shortName: "Argent", domain: "argent.xyz", logoUrl: "https://cdn.simpleicons.org/argent", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "rainbow", name: "Rainbow", shortName: "Rainbow", domain: "rainbow.me", logoUrl: "https://cdn.simpleicons.org/rainbow", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "okx-wallet", name: "OKX Wallet", shortName: "OKX Wallet", domain: "okx.com", logoUrl: "https://cdn.simpleicons.org/okx", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
  { id: "binance-web3-wallet", name: "Binance Web3 Wallet", shortName: "Binance Web3", domain: "binance.com", logoUrl: "https://cdn.simpleicons.org/binance", status: "coming_soon", connectionMethods: ["wallet_connect", "address_scan"] },
];

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
