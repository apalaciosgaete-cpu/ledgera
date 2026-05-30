"use client";

import { useState } from "react";
import { httpClient } from "@/shared/http/httpClient";

type AssetResult = {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  large?: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseAmount(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function scrollToMainAssets() {
  document.getElementById("activos-principales")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function AssetSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetResult[]>([]);
  const [selected, setSelected] = useState<AssetResult | null>(null);
  const [quantity, setQuantity] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [feeUsd, setFeeUsd] = useState("0");
  const [executedAt, setExecutedAt] = useState(today());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    setQuantity("");
    setPriceUsd("");
    setFeeUsd("0");
    setExecutedAt(today());
    setMessage("Completa cantidad, precio y fecha para agregarlo a Activos principales.");
    window.setTimeout(scrollToMainAssets, 50);
  }

  async function saveBuy() {
    if (!selected) {
      setMessage("Selecciona un activo antes de guardar.");
      return;
    }

    const parsedQuantity = parseAmount(quantity);
    const parsedPriceUsd = parseAmount(priceUsd);
    const parsedFeeUsd = feeUsd.trim() ? parseAmount(feeUsd) : 0;

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setMessage("Ingresa una cantidad válida.");
      return;
    }

    if (!Number.isFinite(parsedPriceUsd) || parsedPriceUsd <= 0) {
      setMessage("Ingresa un precio de compra válido.");
      return;
    }

    if (!Number.isFinite(parsedFeeUsd) || parsedFeeUsd < 0) {
      setMessage("Ingresa una comisión válida.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await httpClient("/api/portfolio/movements", {
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

      setMessage("Compra guardada. Actualizando Activos principales...");
      window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible guardar la compra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: "0 0 4px", color: "#0F2A3D", fontSize: "1rem", fontWeight: 800 }}>Buscar activo</h2>
        <p style={{ margin: 0, color: "#64748B", fontSize: "0.85rem" }}>Busca el activo, selecciónalo y registra la compra para agregarlo al consolidado.</p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "1rem" }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchAssets(); }} placeholder="Buscar por nombre o símbolo: bitcoin, eth, sol..." style={{ flex: 1, minWidth: 260, border: "1px solid #CBD5E1", borderRadius: 10, padding: "0.7rem 0.85rem", color: "#0F2A3D", fontSize: "0.9rem", outline: "none" }} />
        <button type="button" onClick={() => void searchAssets()} disabled={loading} style={{ background: loading ? "#94A3B8" : "#0F2A3D", color: "#fff", border: "none", borderRadius: 10, padding: "0.7rem 1rem", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Buscando..." : "Buscar"}</button>
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
        <div style={{ marginTop: "1rem", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 12, padding: "0.85rem" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: "1rem" }}>
            <img src={selected.thumb || selected.large} alt={selected.name} width={34} height={34} style={{ borderRadius: "50%", background: "#fff", flexShrink: 0 }} />
            <div>
              <p style={{ margin: "0 0 2px", color: "#0F2A3D", fontWeight: 800 }}>{selected.name}</p>
              <p style={{ margin: 0, color: "#64748B", fontSize: "0.8rem", textTransform: "uppercase" }}>Activo seleccionado: {selected.symbol}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            <input value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Cantidad" style={{ border: "1px solid #CBD5E1", borderRadius: 10, padding: "0.65rem 0.75rem", color: "#0F2A3D" }} />
            <input value={priceUsd} onChange={(event) => setPriceUsd(event.target.value)} placeholder="Precio compra USD" style={{ border: "1px solid #CBD5E1", borderRadius: 10, padding: "0.65rem 0.75rem", color: "#0F2A3D" }} />
            <input value={feeUsd} onChange={(event) => setFeeUsd(event.target.value)} placeholder="Comisión USD" style={{ border: "1px solid #CBD5E1", borderRadius: 10, padding: "0.65rem 0.75rem", color: "#0F2A3D" }} />
            <input type="date" value={executedAt} onChange={(event) => setExecutedAt(event.target.value)} style={{ border: "1px solid #CBD5E1", borderRadius: 10, padding: "0.65rem 0.75rem", color: "#0F2A3D" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" onClick={() => void saveBuy()} disabled={saving} style={{ background: saving ? "#94A3B8" : "#16A34A", color: "#fff", border: "none", borderRadius: 10, padding: "0.75rem 1rem", fontWeight: 800, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Guardando..." : "Agregar a Activos principales"}</button>
          </div>
        </div>
      )}
    </section>
  );
}
