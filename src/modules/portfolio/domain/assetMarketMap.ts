export const ASSET_COINGECKO_ID_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
};

export function getCoinGeckoIdBySymbol(symbol: string): string | null {
  return ASSET_COINGECKO_ID_MAP[symbol.toUpperCase()] ?? null;
}