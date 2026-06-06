"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clp, usd, percent } from "@/shared/formatting";

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

function statusTone(status: TaxStatus) {
  switch (status) {
    case "EMPTY": return { bg: "#F1F5F9", border: "#CBD5E1", color: "#475569", icon: "◌" };
    case "NO_TAX_EVENTS": return { bg: "#F0FDF4", border: "#86EFAC", color: "#166534", icon: "✓" };
    case "DECLARE_REVIEW": return { bg: "#FEF9C3", border: "#FDE047", color: "#854D0E", icon: "!" };
    case "PAY_REVIEW": return { bg: "#FEF2F2", border: "#FCA5A5", color: "#991B1B", icon: "!" };
    case "LOSS_REVIEW": return { bg: "#FFFBEB", border: "#FCD34D", color: "#92400E", icon: "!" };
  }
}

function confidenceTone(level: number) {
  if (level >= 90) return { color: "#15803D", label: "Excelente" };
  if (level >= 70) return { color: "#0F766E", label: "Bueno" };
  if (level >= 40) return { color: "#B45309", label: "Regular" };
  return { color: "#991B1B", label: "Crítico" };
}

const sections = [
  {
    key: "resumen",
    title: "Resumen",
    description: "Estado tributario ejecutivo. ¿Debo declarar? ¿Debo pagar? ¿Cuánto?",
    href: "/impuestos/resumen",
    available: true,
  },
  {
    key: "explicacion",
    title: "Explicación",
    description: "¿Por qué obtuve este resultado? Impacto por activo y operaciones relevantes.",
    href: "/impuestos/resumen",
    available: true,
  },
  {
    key: "simulador",
    title: "Simulador",
    description: "¿Qué pasaría si vendo? Simula escenarios antes de operar.",
    href: "/impuestos/simulador",
    available: true,
  },
  {
    key: "revision",
    title: "Revisión",
    description: "Revisa eventos tributarios, alertas e inconsistencias antes de declarar.",
    href: "/impuestos/revision",
    available: true,
  },
  {
    key: "salud",
    title: "Salud",
    description: "¿Cómo están tus datos? Score, problemas detectados y recomendaciones.",
    href: "/impuestos/salud",
    available: true,
  },
  {
    key: "reportes",
    title: "Reportes",
    description: "Exporta PDF y CSV para tu contador o para tus registros.",
    href: "/impuestos/reportes",
    available: true,
  },
  {
    key: "evidencia",
    title: "Evidencia",
    description: "Hash, verificación pública e integridad de declaraciones tributarias.",
    href: "/impuestos/evidencia",
    available: true,
  },
  {
    key: "declaraciones",
    title: "Declaraciones",
    description: "Gestiona declaraciones tributarias, estados e historial.",
    href: "/impuestos/declaraciones",
    available: true,
  },
  {
    key: "calendario",
    title: "Calendario",
    description: "¿Qué viene ahora? Próximas declaraciones, cierres y obligaciones.",
    href: "/impuestos/calendario",
    available: true,
  },
  {
    key: "cierre",
    title: "Cierre Tributario",
    description: "Congela tu estado tributario cuando estés listo para declarar. Reabre si necesitas corregir.",
    href: "/impuestos/cierre",
    available: true,
  },
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

  const tone = data ? statusTone(data.decision.status) : statusTone("EMPTY");
  const conf = data ? confidenceTone(data.totals.confidenceLevel) : { color: "#64748B", label: "—" };

  return (
    <div style={{ maxWidth: 1180, width: "100%" }}>
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
          <section style={{ background: tone.bg, border: `2px solid ${tone.border}`, borderRadius: 12, marginBottom: 24, padding: "22px 24px" }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <span style={{ color: tone.color, fontSize: 18, fontWeight: 850 }}>{tone.icon}</span>
              <span style={{ color: tone.color, fontSize: 13, fontWeight: 850 }}>{data.decision.label}</span>
            </div>
            <h2 style={{ color: "#0F2A3D", fontSize: "1.4rem", fontWeight: 850, lineHeight: 1.2, margin: "0 0 8px" }}>{data.decision.headline}</h2>
            <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.55, margin: "0 0 16px", maxWidth: 720 }}>{data.decision.detail}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href={data.nextAction.href} style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "11px 16px", textDecoration: "none" }}>
                {data.nextAction.label} →
              </Link>
              <Link href="/impuestos/simulador" style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F2A3D", display: "inline-flex", fontSize: 13, fontWeight: 850, padding: "11px 16px", textDecoration: "none" }}>
                Simular venta
              </Link>
            </div>
          </section>

          <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 24 }}>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Base imponible</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{clp(data.totals.baseImponibleClp)}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Estimada CLP</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Impuesto estimado</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{clp(data.totals.impuestoEstimadoClp)}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>~6.5% de la base</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Salud datos</p>
              <p style={{ color: conf.color, fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{conf.label}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>{data.totals.confidenceLevel}% confianza</p>
            </article>
            <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 }}>
              <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>Eventos</p>
              <p style={{ color: "#0F2A3D", fontSize: "1.45rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>{data.totals.eventsCount}</p>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Ventas calculadas</p>
            </article>
          </section>
        </>
      ) : null}

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", marginBottom: 24 }}>
        {sections.map((section) => {
          const content = (
            <article style={{
              background: section.available ? "#FFFFFF" : "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              opacity: section.available ? 1 : 0.7,
              padding: 20,
            }}>
              <div style={{ alignItems: "center", display: "flex", gap: 10, marginBottom: 8 }}>
                <h3 style={{ color: "#0F2A3D", fontSize: "1rem", fontWeight: 850, margin: 0 }}>{section.title}</h3>
                {!section.available && (
                  <span style={{ background: "#F1F5F9", borderRadius: 999, color: "#64748B", fontSize: 11, fontWeight: 850, padding: "2px 8px" }}>Próximamente</span>
                )}
              </div>
              <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{section.description}</p>
            </article>
          );

          if (section.available) {
            return (
              <Link key={section.key} href={section.href} style={{ textDecoration: "none" }}>
                {content}
              </Link>
            );
          }
          return <div key={section.key}>{content}</div>;
        })}
      </section>
    </div>
  );
}
