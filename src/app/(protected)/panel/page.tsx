"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/modules/identity/client/authContext";

// ─── Types ──────────────────────────────────────────────────────────────────

type TaxHealthStatus = "OK" | "REVIEW" | "RISK";
type AlertLevel = "danger" | "warning" | "info";

interface HealthData {
  status: TaxHealthStatus;
  score?: number;
  summary: {
    totalMovements: number;
    totalSellMovements: number;
    totalTaxEvents: number;
    sellWithoutEvent: number;
    unclassifiedEvents?: number;
  };
  details: {
    sellWithoutEventIds: string[];
  };
}

interface IntegrityData {
  summary: {
    totalMovements: number;
    totalSellMovements: number;
    totalTaxEvents: number;
    sellWithoutEvent: number;
    orphanEvents: number;
  };
  details: {
    sellWithoutEventIds: string[];
    orphanEventIds: string[];
  };
}

interface PanelData {
  health: HealthData;
  integrity: IntegrityData;
  twoFactorEnabled: boolean;
}

interface PanelAlert {
  level: AlertLevel;
  message: string;
  action: string;
  href: string;
}

interface StatusConfigItem {
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  pulse: boolean;
}

interface AlertStyleItem {
  bg: string;
  border: string;
  dot: string;
  actionColor: string;
}

interface MetricCardProps {
  label: string;
  value: number;
  note: string;
  highlight?: boolean;
}

// ─── Status Config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TaxHealthStatus, StatusConfigItem> = {
  OK: {
    label: "OK",
    sublabel: "Todas las ventas tienen cobertura tributaria.",
    color: "#16A34A",
    bgColor: "rgba(22, 163, 74, 0.07)",
    borderColor: "rgba(22, 163, 74, 0.22)",
    pulse: false,
  },
  REVIEW: {
    label: "REVISAR",
    sublabel: "Hay eventos que requieren revisión antes de cerrar reportes.",
    color: "#D97706",
    bgColor: "rgba(245, 158, 11, 0.07)",
    borderColor: "rgba(245, 158, 11, 0.22)",
    pulse: false,
  },
  RISK: {
    label: "RIESGO",
    sublabel: "Múltiples ventas sin cobertura. Acción requerida.",
    color: "#DC2626",
    bgColor: "rgba(220, 38, 38, 0.07)",
    borderColor: "rgba(220, 38, 38, 0.22)",
    pulse: true,
  },
};

// ─── Alert Styles ─────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<AlertLevel, AlertStyleItem> = {
  danger: {
    bg: "rgba(220, 38, 38, 0.06)",
    border: "rgba(220, 38, 38, 0.18)",
    dot: "#DC2626",
    actionColor: "#DC2626",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.06)",
    border: "rgba(245, 158, 11, 0.18)",
    dot: "#D97706",
    actionColor: "#D97706",
  },
  info: {
    bg: "rgba(22, 163, 74, 0.06)",
    border: "rgba(22, 163, 74, 0.18)",
    dot: "#16A34A",
    actionColor: "#16A34A",
  },
};

// ─── Alert Builder ────────────────────────────────────────────────────────────

function buildAlerts(health: HealthData, integrity: IntegrityData): PanelAlert[] {
  const alerts: PanelAlert[] = [];

  if (health.summary.sellWithoutEvent > 5) {
    alerts.push({
      level: "danger",
      message: `${health.summary.sellWithoutEvent} ventas sin evento tributario registrado`,
      action: "Ir a Tributario → Revisión",
      href: "/tributario",
    });
  } else if (health.summary.sellWithoutEvent > 0) {
    const n = health.summary.sellWithoutEvent;
    alerts.push({
      level: "warning",
      message: `${n} venta${n > 1 ? "s" : ""} sin evento tributario`,
      action: "Ir a Tributario → Revisión",
      href: "/tributario",
    });
  }

  if (integrity.summary.orphanEvents > 0) {
    const n = integrity.summary.orphanEvents;
    alerts.push({
      level: "warning",
      message: `${n} evento${n > 1 ? "s" : ""} huérfano${n > 1 ? "s" : ""} sin movimiento asociado`,
      action: "Ver en Auditoría",
      href: "/auditoria",
    });
  }

  const unclassified = health.summary.unclassifiedEvents ?? 0;
  if (unclassified > 0) {
    alerts.push({
      level: "warning",
      message: `${unclassified} evento${unclassified > 1 ? "s" : ""} sin categoría tributaria asignada`,
      action: "Clasificar en Tributario",
      href: "/tributario",
    });
  }

  if (alerts.length === 0 && health.status === "RISK") {
    alerts.push({
      level: "danger",
      message: "Riesgo tributario detectado. Revisa los eventos y clasificaciones pendientes.",
      action: "Ir a Tributario",
      href: "/tributario",
    });
  } else if (alerts.length === 0 && health.status === "REVIEW") {
    alerts.push({
      level: "warning",
      message: "Hay eventos que requieren revisión antes de cerrar reportes tributarios.",
      action: "Ir a Tributario",
      href: "/tributario",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      level: "info",
      message: "Sin alertas activas. Tu portafolio tributario está al día.",
      action: "Ver portafolio",
      href: "/portafolio",
    });
  }

  return alerts;
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, note, highlight = false }: MetricCardProps) {
  return (
    <div
      style={{
        background: highlight ? "rgba(245, 158, 11, 0.06)" : "#F1F5F9",
        borderRadius: "10px",
        padding: "1rem",
        border: highlight ? "1px solid rgba(245, 158, 11, 0.2)" : "1px solid transparent",
      }}
    >
      <p style={{ fontSize: "0.6875rem", color: "#64748B", margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "1.875rem", fontWeight: 700, color: highlight ? "#D97706" : "#0F2A3D", margin: "0 0 4px", lineHeight: 1 }}>
        {value.toLocaleString("es-CL")}
      </p>
      <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: 0 }}>{note}</p>
    </div>
  );
}

// ─── Banner 2FA ───────────────────────────────────────────────────────────────

function Banner2FA({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      style={{
        background:   "rgba(245,158,11,0.07)",
        border:       "1px solid rgba(245,158,11,0.25)",
        borderRadius: "12px",
        padding:      "1rem 1.25rem",
        marginBottom: "1.25rem",
        display:      "flex",
        alignItems:   "center",
        gap:          "0.875rem",
        flexWrap:     "wrap",
      }}
    >
      {/* Ícono escudo */}
      <div style={{ width: 36, height: 36, borderRadius: "8px", background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: "200px" }}>
        <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 700, color: "#92400E" }}>
          Tu cuenta no tiene 2FA activo
        </p>
        <p style={{ margin: 0, fontSize: "12px", color: "#78716C" }}>
          Protege tu información tributaria activando la verificación en dos pasos.
        </p>
      </div>

      {/* Acción */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <Link
          href="/configuracion"
          style={{
            padding:      "8px 16px",
            borderRadius: "7px",
            background:   "#D97706",
            color:        "#ffffff",
            fontSize:     "12px",
            fontWeight:   700,
            textDecoration: "none",
            whiteSpace:   "nowrap",
          }}
        >
          Activar 2FA →
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background:   "transparent",
            border:       "none",
            cursor:       "pointer",
            color:        "#A8A29E",
            fontSize:     "18px",
            lineHeight:   1,
            padding:      "4px",
          }}
          title="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

// ─── Subscription Card ───────────────────────────────────────────────────────

const PLAN_LABELS_PANEL: Record<string, string> = {
  BASICO:      "Gratuito",
  PERSONAL:    "Personal",
  PROFESIONAL: "Contador",
  EMPRESA:     "Empresa",
};

const PLAN_COLORS_PANEL: Record<string, string> = {
  BASICO:      "#64748B",
  PERSONAL:    "#10B981",
  PROFESIONAL: "#7C3AED",
  EMPRESA:     "#0EA5E9",
};

const PLAN_PRICES_PANEL: Record<string, { mensual: number; anual: number }> = {
  PERSONAL:    { mensual: 4990,  anual: 49900  },
  PROFESIONAL: { mensual: 14990, anual: 149900 },
  EMPRESA:     { mensual: 29990, anual: 299900 },
};

interface StripeSub {
  status:            string;
  currentPeriodEnd:  string;
  cancelAtPeriodEnd: boolean;
  card:              { brand: string; last4: string; expMonth: number; expYear: number } | null;
}

function SubscriptionCard({ plan, stripeSub, onUpgrade, onPortal, upgrading }: {
  plan:       string;
  stripeSub:  StripeSub | null;
  onUpgrade:  (p: "PERSONAL" | "PROFESIONAL" | "EMPRESA", billing: "mensual" | "anual") => void;
  onPortal:   () => void;
  upgrading:  boolean;
}) {
  const [billing, setBilling] = useState<"mensual" | "anual">("mensual");
  const color   = PLAN_COLORS_PANEL[plan] ?? "#64748B";
  const daysLeft = stripeSub
    ? Math.max(0, Math.ceil((new Date(stripeSub.currentPeriodEnd).getTime() - Date.now()) / 86400000))
    : null;

  const upgradePlans = (["PERSONAL", "PROFESIONAL", "EMPRESA"] as const).filter(p => p !== plan);

  return (
    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
      {/* Fila superior: plan actual + estado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: stripeSub ? 0 : "0.875rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: "6px", padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {PLAN_LABELS_PANEL[plan] ?? plan}
          </span>
          {stripeSub && (
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              {stripeSub.cancelAtPeriodEnd ? `Cancela en ${daysLeft} días` : `Renueva en ${daysLeft} días`}
            </span>
          )}
          {stripeSub?.card && (
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>
              {stripeSub.card.brand.toUpperCase()} ···{stripeSub.card.last4}
            </span>
          )}
        </div>
        {stripeSub && (
          <button type="button" onClick={onPortal} disabled={upgrading}
            style={{ padding: "7px 14px", borderRadius: "7px", border: "1px solid #E2E8F0", background: "#fff", color: "#475569", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            Gestionar suscripción →
          </button>
        )}
      </div>

      {/* Planes de upgrade (solo si no tiene suscripción activa) */}
      {!stripeSub && plan === "BASICO" && (
        <>
          {/* Toggle mensual / anual */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "12px", color: "#64748B" }}>Facturación:</span>
            {(["mensual", "anual"] as const).map(b => (
              <button key={b} type="button" onClick={() => setBilling(b)}
                style={{ padding: "4px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", background: billing === b ? "#0F2A3D" : "#fff", color: billing === b ? "#fff" : "#64748B", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                {b === "mensual" ? "Mensual" : "Anual  −17%"}
              </button>
            ))}
          </div>

          {/* Cards de planes */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {upgradePlans.map(p => {
              const c      = PLAN_COLORS_PANEL[p];
              const prices = PLAN_PRICES_PANEL[p];
              const price  = billing === "mensual" ? prices.mensual : Math.round(prices.anual / 12);
              return (
                <div key={p} style={{ border: `1px solid ${c}30`, borderRadius: "10px", padding: "0.875rem", background: `${c}06` }}>
                  <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: "0.06em" }}>{PLAN_LABELS_PANEL[p]}</p>
                  <p style={{ margin: "0 0 10px", fontSize: "18px", fontWeight: 700, color: "#0F2A3D", lineHeight: 1 }}>
                    ${price.toLocaleString("es-CL")}
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "#94A3B8" }}>/mes</span>
                  </p>
                  <button type="button" onClick={() => onUpgrade(p, billing)} disabled={upgrading}
                    style={{ width: "100%", padding: "7px 0", borderRadius: "7px", border: "none", background: c, color: "#fff", fontSize: "12px", fontWeight: 700, cursor: upgrading ? "not-allowed" : "pointer", opacity: upgrading ? 0.7 : 1 }}>
                    {upgrading ? "Redirigiendo..." : "Contratar →"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function PanelPage() {
  const searchParams   = useSearchParams();
  const { user }       = useAuth();
  const plan           = (user as { subscriptionPlan?: string })?.subscriptionPlan ?? "BASICO";

  const [data,           setData]           = useState<PanelData | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [show2FABanner,  setShow2FABanner]  = useState(false);
  const [stripeSub,      setStripeSub]      = useState<StripeSub | null>(null);
  const [upgrading,      setUpgrading]      = useState(false);
  const [checkoutOk,     setCheckoutOk]     = useState(false);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") setCheckoutOk(true);
  }, [searchParams]);

  const fetchStripeSub = useCallback(async () => {
    try {
      const res  = await fetch("/api/stripe/subscription");
      const json = await res.json();
      if (json.ok && json.data) setStripeSub(json.data);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { void fetchStripeSub(); }, [fetchStripeSub]);

  async function handleUpgrade(targetPlan: "PERSONAL" | "PROFESIONAL" | "EMPRESA", billing: "mensual" | "anual") {
    setUpgrading(true);
    try {
      const res  = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: targetPlan, billing }) });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch { setUpgrading(false); }
  }

  async function handlePortal() {
    setUpgrading(true);
    try {
      const res  = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch { setUpgrading(false); }
  }

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [healthRes, integrityRes, twoFARes] = await Promise.all([
          fetch("/api/tax/health"),
          fetch("/api/tax/events/integrity"),
          fetch("/api/2fa/status"),
        ]);

        if (!healthRes.ok || !integrityRes.ok) {
          throw new Error("Error al conectar con el motor tributario");
        }

        const healthJson    = await healthRes.json();
        const integrityJson = await integrityRes.json();
        const twoFAJson     = await twoFARes.json().catch(() => ({ enabled: true }));

        if (!healthJson.ok || !integrityJson.ok) {
          throw new Error(healthJson.message ?? integrityJson.message ?? "Respuesta inválida");
        }

        setData({
          health:           healthJson.data,
          integrity:        integrityJson.data,
          twoFactorEnabled: twoFAJson.enabled ?? true,
        });

        // Mostrar banner solo si 2FA no está activo
        if (!twoFAJson.enabled) setShow2FABanner(true);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <>
        <style>{`@keyframes ledgera-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1rem" }}>
          <div style={{ width: 28, height: 28, border: "2px solid rgba(15, 42, 61, 0.12)", borderTopColor: "#0F2A3D", borderRadius: "50%", animation: "ledgera-spin 0.75s linear infinite" }} />
          <p style={{ color: "#94A3B8", fontFamily: "var(--font-body)", fontSize: "0.875rem", margin: 0 }}>
            Cargando estado tributario...
          </p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: "12px", padding: "1.25rem 1.5rem", fontFamily: "var(--font-body)" }}>
          <p style={{ color: "#DC2626", fontWeight: 600, margin: "0 0 4px", fontSize: "0.9375rem" }}>Error al cargar el Panel</p>
          <p style={{ color: "#64748B", margin: 0, fontSize: "0.875rem" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { health, integrity } = data;
  const cfg    = STATUS_CONFIG[health.status];
  const alerts = buildAlerts(health, integrity);

  const coverageRate =
    health.summary.totalSellMovements > 0
      ? Math.round(
          ((health.summary.totalSellMovements - health.summary.sellWithoutEvent) /
            health.summary.totalSellMovements) * 100
        )
      : 100;

  return (
    <>
      {cfg.pulse && (
        <style>{`
          @keyframes ledgera-pulse {
            0%   { transform: scale(1); opacity: 0.45; }
            100% { transform: scale(2.2); opacity: 0; }
          }
        `}</style>
      )}

      <div style={{ padding: "2rem", maxWidth: "960px", margin: "0 auto", fontFamily: "var(--font-body)" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>
            Panel
          </h1>
          <p style={{ color: "#94A3B8", margin: 0, fontSize: "0.875rem" }}>
            Estado consolidado de tu situación tributaria
          </p>
        </div>

        {/* ── Checkout success ── */}
        {checkoutOk && (
          <div style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.22)", borderRadius: "12px", padding: "0.875rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#15803D" }}>¡Suscripción activada! Bienvenido al plan {PLAN_LABELS_PANEL[plan]}.</span>
            <button type="button" onClick={() => setCheckoutOk(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: "16px", lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* ── Banner 2FA ── */}
        {show2FABanner && (
          <Banner2FA onDismiss={() => setShow2FABanner(false)} />
        )}

        {/* Semáforo Hero */}
        <div
          style={{
            background:   cfg.bgColor,
            border:       `1px solid ${cfg.borderColor}`,
            borderRadius: "12px",
            padding:      "1rem 1.25rem",
            marginBottom: "1.25rem",
            display:      "flex",
            alignItems:   "center",
            gap:          "1rem",
          }}
        >
          <div style={{ position: "relative", flexShrink: 0, width: 32, height: 32 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: cfg.color }} />
            {cfg.pulse && (
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: cfg.color, animation: "ledgera-pulse 1.6s ease-out infinite" }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 700, color: cfg.color }}>
                {cfg.label}
              </span>
              <span style={{ fontSize: "0.8125rem", color: "#94A3B8" }}>Estado tributario</span>
            </div>
            <p style={{ color: "#475569", margin: 0, fontSize: "0.875rem" }}>{cfg.sublabel}</p>
          </div>

          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.55)", borderRadius: "8px", padding: "0.5rem 1rem", flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: cfg.color, lineHeight: 1 }}>
              {coverageRate}%
            </div>
            <div style={{ fontSize: "0.625rem", color: "#94A3B8", marginTop: "3px", fontWeight: 500 }}>COBERTURA</div>
          </div>
        </div>

        {/* Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginBottom: "1.25rem" }}>
          <MetricCard label="Movimientos"    value={health.summary.totalMovements}     note="total portafolio" />
          <MetricCard label="Ventas"         value={health.summary.totalSellMovements} note="operaciones SELL" />
          <MetricCard label="Eventos"        value={health.summary.totalTaxEvents}     note="generados por motor" />
          <MetricCard label="Sin cobertura"  value={health.summary.sellWithoutEvent}   note="ventas pendientes"    highlight={health.summary.sellWithoutEvent > 0} />
          <MetricCard label="Huérfanos"      value={integrity.summary.orphanEvents}    note="sin movimiento padre" highlight={integrity.summary.orphanEvents > 0} />
        </div>

        {/* Alertas */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 0.625rem" }}>
            Alertas accionables
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {alerts.map((alert, i) => {
              const s = ALERT_STYLES[alert.level];
              return (
                <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "10px", padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                  <p style={{ flex: 1, margin: 0, fontSize: "0.875rem", color: "#1E293B", minWidth: 0 }}>{alert.message}</p>
                  <Link href={alert.href} style={{ fontSize: "0.8125rem", fontWeight: 600, color: s.actionColor, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {alert.action} →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}