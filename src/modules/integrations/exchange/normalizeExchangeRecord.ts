import { getExchangeAdapter } from "./exchangeAdapterRegistry";
import type { ExchangeProvider } from "./ExchangeProvider";
import type { ExchangeRawRecord, ExchangeNormalizedRecord } from "./ExchangeAdapter";

export function normalizeExchangeRecord(
  provider: ExchangeProvider,
  raw:      ExchangeRawRecord,
): ExchangeNormalizedRecord | null {
  const adapter = getExchangeAdapter(provider);
  return adapter.normalize(raw);
}
