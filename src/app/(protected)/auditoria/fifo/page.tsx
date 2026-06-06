"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ConsumedLot = {
  movementId: string;
  executedAt: string;
  quantityConsumed: number;
  unitCostUsd: number;
  costBasisUsd: number;
};

type FifoSale = {
  movementId: string;
  symbol: string;
  executedAt: string;
  quantity: number;
  priceUsd: number;
  feeUsd: number;
  proceedsGrossUsd: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  realizedPnlUsd: number;
  averageCostUsdAtSale: number;
  consumedLots: ConsumedLot[];
  missingQuantity: number;
};

type FifoData = {
  year: number | null;
  symbol: string | null;
  totalMovements: number;
  totalSales: number;
  sales: FifoSale[];
};

const formatterUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 4,
});

function usd(value: number) {
  return formatterUsd.format(value || 0);
}

export default function AuditoriaFifoPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState<FifoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (year) params.set("year", year);
      if (symbol) params.set("symbol", symbol);
      const res = await fetch(`/api/audit/fifo?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || "Error cargando FIFO.");
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, symbol]);

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Auditoría FIFO</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Desglose de lotes por venta</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Reconstruye qué compras fueron consumidas por cada venta. FIFO verificable.
          </p>
        </div>
        <Link href="/auditoria" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a auditoría
        </Link>
      </section>

      {/* Filtros */}
      <section style={{ alignItems: "end", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20, padding: 16 }}>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Año
          <select value={year} onChange={(e) => setYear(e.target.value)} style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}>
            <option value={String(currentYear)}>{currentYear}</option>
            <option value={String(currentYear - 1)}>{currentYear - 1}</option>
            <option value={String(currentYear - 2)}>{currentYear - 2}</option>
          </select>
        </label>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Activo
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="BTC, ETH..."
            style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 14, minHeight: 40, padding: "0 10px" }}
          />
        </label>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Calculando FIFO...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && data && (
        <>
          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Movimientos</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{data.totalMovements}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Ventas</p>
              <p style={{ color: "#991B1B", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{data.totalSales}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Ganancia total</p>
              <p style={{ color: data.sales.reduce((s, x) => s + x.realizedPnlUsd, 0) >= 0 ? "#15803D" : "#B45309", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>
                {usd(data.sales.reduce((s, x) => s + x.realizedPnlUsd, 0))}
              </p>
            </article>
          </section>

          {data.sales.length === 0 && (
            <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin ventas para los filtros seleccionados</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: 0 }}>Ajusta el año o el activo para ver el desglose FIFO.</p>
            </section>
          )}

          {data.sales.map((sale) => {
            const isExpanded = expandedId === sale.movementId;
            return (
              <section key={sale.movementId} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 12, overflow: "hidden" }}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : sale.movementId)}
                  style={{ alignItems: "center", background: "transparent", border: "none", cursor: "pointer", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "14px 18px", width: "100%", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 850 }}>{sale.symbol}</span>
                    <span style={{ color: "#64748B", fontSize: 13 }}>{new Date(sale.executedAt).toLocaleDateString("es-CL")}</span>
                    <span style={{ background: "#FEF2F2", borderRadius: 999, color: "#991B1B", fontSize: 12, fontWeight: 800, padding: "2px 10px" }}>Venta</span>
                    <span style={{ color: "#64748B", fontSize: 13 }}>{sale.quantity} unidades @ {usd(sale.priceUsd)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, margin: "0 0 2px", textTransform: "uppercase" }}>PnL</p>
                      <p style={{ color: sale.realizedPnlUsd >= 0 ? "#15803D" : "#B45309", fontSize: 14, fontWeight: 850, margin: 0 }}>{usd(sale.realizedPnlUsd)}</p>
                    </div>
                    <span style={{ color: "#94A3B8", fontSize: 18 }}>{isExpanded ? "▾" : "▸"}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid #E2E8F0", padding: "14px 18px" }}>
                    <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 14 }}>
                      <div>
                        <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, margin: "0 0 2px", textTransform: "uppercase" }}>Ingreso bruto</p>
                        <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 750, margin: 0 }}>{usd(sale.proceedsGrossUsd)}</p>
                      </div>
                      <div>
                        <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, margin: "0 0 2px", textTransform: "uppercase" }}>Ingreso neto</p>
                        <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 750, margin: 0 }}>{usd(sale.proceedsNetUsd)}</p>
                      </div>
                      <div>
                        <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, margin: "0 0 2px", textTransform: "uppercase" }}>Costo FIFO</p>
                        <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 750, margin: 0 }}>{usd(sale.costBasisUsd)}</p>
                      </div>
                      <div>
                        <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, margin: "0 0 2px", textTransform: "uppercase" }}>Costo promedio</p>
                        <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 750, margin: 0 }}>{usd(sale.averageCostUsdAtSale)}</p>
                      </div>
                      <div>
                        <p style={{ color: "#94A3B8", fontSize: 11, fontWeight: 850, margin: "0 0 2px", textTransform: "uppercase" }}>Fee</p>
                        <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 750, margin: 0 }}>{usd(sale.feeUsd)}</p>
                      </div>
                    </div>

                    {sale.missingQuantity > 0 && (
                      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, color: "#991B1B", fontSize: 12, fontWeight: 750, marginBottom: 10, padding: "8px 12px" }}>
                        ⚠ Inventario insuficiente: faltaron {sale.missingQuantity} unidades para cubrir esta venta.
                      </div>
                    )}

                    <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, margin: "0 0 8px" }}>Lotes consumidos ({sale.consumedLots.length})</p>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ borderCollapse: "collapse", minWidth: 600, width: "100%" }}>
                        <thead>
                          <tr style={{ background: "#F8FAFC", textAlign: "left" }}>
                            <th style={{ color: "#64748B", fontSize: 11, fontWeight: 850, padding: "8px 10px" }}>Compra origen</th>
                            <th style={{ color: "#64748B", fontSize: 11, fontWeight: 850, padding: "8px 10px" }}>Fecha compra</th>
                            <th style={{ color: "#64748B", fontSize: 11, fontWeight: 850, padding: "8px 10px" }}>Cantidad consumida</th>
                            <th style={{ color: "#64748B", fontSize: 11, fontWeight: 850, padding: "8px 10px" }}>Costo unitario</th>
                            <th style={{ color: "#64748B", fontSize: 11, fontWeight: 850, padding: "8px 10px" }}>Costo parcial</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sale.consumedLots.map((lot, i) => (
                            <tr key={i} style={{ borderTop: "1px solid #E2E8F0" }}>
                              <td style={{ color: "#94A3B8", fontSize: 12, fontFamily: "monospace", padding: "8px 10px" }}>{lot.movementId.slice(0, 8)}…</td>
                              <td style={{ color: "#334155", fontSize: 12, padding: "8px 10px", whiteSpace: "nowrap" }}>{new Date(lot.executedAt).toLocaleDateString("es-CL")}</td>
                              <td style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 750, padding: "8px 10px" }}>{lot.quantityConsumed}</td>
                              <td style={{ color: "#334155", fontSize: 12, padding: "8px 10px" }}>{usd(lot.unitCostUsd)}</td>
                              <td style={{ color: "#334155", fontSize: 12, padding: "8px 10px" }}>{usd(lot.costBasisUsd)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
