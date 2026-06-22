import type { ExchangeAdapter } from "./ExchangeAdapter";
import type { ExchangeProvider } from "./ExchangeProvider";
import { BinanceAdapter } from "./adapters/BinanceAdapter";

const registry = new Map<ExchangeProvider, ExchangeAdapter>();

function registerDefaults() {
  const binance = new BinanceAdapter();
  registry.set(binance.provider, binance);
}

registerDefaults();

export function getExchangeAdapter(provider: ExchangeProvider): ExchangeAdapter {
  const adapter = registry.get(provider);
  if (!adapter) throw new Error(`No exchange adapter registered for provider: ${provider}`);
  return adapter;
}

export function getSupportedProviders(): ExchangeProvider[] {
  return [...registry.keys()];
}

export function registerAdapter(adapter: ExchangeAdapter): void {
  registry.set(adapter.provider, adapter);
}
