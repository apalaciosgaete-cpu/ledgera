"use client";

import { useState } from "react";

type CoinGeckoAsset = {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  large: string;
  market_cap_rank: number | null;
};

type CoinGeckoMarket = {
  id: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  image: string;
};

type AssetResult = CoinGeckoAsset & {
  priceUsd?: number;
  change24h?: number | null;
  image?: string;
};

function usd(value: number | undefined) {
  if (typeof value !== "number") return "Sin precio";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 1 ? 2 : 6,
    maximumFractionDigits: value >= 1 ? 2 : 8,
  }).format(value);
}

export function AssetSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetResult[]>([]);
  const [selected, setSelected] = useState<AssetResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function searchAssets() {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setMessage("Escribe al menos 2 caracteres para buscar un activo.");
      return;
    }

    setLoading(true);
    setMessage("");
    setSelected(null);

    try {
      const searchResponse = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(normalizedQuery)}`);
      const searchJson = await searchResponse.json();
      const coins = (searchJson.coins ?? []).slice(0, 6) as CoinGeckoAsset[];

      if (coins.length === 0) {
        setResults([]);
        setMessage("No encontramos activos con ese nombre o símbolo.");
        return;
      }

      const ids = coins.map((coin) => coin.id).join(",");
      const marketResponse = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=6&page=1&sparkline=false&price_change_percentage=24h`);
      const markets = (await marketResponse.json()) as CoinGeckoMarket[];
      const marketMap = new Map(markets.map((market) => [market.id, market]));

      setResults(coins.map((coin) => {
        const market = marketMap.get(coin.id);
        return {
          ...coin,
          priceUsd: market?.current_price,
          change24h: market?.price_change_percentage_24h ?? null,
          image: market?.image ?? coin.large ?? coin.thumb,
        };
      }));
    } catch {
      setResults([]);
      setMessage("No fue posible consultar CoinGecko en este momento.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(asset: AssetResult) {
    setSelected(asset);
    setMessage("Activo seleccionado. Completa cantidad y fecha en la siguiente etapa de carga manual.");
  }

  return (
    <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1rem", fontWeight: 800 }}>Agregar activo manualmente</h2>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.85rem" }}>Busca el activo, revisa su logo y precio actual antes de agregarlo al consolidado.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void searchAssets();
          }}
          placeholder="Buscar por nombre o símbolo: bitcoin, eth, sol..."
          style={{ flex: 1, minWidth: 260, border: "1px solid #CBD5E1", borderRadius: 10, padding: "0.7rem 0.85rem", color: "#0F2A3D", fontSize: "0.9rem", outline: "none" }}
        />
        <button
          type="button"
          onClick={() => void searchAssets()}
          disabled={loading}
          style={{ background: loading ? "#94A3B8" : "#0F2A3D", color: "#fff", border: "none", borderRadius: 10, padding: "0.7rem 1rem", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {message && <p style={{ margin: "0 0 1rem", color: selected ? "#16A34A" : "#64748B", fontSize: "0.85rem", fontWeight: 700 }}>{message}</p>}

      {results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {results.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => handleSelect(asset)}
              style={{ background: selected?.id === asset.id ? "rgba(22,163,74,0.08)" : "#F8FAFC", border: selected?.id === asset.id ? "1px solid rgba(22,163,74,0.35)" : "1px solid #E2E8F0", borderRadius: 12, padding: "0.85rem", display: "flex", gap: 10, alignItems: "center", textAlign: "left", cursor: "pointer" }}
            >
              <img src={asset.image ?? asset.thumb} alt={asset.name} width={36} height={36} style={{ borderRadius: "50%", background: "#fff", flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: "0 0 2px", color: "#0F2A3D", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{asset.name}</p>
                <p style={{ margin: 0, color: "#64748B", fontSize: "0.8rem", textTransform: "uppercase" }}>{asset.symbol}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: "0 0 2px", color: "#0F2A3D", fontWeight: 800, fontSize: "0.85rem" }}>{usd(asset.priceUsd)}</p>
                {typeof asset.change24h === "number" && (
                  <p style={{ margin: 0, color: asset.change24h >= 0 ? "#16A34A" : "#DC2626", fontSize: "0.75rem", fontWeight: 800 }}>{asset.change24h.toFixed(2)}%</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
