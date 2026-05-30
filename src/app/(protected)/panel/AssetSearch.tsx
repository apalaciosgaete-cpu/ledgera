"use client";

import { useState } from "react";
import { httpClient } from "@/shared/http/httpClient";

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

type CreateMovementResponse = {
  ok: boolean;
  message: string;
};

function usd(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Sin precio";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 1 ? 2 : 6,
    maximumFractionDigits: value >= 1 ? 2 : 8,
  }).format(value);
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function parseFormNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function AssetSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetResult[]>([]);
  const [selected, setSelected] = useState<AssetResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [quantity, setQuantity] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [feeUsd, setFeeUsd] = useState("0");
  const [executedAt, setExecutedAt] = useState(todayInputValue());

  async function searchAssets() {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setIsSuccess(false);
      setMessage("Escribe al menos 2 caracteres para buscar un activo.");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsSuccess(false);
    setSelected(null);

    try {
      const searchResponse = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(normalizedQuery)}`,
      );
      const searchJson = await searchResponse.json();
      const coins = (searchJson.coins ?? []).slice(0, 6) as CoinGeckoAsset[];

      if (coins.length === 0) {
        setResults([]);
        setMessage("No encontramos activos con ese nombre o símbolo.");
        return;
      }

      const ids = coins.map((coin) => coin.id).join(",");
      const marketResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=6&page=1&sparkline=false&price_change_percentage=24h`,
      );
      const markets = (await marketResponse.json()) as CoinGeckoMarket[];
      const marketMap = new Map(markets.map((market) => [market.id, market]));

      setResults(
        coins.map((coin) => {
          const market = marketMap.get(coin.id);

          return {
            ...coin,
            priceUsd: market?.current_price,
            change24h: market?.price_change_percentage_24h ?? null,
            image: market?.image ?? coin.large ?? coin.thumb,
          };
        }),
      );
    } catch {
      setResults([]);
      setMessage("No fue posible consultar CoinGecko en este momento.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(asset: AssetResult) {
    setSelected(asset);
    setPriceUsd(typeof asset.priceUsd === "number" ? String(asset.priceUsd) : "");
    setQuantity("");
    setFeeUsd("0");
    setExecutedAt(todayInputValue());
    setIsSuccess(false);
    setMessage("Completa los datos de compra para agregar este activo al consolidado.");
  }

  async function saveManualBuy() {
    if (!selected) {
      setIsSuccess(false);
      setMessage("Selecciona un activo antes de guardar.");
      return;
    }

    const parsedQuantity = parseFormNumber(quantity);
    const parsedPriceUsd = parseFormNumber(priceUsd);
    const parsedFeeUsd = feeUsd.trim() === "" ? 0 : parseFormNumber(feeUsd);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setIsSuccess(false);
      setMessage("Ingresa una cantidad válida.");
      return;
    }

    if (!Number.isFinite(parsedPriceUsd) || parsedPriceUsd <= 0) {
      setIsSuccess(false);
      setMessage("Ingresa un precio de compra válido.");
      return;
    }

    if (!Number.isFinite(parsedFeeUsd) || parsedFeeUsd < 0) {
      setIsSuccess(false);
      setMessage("Ingresa una comisión válida.");
      return;
    }

    if (!executedAt) {
      setIsSuccess(false);
      setMessage("Selecciona la fecha de compra.");
      return;
    }

    setSaving(true);
    setMessage("");
    setIsSuccess(false);

    try {
      await httpClient<CreateMovementResponse>("/api/portfolio/movements", {
        method: "POST",
        body: {
          type: "BUY",
          symbol: selected.symbol.toUpperCase(),
          quantity: parsedQuantity,
          priceUsd: parsedPriceUsd,
          feeUsd: parsedFeeUsd,
          executedAt,
        },
      });

      setIsSuccess(true);
      setMessage("Activo agregado correctamente. El consolidado se actualizará con este movimiento.");
      setQuantity("");
      setFeeUsd("0");
      window.setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      setIsSuccess(false);
      setMessage(error instanceof Error ? error.message : "No fue posible guardar el movimiento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1rem", fontWeight: 800 }}>Agregar activo manualmente</h2>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.85rem" }}>Busca el activo y registra una compra. LEDGERA calculará el consolidado desde ese movimiento.</p>
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

      {message && <p style={{ margin: "0 0 1rem", color: isSuccess ? "#16A34A" : "#64748B", fontSize: "0.85rem", fontWeight: 700 }}>{message}</p>}

      {results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: selected ? "1rem" : 0 }}>
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

      {selected && (
        <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "1rem", marginTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
            <img src={selected.image ?? selected.thumb} alt={selected.name} width={40} height={40} style={{ borderRadius: "50%", background: "#F8FAFC" }} />
            <div>
              <p style={{ margin: "0 0 2px", color: "#0F2A3D", fontWeight: 800 }}>{selected.name}</p>
              <p style={{ margin: 0, color: "#64748B", fontSize: "0.8rem", textTransform: "uppercase" }}>{selected.symbol} · precio actual {usd(selected.priceUsd)}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#475569", fontSize: "0.8rem", fontWeight: 800 }}>
              Cantidad
              <input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0.00" style={{ border: "1px solid #CBD5E1", borderRadius: 10, padding: "0.65rem 0.75rem", color: "#0F2A3D" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#475569", fontSize: "0.8rem", fontWeight: 800 }}>
              Precio compra USD
              <input value={priceUsd} onChange={(event) => setPriceUsd(event.target.value)} placeholder="0.00" style={{ border: "1px solid #CBD5E1", borderRadius: 10, padding: "0.65rem 0.75rem", color: "#0F2A3D" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#475569", fontSize: "0.8rem", fontWeight: 800 }}>
              Comisión USD
              <input value={feeUsd} onChange={(event) => setFeeUsd(event.target.value)} placeholder="0" style={{ border: "1px solid #CBD5E1", borderRadius: 10, padding: "0.65rem 0.75rem", color: "#0F2A3D" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#475569", fontSize: "0.8rem", fontWeight: 800 }}>
              Fecha compra
              <input type="date" value={executedAt} onChange={(event) => setExecutedAt(event.target.value)} style={{ border: "1px solid #CBD5E1", borderRadius: 10, padding: "0.65rem 0.75rem", color: "#0F2A3D" }} />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => void saveManualBuy()}
              disabled={saving}
              style={{ background: saving ? "#94A3B8" : "#16A34A", color: "#fff", border: "none", borderRadius: 10, padding: "0.75rem 1rem", fontWeight: 800, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Guardando..." : "Guardar compra"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
