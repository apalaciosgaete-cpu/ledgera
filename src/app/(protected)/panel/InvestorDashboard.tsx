"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clp, usd, percent } from "@/shared/formatting";

/* ─── Investor Dashboard types ─── */
type InvestorData = {
  patrimonio: {
    totalMarketValueClp: number;
    totalMarketValueUsd: number;
    assetCount: number;
  };
  rentabilidad: {
    totalReturnClp: number;
    totalReturnUsd: number;
    totalReturnPercent: number | null;
  };
  proximaAccion: {
    label: string;
    href: string;
    detail: string;
  };
};

/* ─── Tax Summary types (for SII card only) ─── */
type TaxStatus = "EMPTY" | "NO_TAX_EVENTS" | "DECLARE_REVIEW" | "PAY_REVIEW" | "LOSS_REVIEW";

type TaxSummaryDecision = {
  status: TaxStatus;
  label: string;
  headline: string;
  detail: string;
};

type TaxData = {
  decision: TaxSummaryDecision;
};

function situacionSIIConfig(status: TaxStatus) {
  switch (status) {
    case "NO_TAX_EVENTS":
      return {
        icon: "✓",
        iconColor: "#16A34A",
        border: "#86EFAC",
        bg: "#F0FDF4",
        titleColor: "#166534",
        subtitle: "Sin acción requerida",
      };
    case "EMPTY":
    case "LOSS_REVIEW":
      return {
        icon: "⚠",
        iconColor: "#B45309",
        border: "#FDE047",
        bg: "#FEF9C3",
        titleColor: "#854D0E",
        subtitle: "Revisión recomendada",
      };
    case "DECLARE_REVIEW":
    case "PAY_REVIEW":
      return {
        icon: "⚠",
        iconColor: "#DC2626",
        border: "#FECACA",
        bg: "#FEF2F2",
        titleColor: "#991B1B",
        subtitle: "Declaración requerida",
      };
  }
}

/* ─── Components ─── */
function MetricCard({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const valueColor = tone === "good" ? "#15803D" : tone === "warn" ? "#B45309" : "#0F2A3D";
  return (
    <article style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "22px" }}>
      <p style={{ color: "#64748B", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 10px", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ color: valueColor, fontSize: "1.8rem", fontWeight: 850, lineHeight: 1.15, margin: "0 0 6px" }}>
        {value}
      </p>
      <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.45, margin: 0 }}>{note}</p>
    </article>
  );
}

function EmptyState() {
  return (
    <div style={{ background: "#FFFFFF", border: "1px dashed #CBD5E1", borderRadius: 12, padding: "40px 28px", textAlign: "center" }}>
      <h2 style={{ color: "#0F2A3D", fontSize: "1.25rem", fontWeight: 850, margin: "0 0 10px" }}>Bienvenido a LEDGERA</h2>
      <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, margin: "0 auto 18px", maxWidth: 480 }}>
        Aún no tienes movimientos registrados. Carga tu primera operación para ver tu patrimonio y rentabilidad.
      </p>
      <Link
        href="/importaciones"
        style={{ background: "#0F766E", borderRadius: 8, color: "#FFFFFF", display: "inline-flex", fontSize: 14, fontWeight: 850, padding: "11px 16px", textDecoration: "none" }}
      >
        Cargar movimientos →
      </Link>
    </div>
  );
}

/* ─── Main Page ─── */
export function InvestorDashboard() {
  const [investor, setInvestor] = useState<InvestorData | null>(null);
  const [tax, setTax] = useState<TaxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [investorRes, taxRes] = await Promise.all([
          fetch("/api/investor/dashboard", { cache: "no-store" }),
          fetch("/api/tax/summary?year=" + new Date().getFullYear(), { cache: "no-store" }),
        ]);

        const investorJson = await investorRes.json();
        const taxJson = await taxRes.json();

        if (!investorRes.ok || !investorJson.ok) {
          throw new Error(investorJson.message || "Error cargando dashboard.");
        }

        setInvestor(investorJson.data);
        setTax(taxJson.ok ? taxJson.data : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando Inicio.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando…</p>;
  }

  if (error) {
    return (
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>
        {error}
      </div>
    );
  }

  if (!investor) {
    return <p style={{ color: "#64748B", fontSize: 14 }}>No hay datos para mostrar.</p>;
  }

  const isEmpty = !tax && investor.patrimonio.assetCount === 0;
  if (isEmpty) {
    return (
      <div style={{ maxWidth: 800, width: "100%" }}>
        <section style={{ marginBottom: 24 }}>
          <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>
            Inicio
          </p>
          <h1 style={{ color: "#0F2A3D", fontSize: "1.9rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>
            ¿Cómo estoy?
          </h1>
        </section>
        <EmptyState />
      </div>
    );
  }

  const returnTone = investor.rentabilidad.totalReturnUsd >= 0 ? "good" : "warn";
  const taxCfg = tax ? situacionSIIConfig(tax.decision.status) : null;

  return (
    <div style={{ maxWidth: 900, width: "100%" }}>
      <section style={{ marginBottom: 28 }}>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>
          Inicio
        </p>
        <h1 style={{ color: "#0F2A3D", fontSize: "1.9rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>
          ¿Cómo estoy?
        </h1>
        <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
          Resumen general de tu posición patrimonial y estado frente al SII.
        </p>
      </section>

      {/* 4 Cards */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", marginBottom: 24 }}>
        {/* Card 1: Patrimonio */}
        <MetricCard
          label="Patrimonio total"
          value={clp(investor.patrimonio.totalMarketValueClp)}
          note={`${usd(investor.patrimonio.totalMarketValueUsd)} valor estimado`}
        />

        {/* Card 2: Resultado acumulado */}
        <MetricCard
          label="Resultado acumulado"
          value={clp(investor.rentabilidad.totalReturnClp)}
          note={`${percent(investor.rentabilidad.totalReturnPercent)} · realizado + staking`}
          tone={returnTone}
        />

        {/* Card 3: Situación SII */}
        {taxCfg ? (
          <article
            style={{
              background: taxCfg.bg,
              border: `2px solid ${taxCfg.border}`,
              borderRadius: 12,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: taxCfg.iconColor, fontSize: 20 }}>{taxCfg.icon}</span>
                <p style={{ color: taxCfg.titleColor, fontSize: 13, fontWeight: 850, margin: 0 }}>Situación SII</p>
              </div>
              <p style={{ color: taxCfg.titleColor, fontSize: "1.15rem", fontWeight: 850, margin: "0 0 4px" }}>
                {taxCfg.subtitle}
              </p>
            </div>
            <Link
              href="/mi-situacion"
              style={{
                marginTop: 12,
                color: taxCfg.titleColor,
                fontSize: 13,
                fontWeight: 850,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Ver situación →
            </Link>
          </article>
        ) : (
          <MetricCard label="Situación SII" value="—" note="No disponible" />
        )}

        {/* Card 4: Próxima acción */}
        <article style={{ background: "#FFFFFF", border: "2px solid #0F766E", borderRadius: 12, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "#0F766E", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", margin: "0 0 8px", textTransform: "uppercase" }}>
              Próxima acción
            </p>
            <p style={{ color: "#0F2A3D", fontSize: "1.05rem", fontWeight: 850, margin: "0 0 4px", lineHeight: 1.25 }}>
              {investor.proximaAccion.label}
            </p>
            <p style={{ color: "#475569", fontSize: 12, lineHeight: 1.45, margin: 0 }}>
              {investor.proximaAccion.detail}
            </p>
          </div>
          <Link
            href={investor.proximaAccion.href}
            style={{
              marginTop: 14,
              background: "#0F766E",
              borderRadius: 8,
              color: "#FFFFFF",
              display: "inline-flex",
              fontSize: 13,
              fontWeight: 850,
              padding: "10px 16px",
              textDecoration: "none",
              alignSelf: "flex-start",
            }}
          >
            {investor.proximaAccion.label} →
          </Link>
        </article>
      </div>
    </div>
  );
}
