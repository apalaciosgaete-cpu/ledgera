const BINANCE_PUBLIC = "https://api.binance.com";

const STABLECOINS = new Set(["USDT", "USDC", "BUSD", "FDUSD", "TUSD", "DAI", "USDP"]);

/**
 * Obtiene el precio histórico de un activo en USD usando la API pública
 * de Binance (klines, sin autenticación). Prueba pares USDT → USDC → BUSD.
 * Devuelve 1 para stablecoins y 0 si no encuentra precio.
 */
export async function fetchHistoricalCryptoPrice(
  symbol: string,
  date: Date,
): Promise<number> {
  const sym = symbol.toUpperCase();

  if (STABLECOINS.has(sym)) return 1;

  const ts   = date.getTime();
  const pairs = [`${sym}USDT`, `${sym}USDC`, `${sym}BUSD`];

  for (const pair of pairs) {
    try {
      const url = `${BINANCE_PUBLIC}/api/v3/klines?symbol=${pair}&interval=1h&startTime=${ts}&limit=1`;
      const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const data = await res.json() as unknown[][];
      if (Array.isArray(data) && data.length > 0) {
        const close = parseFloat(String(data[0][4]));
        if (Number.isFinite(close) && close > 0) return close;
      }
    } catch { continue; }
  }

  return 0;
}
