"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Movement = {
  id: string;
  type: string;
  symbol: string;
  quantity: number;
  priceUsd: number | null;
  feeUsd: number | null;
  executedAt: string;
};

type TaxEvent = {
  id: string;
  movementId: string;
  symbol: string;
  executedAt: string | null;
  quantity: number;
  effectiveTaxCategory: string;
  averageCostUsdAtSale: number;
  proceedsNetUsd: number;
  costBasisUsd: number;
  realizedPnlUsd: number;
  feeUsd: number;
};

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
  costBasisUsd: number;
  realizedPnlUsd: number;
  averageCostUsdAtSale: number;
  consumedLots: ConsumedLot[];
  missingQuantity: number;
};

type Declaration = {
  id: string;
  taxYear: number;
  declarationType: string;
  status: string;
  contentHash: string;
  generatedAt: string;
};

type Validation = {
  id: string;
  hash: string;
  type: string;
  typeLabel: string;
  isValid: boolean;
  issuedAt: string;
  year: number;
  symbol: string | null;
};

const formatterUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 });
function usd(value: number) { return formatterUsd.format(value || 0); }

function categoryLabel(category: string) {
  switch (category) {
    case "CAPITAL_GAIN": return { text: "Mayor valor", color: "#166534", bg: "#F0FDF4" };
    case "ORDINARY_INCOME": return { text: "Renta ordinaria", color: "#92400E", bg: "#FFFBEB" };
    case "NON_TAXABLE": return { text: "No afecto", color: "#075985", bg: "#E0F2FE" };
    case "UNCLASSIFIED": return { text: "Pendiente", color: "#991B1B", bg: "#FEF2F2" };
    default: return { text: category, color: "#475569", bg: "#F1F5F9" };
  }
}

function declStatusLabel(status: string) {
  switch (status) {
    case "DRAFT": return { text: "Borrador", bg: "#F1F5F9", color: "#475569" };
    case "REVIEWED": return { text: "Revisada", bg: "#E0F2FE", color: "#075985" };
    case "CONFIRMED": return { text: "Confirmada", bg: "#F0FDF4", color: "#166534" };
    case "VOIDED": return { text: "Anulada", bg: "#FEF2F2", color: "#991B1B" };
    case "EXPORTED": return { text: "Exportada", bg: "#FFFBEB", color: "#92400E" };
    default: return { text: status, bg: "#F1F5F9", color: "#475569" };
  }
}

export default function AuditoriaCadenaPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [events, setEvents] = useState<TaxEvent[]>([]);
  const [fifoSales, setFifoSales] = useState<FifoSale[]>([]);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [mRes, eRes, fRes, dRes, vRes] = await Promise.all([
        fetch(`/api/movements?type=SELL&limit=500&year=${year}`, { cache: "no-store" }),
        fetch(`/api/tax/events?year=${year}`, { cache: "no-store" }),
        fetch(`/api/audit/fifo?year=${year}`, { cache: "no-store" }),
        fetch(`/api/tax/declarations?year=${year}`, { cache: "no-store" }),
        fetch(`/api/report-validations?year=${year}`, { cache: "no-store" }),
      ]);
      const mJson = await mRes.json();
      const eJson = await eRes.json();
      const fJson = await fRes.json();
      const dJson = await dRes.json();
      const vJson = await vRes.json();

      if (!mRes.ok || !mJson.ok) throw new Error(mJson.message || "Error movimientos.");
      if (!eRes.ok || !eJson.ok) throw new Error(eJson.message || "Error eventos.");
      if (!fRes.ok || !fJson.ok) throw new Error(fJson.message || "Error FIFO.");

      setMovements(mJson.data.movements || []);
      setEvents(eJson.data.events || []);
      setFifoSales(fJson.data.sales || []);
      setDeclarations(dRes.ok && dJson.ok ? dJson.data.declarations : []);
      setValidations(vRes.ok && vJson.ok ? vJson.data.validations : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const eventByMovementId = useMemo(() => {
    const map = new Map<string, TaxEvent>();
    for (const e of events) map.set(e.movementId, e);
    return map;
  }, [events]);

  const fifoByMovementId = useMemo(() => {
    const map = new Map<string, FifoSale>();
    for (const s of fifoSales) map.set(s.movementId, s);
    return map;
  }, [fifoSales]);

  const chainItems = useMemo(() => {
    return movements.map((m) => ({
      movement: m,
      event: eventByMovementId.get(m.id) || null,
      fifo: fifoByMovementId.get(m.id) || null,
    }));
  }, [movements, eventByMovementId, fifoByMovementId]);

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Cadena de custodia</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Trazabilidad completa</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Movimiento → FIFO → Tax Event → DDJJ → Reporte → Hash → Verificación. Todo puede seguirse.
          </p>
        </div>
        <Link href="/auditoria" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
          Volver a auditoría
        </Link>
      </section>

      <section style={{ alignItems: "end", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20, padding: 16 }}>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Año
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}>
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
          </select>
        </label>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando cadena de custodia...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && (
        <>
          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 20 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Ventas</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{movements.length}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Eventos</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{events.length}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>DDJJ</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{declarations.length}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Validaciones</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, margin: 0 }}>{validations.length}</p>
            </article>
          </section>

          {chainItems.length === 0 && (
            <section style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 8, padding: 28, textAlign: "center" }}>
              <h2 style={{ color: "#0F2A3D", fontSize: "1.15rem", fontWeight: 850, margin: "0 0 8px" }}>Sin ventas en {year}</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.55, margin: 0 }}>No hay movimientos de venta para mostrar la cadena de custodia.</p>
            </section>
          )}

          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {chainItems.map((item) => {
              const isExpanded = expandedId === item.movement.id;
              const m = item.movement;
              const e = item.event;
              const f = item.fifo;
              return (
                <div key={m.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                  {/* Header de la venta */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    style={{ alignItems: "center", background: "transparent", border: "none", cursor: "pointer", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "16px 20px", width: "100%", textAlign: "left" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ background: "#FEF2F2", borderRadius: 999, color: "#991B1B", fontSize: 12, fontWeight: 800, padding: "4px 12px" }}>Venta</span>
                      <span style={{ color: "#0F2A3D", fontSize: 15, fontWeight: 850 }}>{m.symbol}</span>
                      <span style={{ color: "#64748B", fontSize: 13 }}>{m.executedAt ? new Date(m.executedAt).toLocaleDateString("es-CL") : "—"}</span>
                      <span style={{ color: "#64748B", fontSize: 13 }}>{m.quantity} @ {usd(m.priceUsd || 0)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      {e && (
                        <span style={{ color: e.realizedPnlUsd >= 0 ? "#15803D" : "#B45309", fontSize: 14, fontWeight: 750 }}>
                          {usd(e.realizedPnlUsd)}
                        </span>
                      )}
                      <span style={{ color: "#94A3B8", fontSize: 18 }}>{isExpanded ? "▾" : "▸"}</span>
                    </div>
                  </button>

                  {/* Cadena expandida */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid #E2E8F0", padding: "20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Nodo 1: Movimiento */}
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ alignItems: "center", display: "flex", flexDirection: "column", flexShrink: 0, width: 28 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0F2A3D", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>1</div>
                            <div style={{ width: 2, flex: 1, background: "#E2E8F0", marginTop: 4 }} />
                          </div>
                          <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                            <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, margin: "0 0 6px" }}>Movimiento origen</p>
                            <div style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                              <div><span style={{ color: "#94A3B8", fontSize: 11 }}>ID </span><span style={{ color: "#334155", fontSize: 12, fontFamily: "monospace" }}>{m.id.slice(0, 10)}…</span></div>
                              <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Fecha </span><span style={{ color: "#334155", fontSize: 12 }}>{m.executedAt ? new Date(m.executedAt).toLocaleDateString("es-CL") : "—"}</span></div>
                              <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Cantidad </span><span style={{ color: "#334155", fontSize: 12 }}>{m.quantity}</span></div>
                              <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Precio </span><span style={{ color: "#334155", fontSize: 12 }}>{usd(m.priceUsd || 0)}</span></div>
                              <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Fee </span><span style={{ color: "#334155", fontSize: 12 }}>{usd(m.feeUsd || 0)}</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Nodo 2: FIFO */}
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ alignItems: "center", display: "flex", flexDirection: "column", flexShrink: 0, width: 28 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0F766E", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>2</div>
                            <div style={{ width: 2, flex: 1, background: "#E2E8F0", marginTop: 4 }} />
                          </div>
                          <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                            <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, margin: "0 0 6px" }}>FIFO — Lotes consumidos</p>
                            {f && f.consumedLots.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {f.consumedLots.map((lot, i) => (
                                  <div key={i} style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
                                    <span style={{ color: "#334155", fontSize: 12 }}>Lote {i + 1}: {lot.quantityConsumed} unidades @ {usd(lot.unitCostUsd)}</span>
                                    <span style={{ color: "#64748B", fontSize: 12 }}>{usd(lot.costBasisUsd)}</span>
                                  </div>
                                ))}
                                <div style={{ borderTop: "1px solid #E2E8F0", marginTop: 4, paddingTop: 6 }}>
                                  <span style={{ color: "#0F2A3D", fontSize: 12, fontWeight: 750 }}>Costo FIFO total: {usd(f.costBasisUsd)}</span>
                                  {f.missingQuantity > 0 && <span style={{ color: "#DC2626", fontSize: 12, marginLeft: 12 }}>⚠ Inventario insuficiente (-{f.missingQuantity})</span>}
                                </div>
                              </div>
                            ) : (
                              <p style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>Sin datos FIFO</p>
                            )}
                          </div>
                        </div>

                        {/* Nodo 3: Tax Event */}
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ alignItems: "center", display: "flex", flexDirection: "column", flexShrink: 0, width: 28 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#D97706", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>3</div>
                            <div style={{ width: 2, flex: 1, background: "#E2E8F0", marginTop: 4 }} />
                          </div>
                          <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                            <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, margin: "0 0 6px" }}>Tax Event</p>
                            {e ? (
                              <div style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                                <div><span style={{ color: "#94A3B8", fontSize: 11 }}>ID </span><span style={{ color: "#334155", fontSize: 12, fontFamily: "monospace" }}>{e.id.slice(0, 10)}…</span></div>
                                <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Clasificación </span>
                                  <span style={{ background: categoryLabel(e.effectiveTaxCategory).bg, borderRadius: 999, color: categoryLabel(e.effectiveTaxCategory).color, fontSize: 11, fontWeight: 800, padding: "1px 8px" }}>
                                    {categoryLabel(e.effectiveTaxCategory).text}
                                  </span>
                                </div>
                                <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Ingreso neto </span><span style={{ color: "#334155", fontSize: 12 }}>{usd(e.proceedsNetUsd)}</span></div>
                                <div><span style={{ color: "#94A3B8", fontSize: 11 }}>Costo FIFO </span><span style={{ color: "#334155", fontSize: 12 }}>{usd(e.costBasisUsd)}</span></div>
                                <div><span style={{ color: "#94A3B8", fontSize: 11 }}>PnL </span><span style={{ color: e.realizedPnlUsd >= 0 ? "#15803D" : "#B45309", fontSize: 12, fontWeight: 750 }}>{usd(e.realizedPnlUsd)}</span></div>
                              </div>
                            ) : (
                              <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>⚠ No hay tax event asociado</p>
                            )}
                          </div>
                        </div>

                        {/* Nodo 4: DDJJ */}
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ alignItems: "center", display: "flex", flexDirection: "column", flexShrink: 0, width: 28 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#64748B", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>4</div>
                            <div style={{ width: 2, flex: 1, background: "#E2E8F0", marginTop: 4 }} />
                          </div>
                          <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                            <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, margin: "0 0 6px" }}>Declaraciones relacionadas</p>
                            {declarations.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {declarations.map((d) => (
                                  <div key={d.id} style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    <span style={{ background: declStatusLabel(d.status).bg, borderRadius: 999, color: declStatusLabel(d.status).color, fontSize: 11, fontWeight: 800, padding: "2px 8px" }}>{declStatusLabel(d.status).text}</span>
                                    <span style={{ color: "#334155", fontSize: 12 }}>{d.declarationType}</span>
                                    <span style={{ color: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}>{d.contentHash.slice(0, 12)}…</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>Sin declaraciones para {year}</p>
                            )}
                          </div>
                        </div>

                        {/* Nodo 5: Validaciones */}
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ alignItems: "center", display: "flex", flexDirection: "column", flexShrink: 0, width: 28 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#16A34A", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>5</div>
                          </div>
                          <div style={{ flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
                            <p style={{ color: "#0F2A3D", fontSize: 13, fontWeight: 850, margin: "0 0 6px" }}>Verificación pública</p>
                            {validations.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {validations.slice(0, 3).map((v) => (
                                  <div key={v.id} style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    <span style={{ background: v.isValid ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)", borderRadius: 999, color: v.isValid ? "#16A34A" : "#DC2626", fontSize: 11, fontWeight: 800, padding: "2px 8px" }}>{v.isValid ? "Válido" : "Revocado"}</span>
                                    <span style={{ color: "#334155", fontSize: 12 }}>{v.typeLabel}</span>
                                    <span style={{ color: "#94A3B8", fontSize: 11, fontFamily: "monospace" }}>{v.hash.slice(0, 12)}…</span>
                                  </div>
                                ))}
                                {validations.length > 3 && <span style={{ color: "#94A3B8", fontSize: 11 }}>+{validations.length - 3} más</span>}
                              </div>
                            ) : (
                              <p style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>Sin validaciones para {year}</p>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
