"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/modules/identity/client/authContext";
import { httpClient } from "@/shared/http/httpClient";

const PLAN_LABELS: Record<string, string> = {
  BASICO:      "Gratuito",
  PERSONAL:    "Personal",
  PROFESIONAL: "Contador",
  EMPRESA:     "Empresa",
};

const PLAN_COLORS: Record<string, string> = {
  BASICO:      "#64748B",
  PERSONAL:    "#10B981",
  PROFESIONAL: "#7C3AED",
  EMPRESA:     "#0EA5E9",
};

const UPGRADE_PLANS = [
  { key: "PERSONAL",    label: "Personal",  mensual: 4990,  anual: 49900,  color: "#10B981", features: ["Movimientos ilimitados", "Motor FIFO automático", "Exportación CSV y PDF", "Auditoría completa", "Soporte por email"] },
  { key: "PROFESIONAL", label: "Contador",  mensual: 14990, anual: 149900, color: "#7C3AED", features: ["Todo lo de Personal", "Hasta 5 clientes incluidos", "Reportes verificables SII", "Soporte prioritario"] },
  { key: "EMPRESA",     label: "Empresa",   mensual: 29990, anual: 299900, color: "#0EA5E9", features: ["Todo lo de Contador", "Clientes ilimitados", "Régimen primera categoría", "Soporte dedicado"] },
] as const;

interface StripeSub {
  status:            string;
  currentPeriodEnd:  string;
  cancelAtPeriodEnd: boolean;
  card:              { brand: string; last4: string; expMonth: number; expYear: number } | null;
}

interface StripeInvoice {
  id:          string;
  created:     number;
  amount_paid: number;
  currency:    string;
  status:      string;
  hosted_invoice_url: string | null;
  description: string | null;
  period_start: number;
  period_end:   number;
}

function PlanesContent() {
  const { user }       = useAuth();
  const searchParams   = useSearchParams();
  const plan           = (user as { subscriptionPlan?: string })?.subscriptionPlan ?? "BASICO";
  const planColor      = PLAN_COLORS[plan] ?? "#64748B";
  const planLabel      = PLAN_LABELS[plan] ?? plan;
  const autoCheckout   = searchParams.get("autoCheckout");
  const autoBilling    = (searchParams.get("billing") ?? "mensual") as "mensual" | "anual";

  const [billing,   setBilling]   = useState<"mensual" | "anual">(autoBilling);
  const [stripeSub, setStripeSub] = useState<StripeSub | null>(null);
  const [invoices,  setInvoices]  = useState<StripeInvoice[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (!autoCheckout) return;
    async function doCheckout() {
      setUpgrading(autoCheckout!);
      try {
        const json = await httpClient<{ url?: string }>("/api/stripe/checkout", {
          method: "POST",
          body:   { plan: autoCheckout, billing: autoBilling },
          auth:   true,
        });
        if (json.url) window.location.href = json.url;
      } finally { setUpgrading(null); }
    }
    void doCheckout();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [subRes, invRes] = await Promise.all([
          fetch("/api/stripe/subscription"),
          fetch("/api/stripe/invoices"),
        ]);
        const subJson = await subRes.json() as { ok: boolean; data: StripeSub | null };
        const invJson = await invRes.json() as { ok: boolean; data: StripeInvoice[] };
        if (subJson.ok && subJson.data) setStripeSub(subJson.data);
        if (invJson.ok) setInvoices(invJson.data ?? []);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleUpgrade(targetPlan: string) {
    setUpgrading(targetPlan);
    try {
      const json = await httpClient<{ url?: string }>("/api/stripe/checkout", {
        method: "POST",
        body:   { plan: targetPlan, billing },
        auth:   true,
      });
      if (json.url) window.location.href = json.url;
    } finally {
      setUpgrading(null);
    }
  }

  async function handlePortal() {
    setUpgrading("portal");
    try {
      const json = await httpClient<{ url?: string }>("/api/stripe/portal", {
        method: "POST",
        auth:   true,
      });
      if (json.url) window.location.href = json.url;
    } finally {
      setUpgrading(null);
    }
  }

  const daysLeft = stripeSub
    ? Math.max(0, Math.ceil((new Date(stripeSub.currentPeriodEnd).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", fontFamily: "var(--font-body)" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.375rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 4px" }}>
          Planes y suscripción
        </h1>
        <p style={{ color: "#94A3B8", margin: 0, fontSize: "0.875rem" }}>
          Gestiona tu plan, facturación e historial de pagos
        </p>
      </div>

      {/* Plan actual */}
      <div style={{ background: "#F8FAFC", border: `1px solid ${planColor}30`, borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>Plan actual</p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: planColor, background: `${planColor}18`, border: `1px solid ${planColor}30`, borderRadius: "6px", padding: "4px 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {planLabel}
              </span>
              {stripeSub && (
                <span style={{ fontSize: "13px", color: "#64748B" }}>
                  {stripeSub.cancelAtPeriodEnd ? `Cancela en ${daysLeft} días` : `Renueva en ${daysLeft} días`}
                </span>
              )}
              {stripeSub?.card && (
                <span style={{ fontSize: "13px", color: "#94A3B8" }}>
                  {stripeSub.card.brand.toUpperCase()} ···{stripeSub.card.last4} &nbsp;{stripeSub.card.expMonth}/{String(stripeSub.card.expYear).slice(-2)}
                </span>
              )}
            </div>
          </div>
          {stripeSub && (
            <button type="button" onClick={handlePortal} disabled={upgrading === "portal"}
              style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "#fff", color: "#475569", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              Gestionar tarjeta / cancelar →
            </button>
          )}
        </div>
      </div>

      {/* Toggle mensual / anual */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
        <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 500 }}>Facturación:</span>
        {(["mensual", "anual"] as const).map(b => (
          <button key={b} type="button" onClick={() => setBilling(b)}
            style={{ padding: "6px 16px", borderRadius: "7px", border: "1px solid #E2E8F0", background: billing === b ? "#0F2A3D" : "#fff", color: billing === b ? "#fff" : "#64748B", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
            {b === "mensual" ? "Mensual" : "Anual  −17%"}
          </button>
        ))}
      </div>

      {/* Cards de planes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "2rem" }}>
        {UPGRADE_PLANS.map(p => {
          const isCurrentPlan = p.key === plan;
          const price = billing === "mensual" ? p.mensual : Math.round(p.anual / 12);
          const isLoading = upgrading === p.key;
          return (
            <div key={p.key} style={{ border: `1px solid ${isCurrentPlan ? p.color : "#E2E8F0"}`, borderRadius: "12px", padding: "1.25rem", background: isCurrentPlan ? `${p.color}06` : "#fff", position: "relative" }}>
              {isCurrentPlan && (
                <span style={{ position: "absolute", top: "-10px", left: "16px", fontSize: "10px", fontWeight: 700, background: p.color, color: "#fff", borderRadius: "4px", padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Plan actual
                </span>
              )}
              <p style={{ margin: "0 0 2px", fontSize: "12px", fontWeight: 700, color: p.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.label}</p>
              <p style={{ margin: "0 0 12px", fontSize: "22px", fontWeight: 700, color: "#0F2A3D", lineHeight: 1 }}>
                ${price.toLocaleString("es-CL")}
                <span style={{ fontSize: "12px", fontWeight: 400, color: "#94A3B8" }}>/mes</span>
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize: "12px", color: "#475569", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <span style={{ color: p.color, flexShrink: 0, marginTop: "1px" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              {isCurrentPlan ? (
                <div style={{ padding: "8px 0", textAlign: "center", fontSize: "12px", fontWeight: 600, color: p.color }}>Plan activo</div>
              ) : (
                <button type="button" onClick={() => handleUpgrade(p.key)} disabled={!!upgrading}
                  style={{ width: "100%", padding: "9px 0", borderRadius: "8px", border: "none", background: p.color, color: "#fff", fontSize: "13px", fontWeight: 700, cursor: upgrading ? "not-allowed" : "pointer", opacity: upgrading ? 0.7 : 1 }}>
                  {isLoading ? "Redirigiendo..." : plan === "BASICO" ? "Contratar →" : "Cambiar plan →"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Historial de pagos */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700, color: "#0F2A3D", margin: "0 0 0.875rem" }}>
          Historial de pagos
        </h2>
        {loading ? (
          <p style={{ color: "#94A3B8", fontSize: "14px" }}>Cargando...</p>
        ) : invoices.length === 0 ? (
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
            <p style={{ color: "#94A3B8", margin: 0, fontSize: "14px" }}>Sin pagos registrados aún.</p>
          </div>
        ) : (
          <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#64748B", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#64748B", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Período</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#64748B", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Monto</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 600, color: "#64748B", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#64748B", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recibo</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => {
                  const date       = new Date(inv.created * 1000).toLocaleDateString("es-CL");
                  const periodFrom = new Date(inv.period_start * 1000).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
                  const periodTo   = new Date(inv.period_end   * 1000).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
                  const amount     = (inv.amount_paid / 100).toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 });
                  const isPaid     = inv.status === "paid";
                  return (
                    <tr key={inv.id} style={{ borderBottom: i < invoices.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                      <td style={{ padding: "12px 16px", color: "#0F2A3D" }}>{date}</td>
                      <td style={{ padding: "12px 16px", color: "#64748B" }}>{periodFrom} – {periodTo}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#0F2A3D" }}>{amount}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: isPaid ? "#16A34A" : "#D97706", background: isPaid ? "rgba(22,163,74,0.08)" : "rgba(245,158,11,0.08)", borderRadius: "5px", padding: "3px 8px", textTransform: "uppercase" }}>
                          {isPaid ? "Pagado" : inv.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {inv.hosted_invoice_url ? (
                          <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#7C3AED", fontWeight: 600, textDecoration: "none" }}>
                            Ver →
                          </a>
                        ) : <span style={{ color: "#CBD5E1" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlanesPage() {
  return (
    <Suspense>
      <PlanesContent />
    </Suspense>
  );
}
