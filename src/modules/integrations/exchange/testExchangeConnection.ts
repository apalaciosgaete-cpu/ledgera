import { getExchangeAdapter } from "./exchangeAdapterRegistry";
import type { ExchangeProvider } from "./ExchangeProvider";
import type { ExchangeCredentials, ConnectionTestResult } from "./ExchangeAdapter";

export async function testExchangeConnection(
  provider:    ExchangeProvider,
  credentials: ExchangeCredentials,
): Promise<ConnectionTestResult> {
  const adapter = getExchangeAdapter(provider);
  return adapter.testConnection(credentials);
}
