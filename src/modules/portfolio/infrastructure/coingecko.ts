type CoinGeckoSimplePriceResponse = Record<
  string,
  {
    usd?: number;
  }
>;

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

export type MarketPriceMap = Record<string, number>;

const priceCache = new Map<string, { value: MarketPriceMap; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

export async function getCoinGeckoPricesUsd(
  ids: string[]
): Promise<MarketPriceMap> {
  if (!ids.length) {
    return {};
  }

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  const cacheKey = uniqueIds.sort().join(",");
  const cached = priceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const url = new URL(`${COINGECKO_BASE_URL}/simple/price`);
  url.searchParams.set("ids", uniqueIds.join(","));
  url.searchParams.set("vs_currencies", "usd");

  const headers: HeadersInit = {
    Accept: "application/json",
  };

  const apiKey = process.env.COINGECKO_API_KEY?.trim();

  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `CoinGecko error ${response.status}: ${errorText || "unknown error"}`
      );
    }

    const data = (await response.json()) as CoinGeckoSimplePriceResponse;

    const result: MarketPriceMap = {};

    for (const id of uniqueIds) {
      result[id] = Number(data[id]?.usd ?? 0);
    }

    priceCache.set(cacheKey, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (err) {
    if (cached) {
      return cached.value;
    }
    throw err;
  }
}