"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clp } from "@/shared/formatting";

type TaxStatus = "EMPTY" | "NO_TAX_EVENTS" | "DECLARE_REVIEW" | "PAY_REVIEW" | "LOSS_REVIEW";

type TaxSummaryDecision = {
  status: TaxStatus;
  label: string;
  headline: string;
  detail: string;
  shouldDeclare: boolean;
  likelyPayment: boolean;
};

type TaxSummaryTotals = {
  eventsCount: number;
  realizedPnlClp: number;
  stakingRewardClp: number;
  stakingCount: number;
  baseImponibleClp: number;
  impuestoEstimadoClp: number;
  confidenceLevel: number;
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
  decision: TaxSummaryDecision;
  nextAction: { label: string; href: string };
  totals: TaxSummaryTotals;
  topAssets: TopAsset[];
  keyOperations: KeyOperations;
};

function situacionConfig(status: TaxStatus) {
  switch (status) {
    case "NO_TAX_EVENTS":
      return {
        tone: "ok" as const,
        icon: "✓",
        iconColor: "#16A34A",
        border: "#86EFAC",
        bg: "#F0FDF4",
        titleColor: "#166534",
        subtitle: "Sin acción requerida",
      };
    case "EMPTY":
      return {
        tone: "warn" as const,
        icon: "◌",
        iconColor: "#B45309",
        border: "#FDE047",
        bg: "#FEF9C3",
        titleColor: "#854D0E",
        subtitle: "Revisión recomendada",
      };
    case "LOSS_REVIEW":
      return {
        tone: "warn" as const,
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
        tone: "alert" as const,
        icon: "⚠",
        iconColor: "#DC2626",
        border: "#FECACA",
        bg: "#FEF2F2",
        titleColor: "#991B1B",
        subtitle: "Declaración requerida",
      };
  }
}

export default function MiSituacionPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tax/summary?year=" + new Date().getFullYear(), { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message || "No se pudo cargar tu situación.");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error cargando tu situación.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, width: "100%" }}>
        <p style={{ color: "#64748B", fontSize: 14, fontWeight: 750 }}>Cargando tu situación…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, width: "100%" }}>
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#991B1B", fontWeight: 750, padding: 16 }}>
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 800, width: "100%" }}>
        <p style={{ color: "#64748B", fontSize: 14 }}>No hay datos para mostrar.</p>
      </div>
    );
  }

  const cfg = situacionConfig(data.decision.status);
  const hasSales = data.keyOperations.totalSales > 0;
  const hasStaking = data.keyOperations.totalStaking > 0;
  const topActiveAssets = data.topAssets.filter(a => a.eventsCount > 0 || a.stakingCount > 0).slice(0, 3);

  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <section style={{ marginBottom: 28 }}>
        <p style={{ color: "#0F766E", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>
          SII · {new Date().getFullYear()}
        </p>
        <h1 style={{ color: "#0F2A3D", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>
          Mi Situación
        </h1>
        <p style={{ color: "#64748B", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
          Resumen de tu posición tributaria y qué debes hacer.
        </p>
      </section>

      {/* Tarjeta principal */}
      <section
        style={{
          background: cfg.bg,
          border: `2px solid ${cfg.border}`,
          borderRadius: 14,
          padding: "28px",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ color: cfg.iconColor, fontSize: 22 }}>{cfg.icon}</span>
          <h2 style={{ color: cfg.titleColor, fontSize: "1.35rem", fontWeight: 850, margin: 0 }}>
            {cfg.subtitle}
          </h2>
        </div>

        <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.55, margin: "0 0 20px", maxWidth: 640 }}>
          {data.decision.status === "EMPTY"
            ? "Aún no tienes movimientos registrados. Importa tus operaciones para calcular tu situación tributaria."
            : data.decision.detail}
        </p>

        {data.totals.impuestoEstimadoClp > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                color: "#64748B",
                fontSize: 11,
                fontWeight: 850,
                letterSpacing: "0.04em",
                margin: "0 0 4px",
                textTransform: "uppercase",
              }}
            >
              Impuesto estimado
            </p>
            <p style={{ color: "#0F2A3D", fontSize: "2.2rem", fontWeight: 850, lineHeight: 1.1, margin: 0 }}>
              {clp(data.totals.impuestoEstimadoClp)}
            </p>
          </div>
        )}

        {/* Motivo */}
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              color: "#334155",
              fontSize: 12,
              fontWeight: 850,
              letterSpacing: "0.06em",
              margin: "0 0 10px",
              textTransform: "uppercase",
            }}
          >
            Motivo
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {hasSales && (
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#0F2A3D" }}>
                <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span>
                <span><strong>Ventas</strong> con ganancia detectadas</span>
              </li>
            )}
            {hasStaking && (
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#0F2A3D" }}>
                <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span>
                <span><strong>Staking</strong> recibido como ingreso</span>
              </li>
            )}
            {data.decision.status === "EMPTY" && (
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#854D0E" }}>
                <span style={{ fontWeight: 700 }}>•</span>
                <span><strong>Información insuficiente</strong> para calcular</span>
              </li>
            )}
            {!hasSales && !hasStaking && data.decision.status !== "EMPTY" && (
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#475569" }}>
                <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span>
                <span>No detectamos ventas ni ingresos tributables con los datos actuales.</span>
              </li>
            )}
            {topActiveAssets.map(asset => (
              <li key={asset.symbol} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#0F2A3D" }}>
                <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span>
                <span>
                  <strong>{asset.symbol}</strong>
                  {asset.eventsCount > 0 && ` · ${asset.eventsCount} operaciones`}
                  {asset.stakingCount > 0 && ` · ${asset.stakingCount} staking`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Próximo paso */}
        {data.decision.status === "EMPTY" ? (
          <Link
            href="/importaciones"
            style={{
              background: "#0F766E",
              borderRadius: 8,
              color: "#FFFFFF",
              display: "inline-flex",
              fontSize: 14,
              fontWeight: 850,
              padding: "12px 22px",
              textDecoration: "none",
            }}
          >
            Cargar movimientos →
          </Link>
        ) : (
          <Link
            href="/experto"
            style={{
              background: cfg.tone === "alert" ? "#DC2626" : cfg.tone === "warn" ? "#B45309" : "#16A34A",
              borderRadius: 8,
              color: "#FFFFFF",
              display: "inline-flex",
              fontSize: 14,
              fontWeight: 850,
              padding: "12px 22px",
              textDecoration: "none",
            }}
          >
            Revisar detalle técnico →
          </Link>
        )}
      </section>

      {/* Nota de confianza */}
      {data.decision.status !== "EMPTY" && (
        <p style={{ color: "#64748B", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
          Cálculo basado en {data.totals.eventsCount} eventos. Nivel de confianza: {data.totals.confidenceLevel}%.
        </p>
      )}
    </div>
  );
}
