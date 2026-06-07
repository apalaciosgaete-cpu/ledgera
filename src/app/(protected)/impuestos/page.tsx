"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clp } from "@/shared/formatting";

type TaxStatus = "EMPTY" | "NO_TAX_EVENTS" | "DECLARE_REVIEW" | "PAY_REVIEW" | "LOSS_REVIEW";

type SummaryTotals = {
  eventsCount: number;
  realizedPnlClp: number;
  stakingRewardClp: number;
  stakingCount: number;
  baseImponibleClp: number;
  impuestoEstimadoClp: number;
  confidenceLevel: number;
};

type SummaryDecision = {
  status: TaxStatus;
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
  decision: SummaryDecision;
  nextAction: { label: string; href: string };
  totals: SummaryTotals;
  topAssets: TopAsset[];
  keyOperations: KeyOperations;
};

function statusConfig(status: TaxStatus) {
  switch (status) {
    case "EMPTY":
      return {
        border: "#CBD5E1",
        bg: "#F8FAFC",
        icon: "◌",
        iconColor: "#64748B",
        titleColor: "#475569",
        subtitle: "Sin movimientos registrados",
        description: "Para calcular impuestos necesitamos movimientos de inversión o staking.",
        ctaLabel: "Cargar movimientos",
        ctaHref: "/importaciones",
        ctaBg: "#0F766E",
      };
    case "NO_TAX_EVENTS":
      return {
        border: "#86EFAC",
        bg: "#F0FDF4",
        icon: "✓",
        iconColor: "#16A34A",
        titleColor: "#166534",
        subtitle: "Sin acción requerida",
        description: "No detectamos operaciones que requieran declaración tributaria.",
        ctaLabel: "Ver detalle",
        ctaHref: "/impuestos/resumen",
        ctaBg: "#16A34A",
      };
    case "DECLARE_REVIEW":
    case "PAY_REVIEW":
    case "LOSS_REVIEW":
      return {
        border: "#FDE047",
        bg: "#FEF9C3",
        icon: "⚠",
        iconColor: "#B45309",
        titleColor: "#854D0E",
        subtitle: "Declaración recomendada",
        description: "Detectamos ventas con ganancia y staking.",
        ctaLabel: "Revisar declaración",
        ctaHref: "/impuestos/resumen",
        ctaBg: "#B45309",
      };
  }
}

const yearEnd = new Date().getFullYear() + "-12-31";

const advancedTools = [
  { key: "explicacion", title: "¿Por qué debo declarar?", description: "Impacto por activo y operaciones relevantes.", href: "/impuestos/resumen", available: true },
  { key: "simulador", title: "Simulador", description: "¿Qué pasaría si vendo? Simula escenarios antes de operar.", href: "/impuestos/simulador", available: true },
  { key: "declaraciones", title: "Declaraciones", description: "Gestiona declaraciones tributarias, estados e historial.", href: "/impuestos/declaraciones", available: true },
  { key: "reportes", title: "Reportes", description: "Exporta PDF y CSV para tu contador o para tus registros.", href: "/impuestos/reportes", available: true },
];

const adminTools = [
  { key: "salud", title: "Problemas detectados", description: "Score, problemas detectados y recomendaciones.", href: "/impuestos/salud", available: true },
  { key: "evidencia", title: "Respaldo tributario", description: "Hash, verificación pública e integridad de declaraciones.", href: "/impuestos/evidencia", available: true },
  { key: "calendario", title: "Calendario", description: "Próximas declaraciones, cierres y obligaciones.", href: "/impuestos/calendario", available: true },
  { key: "cierre", title: "Cierre tributario", description: "Congela tu estado tributario cuando estés listo para declarar.", href: "/impuestos/cierre", available: true },
];

export default function ImpuestosHubPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax/summary?year=" + new Date().getFullYear(), { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo cargar el estado tributario.");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando estado tributario.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const cfg = data ? statusConfig(data.decision.status) : statusConfig("EMPTY");

  const hasSales = (data?.keyOperations.totalSales ?? 0) > 0;
  const hasStaking = (data?.keyOperations.totalStaking ?? 0) > 0;
  const topActiveAssets = (data?.topAssets ?? []).filter(a => a.eventsCount > 0 || a.stakingCount > 0).slice(0, 3);

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      {/* Header */}
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Centro tributario</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Estado tributario</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Revisa si debes declarar, por qué y cuál es tu próximo paso.
          </p>
        </div>
      </section>

      {loading ? (
        <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando estado tributario...</p>
      ) : error ? (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>
          {error}
        </div>
      ) : data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* 1. Tarjeta principal */}
          <section style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 14, padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ color: cfg.iconColor, fontSize: 20 }}>{cfg.icon}</span>
              <h2 style={{ color: cfg.titleColor, fontSize: "1.35rem", fontWeight: 850, margin: 0 }}>{cfg.subtitle}</h2>
            </div>

            <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.55, margin: "0 0 20px", maxWidth: 640 }}>
              {data.decision.status === "EMPTY" ? cfg.description : data.decision.detail}
            </p>

            {data.decision.status !== "EMPTY" && data.totals.impuestoEstimadoClp > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 4px", textTransform: "uppercase" }}>Impuesto estimado</p>
                <p style={{ color: "#0F2A3D", fontSize: "2rem", fontWeight: 850, lineHeight: 1.1, margin: 0 }}>{clp(data.totals.impuestoEstimadoClp)}</p>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href={cfg.ctaHref} style={{ background: cfg.ctaBg, borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "12px 22px", textDecoration: "none" }}>
                {cfg.ctaLabel} →
              </Link>
            </div>
          </section>

          {/* 2. ¿Por qué? */}
          {data.decision.status !== "EMPTY" && (
            <section>
              <p style={{ color: "#334155", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 14px", textTransform: "uppercase" }}>¿Por qué veo este resultado?</p>
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "22px 24px" }}>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {hasSales && (
                    <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#0F2A3D" }}>
                      <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span>
                      <span><strong>Ventas</strong> detectadas en tu portafolio</span>
                    </li>
                  )}
                  {hasStaking && (
                    <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#0F2A3D" }}>
                      <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span>
                      <span><strong>Staking</strong> registrado como ingreso</span>
                    </li>
                  )}
                  {topActiveAssets.map(asset => (
                    <li key={asset.symbol} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#0F2A3D" }}>
                      <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span>
                      <span>
                        <strong>{asset.symbol}</strong>
                        {asset.eventsCount > 0 && ` · ${asset.eventsCount} operaciones calculadas`}
                        {asset.stakingCount > 0 && ` · ${asset.stakingCount} staking`}
                      </span>
                    </li>
                  ))}
                  {!hasSales && !hasStaking && (
                    <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#475569" }}>
                      <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span>
                      <span>No detectamos ventas ni ingresos tributables con los datos actuales.</span>
                    </li>
                  )}
                </ul>
                <div style={{ marginTop: 18 }}>
                  <Link href="/impuestos/resumen" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#0F2A3D", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                    Ver explicación →
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* 3. Próximas acciones */}
          {data.decision.status !== "EMPTY" && (
            <section>
              <p style={{ color: "#334155", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 14px", textTransform: "uppercase" }}>Próximo paso recomendado</p>
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <p style={{ color: "#0F2A3D", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>
                    {data.decision.shouldDeclare ? "Revisar operaciones antes de declarar" : "Revisar movimientos registrados"}
                  </p>
                  <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>
                    Próxima revisión: <strong>{yearEnd}</strong>
                  </p>
                </div>
                <Link href={data.nextAction.href} style={{ background: data.decision.shouldDeclare ? "#B45309" : "#16A34A", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "12px 22px", textDecoration: "none", flexShrink: 0 }}>
                  {data.nextAction.label} →
                </Link>
              </div>
            </section>
          )}

          {/* 4. Herramientas avanzadas */}
          <section>
            <p style={{ color: "#334155", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 14px", textTransform: "uppercase" }}>Herramientas avanzadas</p>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
              {advancedTools.map((tool) => {
                const content = (
                  <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 18, height: "100%" }}>
                    <h3 style={{ color: "#0F2A3D", fontSize: "0.95rem", fontWeight: 850, margin: "0 0 6px" }}>{tool.title}</h3>
                    <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{tool.description}</p>
                  </article>
                );
                return tool.available ? (
                  <Link key={tool.key} href={tool.href} style={{ textDecoration: "none" }}>{content}</Link>
                ) : (
                  <div key={tool.key}>{content}</div>
                );
              })}
            </div>
          </section>

          {/* 5. Administración tributaria (colapsable) */}
          <section>
            <button
              type="button"
              onClick={() => setAdminOpen(v => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "16px 20px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                color: "#0F2A3D",
              }}
            >
              <span>Administración tributaria</span>
              <span style={{ transform: adminOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }}>▸</span>
            </button>

            {adminOpen && (
              <div style={{ marginTop: 14, display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}>
                {adminTools.map((tool) => {
                  const content = (
                    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 18 }}>
                      <h3 style={{ color: "#0F2A3D", fontSize: "0.95rem", fontWeight: 850, margin: "0 0 6px" }}>{tool.title}</h3>
                      <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{tool.description}</p>
                    </article>
                  );
                  return tool.available ? (
                    <Link key={tool.key} href={tool.href} style={{ textDecoration: "none" }}>{content}</Link>
                  ) : (
                    <div key={tool.key}>{content}</div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
