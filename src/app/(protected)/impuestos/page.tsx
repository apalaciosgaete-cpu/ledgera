"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clp } from "@/shared/formatting";

type TaxStatus = "EMPTY" | "NO_TAX_EVENTS" | "DECLARE_REVIEW" | "PAY_REVIEW" | "LOSS_REVIEW";

type SummaryTotals = {
  eventsCount: number;
  realizedPnlClp: number;
  stakingRewardClp: number;
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

type SummaryData = {
  decision: SummaryDecision;
  nextAction: { label: string; href: string };
  totals: SummaryTotals;
};

function statusConfig(status: TaxStatus) {
  switch (status) {
    case "EMPTY":
      return {
        border: "#CBD5E1",
        bg: "#F8FAFC",
        titleColor: "#475569",
        subtitle: "Sin movimientos registrados",
        ctaLabel: "Cargar movimientos",
        ctaHref: "/importaciones",
        ctaBg: "#0F766E",
        showMetrics: false,
      };
    case "NO_TAX_EVENTS":
      return {
        border: "#86EFAC",
        bg: "#F0FDF4",
        titleColor: "#166534",
        subtitle: "Sin acción requerida",
        ctaLabel: "Ver detalle",
        ctaHref: "/impuestos/resumen",
        ctaBg: "#16A34A",
        showMetrics: false,
      };
    case "DECLARE_REVIEW":
    case "PAY_REVIEW":
    case "LOSS_REVIEW":
      return {
        border: "#FDE047",
        bg: "#FEF9C3",
        titleColor: "#854D0E",
        subtitle: "Declaración recomendada",
        ctaLabel: "Revisar declaración",
        ctaHref: "/impuestos/resumen",
        ctaBg: "#B45309",
        showMetrics: true,
      };
  }
}

const tools = [
  { key: "resumen", title: "Resumen", description: "Estado tributario ejecutivo. ¿Debo declarar? ¿Debo pagar? ¿Cuánto?", href: "/impuestos/resumen", available: true },
  { key: "explicacion", title: "Explicación", description: "¿Por qué obtuve este resultado? Impacto por activo y operaciones relevantes.", href: "/impuestos/resumen", available: true },
  { key: "simulador", title: "Simulador", description: "¿Qué pasaría si vendo? Simula escenarios antes de operar.", href: "/impuestos/simulador", available: true },
  { key: "revision", title: "Revisión", description: "Revisa operaciones calculadas, alertas e inconsistencias antes de declarar.", href: "/impuestos/revision", available: true },
  { key: "salud", title: "Calidad de información", description: "¿Cómo están tus datos? Score, problemas detectados y recomendaciones.", href: "/impuestos/salud", available: true },
  { key: "reportes", title: "Reportes", description: "Exporta PDF y CSV para tu contador o para tus registros.", href: "/impuestos/reportes", available: true },
  { key: "evidencia", title: "Verificación y respaldo", description: "Hash, verificación pública e integridad de declaraciones tributarias.", href: "/impuestos/evidencia", available: true },
  { key: "declaraciones", title: "Declaraciones", description: "Gestiona declaraciones tributarias, estados e historial.", href: "/impuestos/declaraciones", available: true },
  { key: "calendario", title: "Calendario", description: "¿Qué viene ahora? Próximas declaraciones, cierres y obligaciones.", href: "/impuestos/calendario", available: true },
  { key: "cierre", title: "Cierre tributario", description: "Congela tu estado tributario cuando estés listo para declarar. Reabre si necesitas corregir.", href: "/impuestos/cierre", available: true },
];

export default function ImpuestosHubPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
      {/* Header */}
      <section style={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>Centro tributario</p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>Todo tu tributario en un lugar</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
            Resumen, simulación, revisión y reportes. Sin saltar entre rutas.
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
        <>
          {/* Tarjeta principal de estado tributario */}
          <section style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 12, marginBottom: 32, padding: "28px 28px" }}>
            <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.08em", margin: "0 0 10px", textTransform: "uppercase" }}>Estado tributario</p>

            <h2 style={{ color: cfg.titleColor, fontSize: "1.5rem", fontWeight: 850, lineHeight: 1.2, margin: "0 0 6px" }}>
              {cfg.subtitle}
            </h2>

            <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.55, margin: "0 0 20px", maxWidth: 640 }}>
              {data.decision.detail}
            </p>

            {cfg.showMetrics && (
              <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: 20, flexWrap: "wrap" }}>
                <div>
                  <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 4px", textTransform: "uppercase" }}>Impuesto estimado</p>
                  <p style={{ color: "#0F2A3D", fontSize: "1.8rem", fontWeight: 850, lineHeight: 1.15, margin: 0 }}>{clp(data.totals.impuestoEstimadoClp)}</p>
                </div>
                {data.totals.baseImponibleClp > 0 && (
                  <div>
                    <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 4px", textTransform: "uppercase" }}>Monto afecto estimado</p>
                    <p style={{ color: "#475569", fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.15, margin: 0 }}>{clp(data.totals.baseImponibleClp)}</p>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href={cfg.ctaHref} style={{ background: cfg.ctaBg, borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "12px 20px", textDecoration: "none" }}>
                {cfg.ctaLabel} →
              </Link>
              {cfg.showMetrics && (
                <Link href="/impuestos/resumen" style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "12px 20px", textDecoration: "none" }}>
                  Ver detalle
                </Link>
              )}
            </div>
          </section>

          {/* Herramientas tributarias */}
          <section style={{ marginBottom: 24 }}>
            <p style={{ color: "#334155", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 16px", textTransform: "uppercase" }}>Herramientas tributarias</p>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" }}>
              {tools.map((tool) => {
                const content = (
                  <article style={{ background: tool.available ? "#FFFFFF" : "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, opacity: tool.available ? 1 : 0.7, padding: 18 }}>
                    <div style={{ alignItems: "center", display: "flex", gap: 10, marginBottom: 6 }}>
                      <h3 style={{ color: "#0F2A3D", fontSize: "0.95rem", fontWeight: 850, margin: 0 }}>{tool.title}</h3>
                      {!tool.available && <span style={{ background: "#F1F5F9", borderRadius: 999, color: "#64748B", fontSize: 11, fontWeight: 850, padding: "2px 8px" }}>Próximamente</span>}
                    </div>
                    <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{tool.description}</p>
                  </article>
                );
                if (tool.available) {
                  return <Link key={tool.key} href={tool.href} style={{ textDecoration: "none" }}>{content}</Link>;
                }
                return <div key={tool.key}>{content}</div>;
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
