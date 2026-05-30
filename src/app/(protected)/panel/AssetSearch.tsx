"use client";

import { useRef, useState } from "react";

type AssetResult = {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  large?: string;
};

export function AssetSearch() {
  const selectedRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetResult[]>([]);
  const [selected, setSelected] = useState<AssetResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function searchAssets() {
    const value = query.trim();

    if (value.length < 2) {
      setMessage("Escribe al menos 2 caracteres para buscar un activo.");
      return;
    }

    setLoading(true);
    setMessage("");
    setSelected(null);

    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(value)}`);
      const json = await response.json();
      const coins = (json.coins ?? []).slice(0, 8) as AssetResult[];
      setResults(coins);
      if (coins.length === 0) setMessage("No encontramos activos con ese nombre o símbolo.");
    } catch {
      setResults([]);
      setMessage("No fue posible consultar CoinGecko en este momento.");
    } finally {
      setLoading(false);
    }
  }

  function selectAsset(asset: AssetResult) {
    setSelected(asset);
    window.setTimeout(() => {
      selectedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  return (
    <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1rem", fontWeight: 800 }}>Buscar activo</h2>
        <p style={{ margin: 0, color: "#64748B", fontSize: "0.85rem" }}>Consulta CoinGecko para identificar el activo y su logo.</p>
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

      {message && <p style={{ margin: "0 0 1rem", color: "#64748B", fontSize: "0.85rem", fontWeight: 700 }}>{message}</p>}

      {results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {results.map((asset) => (
            <button key={asset.id} type="button" onClick={() => selectAsset(asset)} style={{ background: selected?.id === asset.id ? "rgba(22,163,74,0.08)" : "#F8FAFC", border: selected?.id === asset.id ? "1px solid rgba(22,163,74,0.35)" : "1px solid #E2E8F0", borderRadius: 12, padding: "0.85rem", display: "flex", gap: 10, alignItems: "center", textAlign: "left", cursor: "pointer" }}>
              <img src={asset.thumb || asset.large} alt={asset.name} width={32} height={32} style={{ borderRadius: "50%", background: "#fff", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", color: "#0F2A3D", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{asset.name}</p>
                <p style={{ margin: 0, color: "#64748B", fontSize: "0.8rem", textTransform: "uppercase" }}>{asset.symbol}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div ref={selectedRef} style={{ marginTop: "1rem", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 12, padding: "0.85rem", display: "flex", gap: 10, alignItems: "center" }}>
          <img src={selected.thumb || selected.large} alt={selected.name} width={34} height={34} style={{ borderRadius: "50%", background: "#fff", flexShrink: 0 }} />
          <div>
            <p style={{ margin: "0 0 2px", color: "#0F2A3D", fontWeight: 800 }}>{selected.name}</p>
            <p style={{ margin: 0, color: "#64748B", fontSize: "0.8rem", textTransform: "uppercase" }}>Activo seleccionado: {selected.symbol}</p>
          </div>
        </div>
      )}
    </section>
  );
}
