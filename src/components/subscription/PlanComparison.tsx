"use client";

import { BillingCheckoutButton } from "@/components/billing/BillingCheckoutButton";
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
  const normalizedCurrent = normalizePlan(currentPlan);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
      {PLANS.map((plan) => {
        const isCurrent = normalizedCurrent === plan.key;
        return (
          <div
            key={plan.key}
            style={{
              background: "#FFFFFF",
              border: isCurrent ? "2px solid #16A34A" : "1px solid #E2E8F0",
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ color: "#0F2A3D", fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>
                {plan.name}
                {isCurrent && (
                  <span style={{ marginLeft: 8, fontSize: 10, color: "#16A34A", background: "rgba(22,163,74,0.12)", padding: "2px 8px", borderRadius: 999 }}>
                    Actual
                  </span>
                )}
              </h4>
              <p style={{ color: "#0F2A3D", fontSize: 22, fontWeight: 850, margin: "0 0 6px" }}>{plan.price}</p>
              <p style={{ color: "#64748B", fontSize: 12, margin: 0 }}>{plan.description}</p>
            </div>

            <ul style={{ listStyle: "none", margin: "0 0 16px", padding: 0, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {plan.features.map((feature) => (
                <li key={feature} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155" }}>
                  <span style={{ color: "#16A34A", fontWeight: 700 }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {plan.checkoutPlan && !isCurrent ? (
              <BillingCheckoutButton
                plan={plan.checkoutPlan}
                style={{
                  background: "#0F766E",
                  color: "#FFFFFF",
                  borderRadius: 8,
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                Elegir {plan.name}
              </BillingCheckoutButton>
            ) : (
              <button
                disabled
                style={{
                  background: isCurrent ? "#16A34A" : "#E2E8F0",
                  color: isCurrent ? "#FFFFFF" : "#64748B",
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
