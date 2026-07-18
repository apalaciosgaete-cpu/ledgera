"use client";

import { BillingCheckoutButton } from "@/components/billing/BillingCheckoutButton";
import { useAuth } from "@/modules/identity/client/authContext";
import { normalizePlan, Plan } from "@/modules/subscription/domain/planFeatures";

const PLANS = [
  {
    key: Plan.FREE,
    checkoutPlan: undefined as undefined,
    name: "Gratuito",
    price: "$0",
    description: "Para descubrir cómo LEDGERA ordena tus operaciones",
    features: [
      "Análisis preliminar de hasta 50 movimientos",
      "Una fuente de importación",
      "Vista preliminar",
      "Detección básica de inconsistencias",
    ],
  },
  {
    key: Plan.PERSONAL,
    checkoutPlan: "PERSONAL" as const,
    name: "Personal",
    price: "$5.990 + IVA/mes",
    description: "Para traders, inversionistas y personas con actividad cripto",
    features: [
      "Múltiples fuentes de importación",
      "Historial cripto continuo",
      "Conciliación completa",
      "Trazabilidad del costo por activo",
      "PDF y Excel completos",
      "Soporte por email",
    ],
  },
  {
    key: Plan.PROFESIONAL,
    checkoutPlan: "PROFESIONAL" as const,
    name: "Profesional",
    price: "$29.990 + IVA/mes",
    description: "Para contadores y asesores con varios contribuyentes",
    features: [
      "Todo lo de Personal",
      "5 clientes incluidos",
      "Panel multicliente",
      "Estados de avance",
      "Reportes trazables",
      "Soporte prioritario",
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
                  color: "var(--accent-contrast)",
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
                  color: isCurrent ? "var(--accent-contrast)" : "var(--text-soft)",
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
