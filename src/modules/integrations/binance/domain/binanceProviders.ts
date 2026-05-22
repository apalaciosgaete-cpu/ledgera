export const BINANCE_SPOT_PROVIDER = "BINANCE" as const;
export const BINANCE_TAX_PROVIDER  = "BINANCE_TAX" as const;

export type BinanceProvider =
  | typeof BINANCE_SPOT_PROVIDER
  | typeof BINANCE_TAX_PROVIDER;

export function binanceProviderLabel(provider: string): string {
  if (provider === BINANCE_TAX_PROVIDER) return "Binance Tax Report API";
  if (provider === BINANCE_SPOT_PROVIDER) return "Binance Spot API";
  return provider;
}
