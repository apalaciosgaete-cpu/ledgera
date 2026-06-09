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
  source: string | null;
  deletedAt: string | null;
  deletedReason: string | null;
  createdAt: string;
};

type TaxEvent = {
  id: string;
  movementId: string;
  eventType: string;
  symbol: string;
  executedAt: string | null;
  effectiveTaxCategory: string;
  realizedPnlUsd: number;
  realizedPnlClp: number;
};

type MovementsData = {
  movements: Movement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: { buys: number; sells: number; deposits: number; withdrawals: number };
};

type EventsData = {
  events: TaxEvent[];
};

function typeLabel(type: string) {
  switch (type) {
    case "BUY": return { text: "Compra", color: "#166534", bg: "#F0FDF4" };
    case "SELL": return { text: "Venta", color: "#991B1B", bg: "#FEF2F2" };
    case "DEPOSIT": return { text: "Depósito", color: "#075985", bg: "#E0F2FE" };
    case "WITHDRAW": return { text: "Retiro", color: "#92400E", bg: "#FFFBEB" };
    case "STAKING_REWARD": return { text: "Staking", color: "#0F766E", bg: "#ECFDF5" };
    default: return { text: type, color: "#475569", bg: "#F1F5F9" };
  }
}

export default function AuditoriaMovimientosPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [typeFilter, setTypeFilter] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [page, setPage] = useState(1);
  const [movementsData, setMovementsData] = useState<MovementsData | null>(null);
  const [eventsData, setEventsData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 200;

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [mRes, eRes] = await Promise.all([
        fetch(`/api/movements?year=${year}&limit=${limit}&page=${page}${typeFilter ? `&type=${typeFilter}` : ""}${symbolFilter ? `&symbol=${symbolFilter}` : ""}`, { cache: "no-store" }),
        fetch(`/api/tax/events?year=${year}`, { cache: "no-store" }),
      ]);
      const mJson = await mRes.json();
      const eJson = await eRes.json();
      if (!mRes.ok || !mJson.ok) throw new Error(mJson.message || "Error cargando movimientos.");
      if (!eRes.ok || !eJson.ok) throw new Error(eJson.message || "Error cargando eventos.");
      setMovementsData(mJson.data);
      setEventsData(eJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, typeFilter, symbolFilter, page]);

  const eventByMovementId = useMemo(() => {
    if (!eventsData) return new Map<string, TaxEvent>();
    return new Map(eventsData.events.map((e) => [e.movementId, e]));
  }, [eventsData]);

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Auditoría de movimientos</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Origen de cada cálculo</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Cada movimiento y su relación con el evento tributario correspondiente. Trazabilidad completa.
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
          <select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}>
            <option value={String(currentYear)}>{currentYear}</option>
            <option value={String(currentYear - 1)}>{currentYear - 1}</option>
            <option value={String(currentYear - 2)}>{currentYear - 2}</option>
          </select>
        </label>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Tipo
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}>
            <option value="">Todos</option>
            <option value="BUY">Compra</option>
            <option value="SELL">Venta</option>
            <option value="DEPOSIT">Depósito</option>
            <option value="WITHDRAW">Retiro</option>
          </select>
        </label>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Activo
          <input
            type="text"
            value={symbolFilter}
            onChange={(e) => { setSymbolFilter(e.target.value.toUpperCase()); setPage(1); }}
            placeholder="BTC, ETH..."
            style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", fontSize: 14, minHeight: 40, padding: "0 10px" }}
          />
        </label>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando movimientos...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && movementsData && (
        <>
          {/* Stats */}
          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 20 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Total</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.35rem", fontWeight: 850, margin: 0 }}>{movementsData.total}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Compras</p>
              <p style={{ color: "#166534", fontSize: "1.35rem", fontWeight: 850, margin: 0 }}>{movementsData.stats.buys}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Ventas</p>
              <p style={{ color: "#991B1B", fontSize: "1.35rem", fontWeight: 850, margin: 0 }}>{movementsData.stats.sells}</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 6px", textTransform: "uppercase" }}>Eventos</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.35rem", fontWeight: 850, margin: 0 }}>{eventsData?.events.length ?? 0}</p>
            </article>
          </section>

          {/* Tabla */}
          <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", minWidth: 900, width: "100%" }}>
                <thead>
                  <tr style={{ background: "#0F2A3D", color: "#F8FAFC", textAlign: "left" }}>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Fecha</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Activo</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Tipo</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Cantidad</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Precio USD</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Fee USD</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Evento tributario</th>
                    <th style={{ fontSize: 12, fontWeight: 850, padding: "13px 14px" }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {movementsData.movements.map((m) => {
                    const event = eventByMovementId.get(m.id);
                    const t = typeLabel(m.type);
                    const isAnulled = !!m.deletedAt;
                    return (
                      <tr key={m.id} style={{ borderTop: "1px solid #E2E8F0", opacity: isAnulled ? 0.5 : 1 }}>
                        <td style={{ color: "#334155", fontSize: 13, padding: "12px 14px", whiteSpace: "nowrap" }}>
                          {m.executedAt ? new Date(m.executedAt).toLocaleDateString("es-CL") : "—"}
                        </td>
                        <td style={{ color: "#0F2A3D", fontSize: 14, fontWeight: 750, padding: "12px 14px" }}>{m.symbol}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: t.bg, borderRadius: 999, color: t.color, fontSize: 12, fontWeight: 800, padding: "2px 10px" }}>
                            {t.text}
                          </span>
                        </td>
                        <td style={{ color: "#334155", fontSize: 13, padding: "12px 14px" }}>{m.quantity}</td>
                        <td style={{ color: "#334155", fontSize: 13, padding: "12px 14px" }}>{m.priceUsd ?? "—"}</td>
                        <td style={{ color: "#334155", fontSize: 13, padding: "12px 14px" }}>{m.feeUsd ?? "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          {event ? (
                            <span style={{ alignItems: "center", display: "inline-flex", gap: 6 }}>
                              <span style={{ color: "#16A34A", fontSize: 13 }}>✓</span>
                              <span style={{ color: "#0F2A3D", fontSize: 12, fontWeight: 750 }}>{event.effectiveTaxCategory}</span>
                              <span style={{ color: "#64748B", fontSize: 11 }}>{event.realizedPnlUsd >= 0 ? "+" : ""}{event.realizedPnlUsd.toFixed(2)} USD</span>
                            </span>
                          ) : m.type === "SELL" ? (
                            <span style={{ color: "#DC2626", fontSize: 12, fontWeight: 750 }}>⚠ Sin evento</span>
                          ) : (
                            <span style={{ color: "#94A3B8", fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {isAnulled ? (
                            <span style={{ background: "#FEF2F2", borderRadius: 999, color: "#991B1B", fontSize: 11, fontWeight: 800, padding: "2px 8px" }}>Anulado</span>
                          ) : (
                            <span style={{ background: "#F0FDF4", borderRadius: 999, color: "#166534", fontSize: 11, fontWeight: 800, padding: "2px 8px" }}>Activo</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {movementsData.movements.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <p style={{ color: "#94A3B8", fontWeight: 600, margin: "0 0 4px" }}>Sin movimientos para los filtros seleccionados</p>
                <p style={{ color: "#CBD5E1", fontSize: 13, margin: 0 }}>Ajusta el año, tipo o activo para ver resultados.</p>
              </div>
            )}
          </section>

          {/* Paginación */}
          {movementsData.totalPages > 1 && (
            <section style={{ alignItems: "center", display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ background: page <= 1 ? "#F1F5F9" : "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: page <= 1 ? "#94A3B8" : "#0F2A3D", cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 750, padding: "8px 14px" }}
              >
                ← Anterior
              </button>
              <span style={{ color: "#64748B", fontSize: 13, fontWeight: 750 }}>
                Página {page} de {movementsData.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(movementsData.totalPages, p + 1))}
                disabled={page >= movementsData.totalPages}
                style={{ background: page >= movementsData.totalPages ? "#F1F5F9" : "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: page >= movementsData.totalPages ? "#94A3B8" : "#0F2A3D", cursor: page >= movementsData.totalPages ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 750, padding: "8px 14px" }}
              >
                Siguiente →
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
