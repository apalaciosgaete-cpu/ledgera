"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { clp } from "@/shared/formatting";
import { useAuth } from "@/modules/identity/client/authContext";
import { useFeatureAccess } from "@/modules/subscription/client/useFeatureAccess";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { Feature, getPlanLabel, normalizePlan, Plan, requiredPlanForFeature } from "@/modules/subscription/domain/planFeatures";

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
        iconColor: "var(--accent)",
        border: "var(--accent)",
        bg: "var(--accent-soft)",
        titleColor: "var(--accent)",
        subtitle: "Sin acción requerida",
      };
    case "EMPTY":
      return {
        tone: "warn" as const,
        icon: "◌",
        iconColor: "var(--warn)",
        border: "var(--warn)",
        bg: "rgba(232,184,75,0.14)",
        titleColor: "var(--text)",
        subtitle: "Revisión recomendada",
      };
    case "LOSS_REVIEW":
      return {
        tone: "warn" as const,
        icon: "⚠",
        iconColor: "var(--warn)",
        border: "var(--warn)",
        bg: "rgba(232,184,75,0.14)",
        titleColor: "var(--text)",
        subtitle: "Revisión recomendada",
      };
    case "DECLARE_REVIEW":
    case "PAY_REVIEW":
      return {
        tone: "alert" as const,
        icon: "⚠",
        iconColor: "var(--loss)",
        border: "rgba(196,99,74,0.14)",
        bg: "rgba(196,99,74,0.14)",
        titleColor: "var(--loss)",
        subtitle: "Declaración requerida",
      };
  }
}

function planLabelForFeature(feature: Feature): string {
  return getPlanLabel(requiredPlanForFeature(feature));
}

const UNLOCKABLES = [
  { key: "pdf", label: "Reporte tributario PDF", plan: planLabelForFeature(Feature.PDF_EXPORT), feature: Feature.PDF_EXPORT },
  { key: "csv", label: "Exportación CSV", plan: planLabelForFeature(Feature.CSV_EXPORT), feature: Feature.CSV_EXPORT },
  { key: "declaraciones", label: "Declaraciones", plan: planLabelForFeature(Feature.DECLARATIONS), feature: Feature.DECLARATIONS },
  { key: "verificaciones", label: "Verificaciones", plan: planLabelForFeature(Feature.VERIFICATIONS), feature: Feature.VERIFICATIONS },
];

const COMPARISON_ROWS = [
  { feature: "Estado SII", free: true, personal: true, pro: true },
  { feature: "Patrimonio", free: true, personal: true, pro: true },
  { feature: "Activos", free: true, personal: true, pro: true },
  { feature: "Impuesto estimado", free: false, personal: true, pro: true },
  { feature: "PDF tributario", free: false, personal: true, pro: true },
  { feature: "Declaraciones", free: false, personal: true, pro: true },
  { feature: "Auditoría", free: false, personal: false, pro: true },
  { feature: "Verificaciones", free: false, personal: false, pro: true },
  { feature: "Cadena de custodia", free: false, personal: false, pro: true },
];

export default function MiSituacionPage() {
  const { user, subscriptionState } = useAuth();
  const { requestFeature, blockedFeature, closeUpgrade } = useFeatureAccess();
  const loggedRef = useRef(false);
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentPlan = normalizePlan(subscriptionState?.plan);
  const isFreePlan = currentPlan === Plan.FREE;

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

  // Evento comercial: plan_upgrade_prompt_viewed
  useEffect(() => {
    if (!data || !isFreePlan || data.decision.status === "EMPTY") return;
    if (loggedRef.current) return;

    loggedRef.current = true;

    console.info("[commercial]", {
      event: "plan_upgrade_prompt_viewed",
      userId: user?.id,
      source: "mi_situacion",
      plan: currentPlan.toLowerCase(),
      detectedAssets: data.topAssets.map((a) => a.symbol),
      detectedEvents: data.totals.eventsCount,
    });
  }, [data, isFreePlan, user?.id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, width: "100%" }}>
        <p style={{ color: "var(--text-soft)", fontSize: 14, fontWeight: 750 }}>Cargando tu situación…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, width: "100%" }}>
        <div style={{ background: "rgba(196,99,74,0.14)", border: "1px solid rgba(196,99,74,0.14)", borderRadius: 8, color: "var(--loss)", fontWeight: 750, padding: 16 }}>
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 800, width: "100%" }}>
        <p style={{ color: "var(--text-soft)", fontSize: 14 }}>No hay datos para mostrar.</p>
      </div>
    );
  }

  const cfg = situacionConfig(data.decision.status);
  const hasSales = data.keyOperations.totalSales > 0;
  const hasStaking = data.keyOperations.totalStaking > 0;
  const topActiveAssets = data.topAssets.filter(a => a.eventsCount > 0 || a.stakingCount > 0).slice(0, 3);
  const hasData = data.decision.status !== "EMPTY";
  const totalMovements = Object.values(data.keyOperations).reduce((sum, n) => sum + n, 0);
  const detectedAssets = data.topAssets.map((a) => a.symbol);

  return (
    <div style={{ maxWidth: 800, width: "100%" }}>
      <section style={{ marginBottom: 28 }}>
        <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 850, letterSpacing: "0.06em", margin: "0 0 7px", textTransform: "uppercase" }}>
          SII · {new Date().getFullYear()}
        </p>
        <h1 style={{ color: "var(--text)", fontSize: "1.85rem", fontWeight: 850, lineHeight: 1.12, margin: "0 0 8px" }}>
          Mi Situación
        </h1>
        <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 }}>
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

        <p style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.55, margin: "0 0 20px", maxWidth: 640 }}>
          {data.decision.status === "EMPTY"
            ? "Aún no tienes movimientos registrados. Importa tus operaciones para calcular tu situación tributaria."
            : data.decision.detail}
        </p>

        <FeatureGate feature={Feature.TAX_ESTIMATE} source="mi_situacion_tax_estimate">
          {data.totals.impuestoEstimadoClp > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p
                style={{
                  color: "var(--text-soft)",
                  fontSize: 11,
                  fontWeight: 850,
                  letterSpacing: "0.04em",
                  margin: "0 0 4px",
                  textTransform: "uppercase",
                }}
              >
                Impuesto estimado
              </p>
              <p style={{ color: "var(--text)", fontSize: "2.2rem", fontWeight: 850, lineHeight: 1.1, margin: 0 }}>
                {clp(data.totals.impuestoEstimadoClp)}
              </p>
            </div>
          )}
        </FeatureGate>

        {/* Motivo */}
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              color: "var(--text)",
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
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text)" }}>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span>
                <span><strong>Ventas</strong> con ganancia detectadas</span>
              </li>
            )}
            {hasStaking && (
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text)" }}>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span>
                <span><strong>Staking</strong> recibido como ingreso</span>
              </li>
            )}
            {data.decision.status === "EMPTY" && (
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text)" }}>
                <span style={{ fontWeight: 700 }}>•</span>
                <span><strong>Información insuficiente</strong> para calcular</span>
              </li>
            )}
            {!hasSales && !hasStaking && data.decision.status !== "EMPTY" && (
              <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text)" }}>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span>
                <span>No detectamos ventas ni ingresos tributables con los datos actuales.</span>
              </li>
            )}
            {topActiveAssets.map(asset => (
              <li key={asset.symbol} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text)" }}>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span>
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
              background: "var(--accent)",
              borderRadius: 8,
              color: "var(--text)",
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
              background: cfg.tone === "alert" ? "#C4634A" : cfg.tone === "warn" ? "#E8B84B" : "#3FA687",
              borderRadius: 8,
              color: "var(--text)",
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

      {/* Bloque 1 — Card de Valor */}
      {hasData && (
        <section style={{ ...sectionCardStyle, marginBottom: 24 }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 16 }}>Análisis completado</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
            <ValueMetric label="Activos detectados" value={detectedAssets.slice(0, 3).join(", ") || "—"} />
            <ValueMetric label="Movimientos procesados" value={String(totalMovements)} />
            <ValueMetric label="Eventos tributarios" value={String(data.totals.eventsCount)} />
            <ValueMetric label="Año analizado" value={String(new Date().getFullYear())} />
          </div>
        </section>
      )}

      {/* Bloque 2 — Desbloqueables + Bloque 6 — Paywall suave */}
      {hasData && isFreePlan && (
        <section style={{ ...sectionCardStyle, marginBottom: 24 }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 16 }}>Desbloquea tu reporte completo</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
            {UNLOCKABLES.map((item) => (
              <button
                key={item.key}
                onClick={() => requestFeature(item.feature, item.label)}
                style={{
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 16,
                  opacity: 0.85,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span>🔒</span>
                  <span style={{ color: "var(--text)", fontSize: 14, fontWeight: 800 }}>{item.label}</span>
                </div>
                <span style={{ color: "var(--text-soft)", fontSize: 12, fontWeight: 700 }}>
                  Disponible en {item.plan}
                </span>
              </button>
            ))}
          </div>

          {/* Bloque 3 — CTA principal */}
          <button
            onClick={() => requestFeature(Feature.PDF_EXPORT, "Reporte completo")}
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: 10,
              color: "var(--text)",
              cursor: "pointer",
              display: "block",
              fontSize: 15,
              fontWeight: 850,
              padding: "14px 24px",
              textAlign: "center",
              textDecoration: "none",
              marginBottom: 12,
              width: "100%",
            }}
          >
            Desbloquear reporte completo
          </button>
          <p style={{ color: "var(--text-soft)", fontSize: 12, margin: 0, textAlign: "center" }}>
            Sigue viendo tu situación SII gratis. Solo los reportes y exportaciones avanzadas son de pago.
          </p>
        </section>
      )}

      {/* Bloque 4 — CTA Experto */}
      {hasData && (
        <section style={{ ...sectionCardStyle, marginBottom: 24 }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 8 }}>¿Quieres revisar el detalle técnico?</h3>
          <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.5, margin: "0 0 16px" }}>
            Revisa operaciones, eventos tributarios y tu posición por activo en modo experto.
          </p>
          <button
            onClick={() => {
              const allowed = requestFeature(Feature.EXPERT_MODE, "Modo experto");
              if (allowed) {
                window.location.href = "/experto";
              }
            }}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--text)",
              cursor: "pointer",
              display: "inline-flex",
              fontSize: 14,
              fontWeight: 850,
              padding: "12px 22px",
              textDecoration: "none",
            }}
          >
            Abrir modo experto →
          </button>
        </section>
      )}

      {/* Bloque 5 — Comparador de valor */}
      {hasData && isFreePlan && (
        <section style={{ ...sectionCardStyle, marginBottom: 24 }}>
          <h3 style={{ ...sectionTitleStyle, marginBottom: 16 }}>Compara planes</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid var(--border)" }}>Característica</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", borderBottom: "1px solid var(--border)" }}>Gratis</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", borderBottom: "1px solid var(--border)" }}>Personal</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", borderBottom: "1px solid var(--border)" }}>Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td style={{ padding: "10px 8px", borderBottom: "1px solid var(--border)" }}>{row.feature}</td>
                    <td style={{ textAlign: "center", padding: "10px 8px", borderBottom: "1px solid var(--border)", color: row.free ? "var(--accent)" : "var(--text-soft)" }}>
                      {row.free ? "✓" : "—"}
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 8px", borderBottom: "1px solid var(--border)", color: row.personal ? "var(--accent)" : "var(--text-soft)" }}>
                      {row.personal ? "✓" : "—"}
                    </td>
                    <td style={{ textAlign: "center", padding: "10px 8px", borderBottom: "1px solid var(--border)", color: row.pro ? "var(--accent)" : "var(--text-soft)" }}>
                      {row.pro ? "✓" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Nota de confianza */}
      {data.decision.status !== "EMPTY" && (
        <p style={{ color: "var(--text-soft)", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
          Cálculo basado en {data.totals.eventsCount} eventos. Nivel de confianza: {data.totals.confidenceLevel}%.
        </p>
      )}

      {blockedFeature && (
        <UpgradeModal
          feature={blockedFeature.feature}
          featureLabel={blockedFeature.label}
          onClose={closeUpgrade}
        />
      )}
    </div>
  );
}

function ValueMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
      <p style={{ color: "var(--text-soft)", fontSize: 11, fontWeight: 850, letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 6px" }}>
        {label}
      </p>
      <p style={{ color: "var(--text)", fontSize: 15, fontWeight: 800, margin: 0, wordBreak: "break-word" }}>
        {value}
      </p>
    </div>
  );
}

const sectionCardStyle: React.CSSProperties = {
  background: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "24px",
};

const sectionTitleStyle: React.CSSProperties = {
  color: "var(--text)",
  fontSize: "1.1rem",
  fontWeight: 850,
  margin: 0,
};
