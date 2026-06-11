"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clp, usd, percent } from "@/shared/formatting";
import { round } from "@/shared/utils/math";

type SimulatorAsset = {
  symbol: string;
  quantity: number;
  currentPriceUsd: number;
  averageCostUsd: number;
  marketValueClp: number;
  unrealizedPnlClp: number;
  returnPercent: number | null;
};

type SimulatorData = {
  symbol: string;
  quantity: number;
  priceUsd: number;
  currentPriceUsd: number;
  avgCostUsd: number;
  availableQuantity: number;
  costBasisUsd: number;
  costBasisClp: number;
  proceedsGrossUsd: number;
  proceedsGrossClp: number;
  realizedPnlUsd: number;
  realizedPnlClp: number;
  taxUsd: number;
  taxClp: number;
  taxRate: number;
  usdClp: number;
  fxSource: string;
};

function Metric({ label, value, note, accent = "neutral" }: { label: string; value: string; note: string; accent?: "neutral" | "good" | "warn" | "info" }) {
  const color = accent === "good" ? "#15803D" : accent === "warn" ? "#B45309" : accent === "info" ? "#0F766E" : "#0F2A3D";
  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, minHeight: 112, padding: 16 }}>
      <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>{label}</p>
      <p style={{ color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{value}</p>
      <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.45, margin: 0 }}>{note}</p>
    </article>
  );
}

export default function SimuladorPage() {
  const [assets, setAssets] = useState<SimulatorAsset[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulatorData | null>(null);
  const [error, setError] = useState("");

  const selectedAsset = useMemo(
    () => assets.find((a) => a.symbol === selectedSymbol),
    [assets, selectedSymbol]
  );

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/investor/dashboard", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudieron cargar los activos.");
        const list: SimulatorAsset[] = (json.data?.activos ?? [])
          .filter((a: SimulatorAsset) => a.quantity > 0)
          .sort((a: SimulatorAsset, b: SimulatorAsset) => b.marketValueClp - a.marketValueClp);
        setAssets(list);
        if (list.length > 0) {
          setSelectedSymbol(list[0].symbol);
          setPriceInput(String(list[0].currentPriceUsd));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando activos.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      setPriceInput(String(selectedAsset.currentPriceUsd));
      setQuantityInput("");
      setResult(null);
      setError("");
    }
  }, [selectedAsset?.symbol]);

  async function handleSimulate() {
    if (!selectedAsset) return;
    const quantity = Number(quantityInput);
    const priceUsd = Number(priceInput);
    if (!quantity || quantity <= 0) {
      setError("Indica una cantidad válida.");
      return;
    }
    if (!priceUsd || priceUsd <= 0) {
      setError("Indica un precio estimado válido.");
      return;
    }
    try {
      setSimulating(true);
      setError("");
      const res = await fetch(
        `/api/tax/simulator?symbol=${encodeURIComponent(selectedAsset.symbol)}&quantity=${quantity}&priceUsd=${priceUsd}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Error al simular.");
      setResult(json.data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Error al simular.");
    } finally {
      setSimulating(false);
    }
  }

  const quickPercentages = useMemo(() => {
    if (!selectedAsset) return [];
    return [
      { label: "25%", value: selectedAsset.quantity * 0.25 },
      { label: "50%", value: selectedAsset.quantity * 0.5 },
      { label: "75%", value: selectedAsset.quantity * 0.75 },
      { label: "100%", value: selectedAsset.quantity },
    ];
  }, [selectedAsset]);

  if (loading) {
    return <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando simulador...</p>;
  }

  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Simulador tributario</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>¿Qué pasaría si vendo?</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Selecciona un activo, indica cuanto quieres vender y a que precio. LEDGERA estima tu ganancia e impuesto.
          </p>
        </div>
        <Link href="/mi-situacion" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver al resumen
        </Link>
      </section>

      {assets.length === 0 ? (
        <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
          <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Todavia no hay activos para simular</h2>
          <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: "0 auto 16px", maxWidth: 520 }}>
            Carga movimientos de compra o deposito para tener activos disponibles en el simulador.
          </p>
          <Link href="/importaciones" style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
            Cargar movimientos
          </Link>
        </section>
      ) : (
        <>
          <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, padding: 20 }}>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              <div>
                <label style={{ color: "#475569", display: "block", fontSize: 13, fontWeight: 750, marginBottom: 6 }}>Activo</label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 14, fontWeight: 750, minHeight: 44, padding: "0 12px", width: "100%" }}
                >
                  {assets.map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} — {usd(a.currentPriceUsd)} — {a.quantity} disp.
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: "#475569", display: "block", fontSize: 13, fontWeight: 750, marginBottom: 6 }}>Cantidad a vender</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={selectedAsset?.quantity}
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  placeholder={`Máx: ${selectedAsset?.quantity ?? 0}`}
                  style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 14, fontWeight: 750, minHeight: 44, padding: "0 12px", width: "100%" }}
                />
                {selectedAsset && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {quickPercentages.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => setQuantityInput(String(round(q.value, 8)))}
                        style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 6, color: "#475569", cursor: "pointer", fontSize: 12, fontWeight: 750, padding: "5px 10px" }}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ color: "#475569", display: "block", fontSize: 13, fontWeight: 750, marginBottom: 6 }}>Precio estimado (USD)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="Precio estimado"
                  style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 14, fontWeight: 750, minHeight: 44, padding: "0 12px", width: "100%" }}
                />
                {selectedAsset && selectedAsset.currentPriceUsd > 0 && (
                  <p style={{ color: "#64748B", fontSize: 12, margin: "6px 0 0" }}>
                    Precio actual: {usd(selectedAsset.currentPriceUsd)}
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                onClick={handleSimulate}
                disabled={simulating || !quantityInput || !priceInput}
                style={{
                  background: simulating || !quantityInput || !priceInput ? "#94A3B8" : "#0F766E",
                  border: "none",
                  borderRadius: 8,
                  color: "#FFFFFF",
                  cursor: simulating || !quantityInput || !priceInput ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontWeight: 850,
                  padding: "12px 20px",
                }}
              >
                {simulating ? "Simulando..." : "Simular venta"}
              </button>
            </div>

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, marginTop: 14, padding: 12 }}>
                {error}
              </div>
            )}
          </section>

          {result && (
            <>
              <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", marginBottom: 20 }}>
                <Metric
                  label="Venta estimada"
                  value={usd(result.proceedsGrossUsd)}
                  note={clp(result.proceedsGrossClp)}
                  accent="info"
                />
                <Metric
                  label="Ganancia / pérdida"
                  value={clp(result.realizedPnlClp)}
                  note={`${usd(result.realizedPnlUsd)} · ${percent((result.realizedPnlUsd / (result.costBasisUsd || 1)) * 100)} vs costo`}
                  accent={result.realizedPnlClp >= 0 ? "good" : "warn"}
                />
                <Metric
                  label="Impuesto estimado"
                  value={clp(result.taxClp)}
                  note={`${usd(result.taxUsd)} · ${(result.taxRate * 100).toFixed(1)}% de la ganancia`}
                  accent={result.taxClp > 0 ? "warn" : "good"}
                />
                <Metric
                  label="Neto después de impuesto"
                  value={clp(result.proceedsGrossClp - result.taxClp)}
                  note={`${usd(result.proceedsGrossUsd - result.taxUsd)} estimado`}
                  accent="neutral"
                />
              </section>

              <section style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 8, marginBottom: 20, padding: 16 }}>
                <p style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850, margin: "0 0 6px" }}>Detalle de la simulación</p>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569", fontSize: 13 }}>Activo</span>
                    <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{result.symbol}</strong>
                  </div>
                  <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569", fontSize: 13 }}>Cantidad a vender</span>
                    <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{result.quantity}</strong>
                  </div>
                  <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569", fontSize: 13 }}>Cantidad disponible</span>
                    <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{result.availableQuantity}</strong>
                  </div>
                  <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569", fontSize: 13 }}>Costo promedio</span>
                    <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{usd(result.avgCostUsd)}</strong>
                  </div>
                  <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569", fontSize: 13 }}>Precio estimado</span>
                    <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{usd(result.priceUsd)}</strong>
                  </div>
                  <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569", fontSize: 13 }}>Costo total estimado</span>
                    <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{clp(result.costBasisClp)}</strong>
                  </div>
                  <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569", fontSize: 13 }}>Tipo de cambio</span>
                    <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{clp(result.usdClp)}</strong>
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
