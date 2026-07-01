"use client";

import { BillingCheckoutButton } from "@/components/billing/BillingCheckoutButton";
import { useAuth } from "@/modules/identity/client/authContext";
import { getPlanLabel, normalizePlan, Plan } from "@/modules/subscription/domain/planFeatures";

const PLANS = [
  {
    key: Plan.FREE,
    checkoutPlan: undefined as undefined,
    name: "Free",
    price: "$0",
    description: "Para explorar y entender tu situación",
    features: ["Estado SII", "Patrimonio", "Activos", "Rentabilidad", "Movimientos básicos", "Conexiones"],
  },
  {
    key: Plan.PERSONAL,
    checkoutPlan: "PROFESIONAL" as const,
    name: "Personal",
    price: "$4.990 / mes",
    description: "Para el inversor individual",
    features: [
      "Todo lo de Free",
      "Impuesto estimado",
      "PDF tributario",
      "CSV tributario",
      "Declaraciones",
      "Calendario tributario",
      "Historial tributario",
      "Simulador",
      "Exportaciones básicas",
    ],
  },
  {
    key: Plan.PRO,
    checkoutPlan: "EMPRESA" as const,
    name: "Pro",
    price: "$29.990 / mes",
    description: "Para asesores y operación avanzada",
    features: [
      "Todo lo de Personal",
      "Modo Experto",
      "Auditoría",
      "Verificaciones",
      "Evidencia",
      "Cadena de custodia",
      "Integridad",
      "Reportes avanzados",
      "Multiempresa",
      "Exportaciones avanzadas",
    ],
  },
];

type PlanComparisonProps = {
  currentPlan: string | null | undefined;
};

export function PlanComparison({ currentPlan }: PlanComparisonProps) {
  const { isAuthenticated } = useAuth();
  const normalizedCurrent = normalizePlan(currentPlan);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
      {PLANS.map((plan) => {
        const isCurrent = normalizedCurrent === plan.key;
        const action = isAuthenticated ? "change-plan" : "checkout";

        return (
          <div
            key={plan.key}
            style={{
              background: "var(--bg-elev)",
              border: isCurrent ? "2px solid var(--accent)" : "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ color: "var(--text)", fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>
                {plan.name}
                {isCurrent && (
                  <span style={{ marginLeft: 8, fontSize: 10, color: "var(--accent)", background: "rgba(22,163,74,0.12)", padding: "2px 8px", borderRadius: 999 }}>
                    Actual
                  </span>
                )}
              </h4>
              <p style={{ color: "var(--text)", fontSize: 22, fontWeight: 850, margin: "0 0 6px" }}>{plan.price}</p>
              <p style={{ color: "var(--text-soft)", fontSize: 12, margin: 0 }}>{plan.description}</p>
            </div>

            <ul style={{ listStyle: "none", margin: "0 0 16px", padding: 0, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {plan.features.map((feature) => (
                <li key={feature} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)" }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {plan.checkoutPlan && !isCurrent ? (
              <BillingCheckoutButton
                plan={plan.checkoutPlan}
                action={action}
                style={{
                  background: "var(--accent)",
                  color: "var(--text)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {isAuthenticated ? `Cambiar a ${plan.name}` : `Elegir ${plan.name}`}
              </BillingCheckoutButton>
            ) : (
              <button
                disabled
                style={{
                  background: isCurrent ? "var(--accent)" : "var(--bg-elev)",
                  color: isCurrent ? "var(--text)" : "var(--text-soft)",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "not-allowed",
                }}
              >
                {isCurrent ? "Plan actual" : "—"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
