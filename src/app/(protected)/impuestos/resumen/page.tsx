"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SummaryDecision = {
  status: "EMPTY" | "NO_TAX_EVENTS" | "DECLARE_REVIEW" | "PAY_REVIEW" | "LOSS_REVIEW";
  label: string;
  headline: string;
  detail: string;
  shouldDeclare: boolean;
  likelyPayment: boolean;
};

type TopAsset = {
  symbol: string;
  realizedPnlClp: number;
  eventsCount: number;
  quantitySold: number;
  stakingRewardClp: number;
  stakingCount: number;
};

type KeyOperations = {
  totalSales: number;
  totalBuys: number;
  totalStaking: number;
  totalOther: number;
};

type SummaryData = {
  usdClp: number;
  availableYears: number[];
  decision: SummaryDecision;
  nextAction: {
    label: string;
    href: string;
  };
  totals: {
    eventsCount: number;
    realizedPnlUsd: number;
    realizedPnlClp: number;
    stakingRewardUsd: number;
    stakingRewardClp: number;
    stakingCount: number;
    baseImponibleClp: number;
    impuestoEstimadoClp: number;
    confidenceLevel: number;
  };
  topAssets: TopAsset[];
  keyOperations: KeyOperations;
};

type SummaryResponse = {
  ok: boolean;
  message?: string;
  data?: SummaryData;
};

const formatterClp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const formatterUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function clp(value: number) {
  return formatterClp.format(value || 0);
}

function usd(value: number) {
  return formatterUsd.format(value || 0);
}

function decisionTone(status: SummaryDecision["status"]) {
  if (status === "PAY_REVIEW") return { bg: "#FEF3C7", border: "#FCD34D", color: "#92400E", icon: "⚠" };
  if (status === "LOSS_REVIEW") return { bg: "#E0F2FE", border: "#7DD3FC", color: "#075985", icon: "ℹ" };
  if (status === "NO_TAX_EVENTS") return { bg: "#DCFCE7", border: "#86EFAC", color: "#166534", icon: "✓" };
  if (status === "EMPTY") return { bg: "#F8FAFC", border: "#CBD5E1", color: "#334155", icon: "○" };
  return { bg: "#ECFDF5", border: "#99F6E4", color: "#0F766E", icon: "✓" };
}

function confidenceLabel(level: number) {
  if (level >= 90) return { text: "Alta", color: "#15803D" };
  if (level >= 70) return { text: "Media", color: "#B45309" };
  return { text: "Baja", color: "#991B1B" };
}

function EmptyState({ onLoad }: { onLoad: () => void }) {
  return (
    <section style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1", borderRadius: 8, padding: "32px 24px", textAlign: "center" }}>
      <h2 style={{ color: "#0F2A3D", fontSize: "1.25rem", fontWeight: 850, margin: "0 0 10px" }}>Sin movimientos registrados</h2>
      <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 auto 18px", maxWidth: 520 }}>
        Carga operaciones para que LEDGERA calcule tu estado tributario y te oriente si debes declarar o pagar.
      </p>
      <Link href="/importaciones" style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "11px 16px", textDecoration: "none" }}>
        Cargar movimientos
      </Link>
    </section>
  );
}

export default function TaxExecutivePage() {
  const currentYear = new Date().getFullYear();
  const [data, setData] = useState<SummaryData | null>(null);
  const [year, setYear] = useState(String(currentYear));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSummary(nextYear = year) {
    setLoading(true);
    try {
      const response = await fetch(`/api/tax/summary?year=${nextYear}`, { cache: "no-store" });
      const json = (await response.json()) as SummaryResponse;

      if (!response.ok || !json.ok || !json.data) {
        throw new Error(json.message ?? "No se pudo cargar el resumen tributario.");
      }

      setData(json.data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el resumen tributario.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary(String(currentYear));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decision = data?.decision;
  const tone = decision ? decisionTone(decision.status) : decisionTone("EMPTY");
  const conf = data ? confidenceLabel(data.totals.confidenceLevel) : { text: "—", color: "#64748B" };

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ maxWidth: 760 }}>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Resumen tributario ejecutivo</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>¿Debo declarar o pagar?</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Lectura simple de tu situación tributaria actual. Sin complejidad.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Link href="/impuestos/simulador" style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
            Simular venta
          </Link>
          <Link href="/panel" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "10px 14px", textDecoration: "none" }}>
            Volver al panel
          </Link>
        </div>
      </section>

      <section style={{ alignItems: "end", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 20, padding: 16 }}>
        <label style={{ color: "#475569", display: "grid", fontSize: 13, fontWeight: 750, gap: 6 }}>
          Año tributario
          <select value={year} onChange={(event) => { setYear(event.target.value); void loadSummary(event.target.value); }} style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", minHeight: 40, padding: "0 10px" }}>
            <option value={String(currentYear)}>{currentYear}</option>
            {data?.availableYears.filter((item) => String(item) !== String(currentYear)).map((item) => (
              <option key={item} value={String(item)}>{item}</option>
            ))}
          </select>
        </label>
      </section>

      {loading && <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando resumen tributario...</p>}
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>{error}</div>}

      {!loading && decision?.status === "EMPTY" && (
        <EmptyState onLoad={() => void loadSummary(year)} />
      )}

      {!loading && data && decision && decision.status !== "EMPTY" && (
        <>
          <section style={{ background: tone.bg, border: `2px solid ${tone.border}`, borderRadius: 12, marginBottom: 20, padding: 24 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{tone.icon}</span>
              <span style={{ background: "#FFFFFF", borderRadius: 999, color: tone.color, display: "inline-flex", fontSize: 12, fontWeight: 850, padding: "6px 12px" }}>{decision.label}</span>
            </div>
            <h2 style={{ color: "#0F2A3D", fontSize: "1.5rem", fontWeight: 850, lineHeight: 1.2, margin: "0 0 8px" }}>{decision.headline}</h2>
            <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.55, margin: "0 0 16px", maxWidth: 780 }}>{decision.detail}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href={data.nextAction.href} style={{ background: "#0F2A3D", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "11px 16px", textDecoration: "none" }}>
                {data.nextAction.label} →
              </Link>
              <Link href="/tax/reports" style={{ border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "11px 16px", textDecoration: "none" }}>
                Ver reportes
              </Link>
            </div>
          </section>

          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", marginBottom: 20 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Ganancias realizadas</p>
              <p style={{ color: data.totals.realizedPnlClp >= 0 ? "#15803D" : "#B45309", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{clp(data.totals.realizedPnlClp)}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{usd(data.totals.realizedPnlUsd)} realizado</p>
            </article>

            {data.totals.stakingCount > 0 && (
              <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
                <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Ingresos por staking</p>
                <p style={{ color: "#15803D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{clp(data.totals.stakingRewardClp)}</p>
                <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{usd(data.totals.stakingRewardUsd)} en {data.totals.stakingCount} rewards</p>
              </article>
            )}

            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Base imponible estimada</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{clp(data.totals.baseImponibleClp)}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Ganancias + staking</p>
            </article>

            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Impuesto estimado</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{clp(data.totals.impuestoEstimadoClp)}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Aprox. 6.5% de base</p>
            </article>

            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Nivel de confianza</p>
              <p style={{ color: conf.color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{conf.text}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{data.totals.confidenceLevel}% de certeza</p>
            </article>

            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Eventos tributarios</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{data.totals.eventsCount}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Ventas calculadas</p>
            </article>
          </section>

          <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", marginBottom: 20 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>¿Por qué debo declarar?</h3>
              <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.55, margin: "0 0 10px" }}>{decision.detail}</p>
              <p style={{ color: "#64748B", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                Basado en {data.keyOperations.totalSales} ventas, {data.keyOperations.totalBuys} compras
                {data.keyOperations.totalStaking > 0 ? ` y ${data.keyOperations.totalStaking} staking rewards` : ""} registrados.
              </p>
            </article>

            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 18 }}>
              <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: "0 0 10px" }}>Operaciones relevantes</h3>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#475569", fontSize: 13 }}>Ventas</span>
                  <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{data.keyOperations.totalSales}</strong>
                </div>
                <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#475569", fontSize: 13 }}>Compras</span>
                  <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{data.keyOperations.totalBuys}</strong>
                </div>
                {data.keyOperations.totalStaking > 0 && (
                  <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569", fontSize: 13 }}>Staking rewards</span>
                    <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{data.keyOperations.totalStaking}</strong>
                  </div>
                )}
                {data.keyOperations.totalOther > 0 && (
                  <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569", fontSize: 13 }}>Otros movimientos</span>
                    <strong style={{ color: "#0F2A3D", fontSize: 13 }}>{data.keyOperations.totalOther}</strong>
                  </div>
                )}
              </div>
            </article>
          </section>

          {data.topAssets.length > 0 && (
            <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, marginBottom: 20, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #E2E8F0" }}>
                <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>Impacto por activo</h3>
              </div>
              <div style={{ display: "grid", gap: 0 }}>
                {data.topAssets.map((asset) => (
                  <div key={asset.symbol} style={{ alignItems: "center", borderTop: "1px solid #E2E8F0", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", padding: "14px 18px" }}>
                    <div style={{ minWidth: 80 }}>
                      <p style={{ color: "#0F2A3D", fontSize: 15, fontWeight: 850, margin: 0 }}>{asset.symbol}</p>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
                      {asset.realizedPnlClp !== 0 && (
                        <div>
                          <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 3px", textTransform: "uppercase" }}>
                            {asset.realizedPnlClp >= 0 ? "Ganancia" : "Pérdida"}
                          </p>
                          <p style={{ color: asset.realizedPnlClp >= 0 ? "#15803D" : "#B45309", fontSize: 14, fontWeight: 850, margin: 0 }}>
                            {clp(Math.abs(asset.realizedPnlClp))}
                          </p>
                        </div>
                      )}
                      {asset.stakingRewardClp > 0 && (
                        <div>
                          <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 3px", textTransform: "uppercase" }}>Staking</p>
                          <p style={{ color: "#0F766E", fontSize: 14, fontWeight: 850, margin: 0 }}>{clp(asset.stakingRewardClp)}</p>
                        </div>
                      )}
                      {asset.realizedPnlClp === 0 && asset.stakingRewardClp === 0 && (
                        <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Sin impacto calculado</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
