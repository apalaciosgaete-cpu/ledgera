"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { BillingCheckoutButton } from "@/components/billing/BillingCheckoutButton";
import { useAuth } from "@/modules/identity/client/authContext";
import type { BillingCheckoutPlan } from "@/modules/billing/client/billingClient";
import { fonts } from "@/styles/tokens";

type BillingCycle = "monthly" | "annual";

type PlanSummary = {
  label: string;
  monthly: number;
  annual: number;
  description: string;
  features: string[];
};

const PLAN_SUMMARIES: Record<BillingCheckoutPlan, PlanSummary> = {
  PERSONAL: {
    label: "Personal",
    monthly: 5990,
    annual: 65890,
    description:
      "Mantén tu historial cripto ordenado, conciliado y preparado para revisión tributaria.",
    features: [
      "Múltiples fuentes de importación",
      "Conciliación y corrección de inconsistencias",
      "Trazabilidad del costo por activo",
      "Respaldos completos en PDF y Excel",
    ],
  },
  PROFESIONAL: {
    label: "Profesional",
    monthly: 29990,
    annual: 329890,
    description:
      "Administra los historiales cripto de tus clientes desde una plataforma especializada.",
    features: [
      "5 clientes incluidos",
      "Panel multicliente y estados de avance",
      "Reportes trazables y soporte prioritario",
    ],
  },
};

function formatClp(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value);
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const rawPlan = searchParams.get("plan")?.toUpperCase();
  const plan: BillingCheckoutPlan | null =
    rawPlan === "PERSONAL" || rawPlan === "PROFESIONAL" ? rawPlan : null;
  const billing: BillingCycle =
    searchParams.get("billing") === "annual" ? "annual" : "monthly";

  const resumePath = plan
    ? `/checkout?plan=${plan}&billing=${billing}&source=resume`
    : "/planes";
  const loginUrl = `/login?next=${encodeURIComponent(resumePath)}`;
  const registerUrl = `/register?next=${encodeURIComponent(resumePath)}`;
  const summary = plan ? PLAN_SUMMARIES[plan] : null;
  const price = summary
    ? billing === "annual"
      ? summary.annual
      : summary.monthly
    : 0;
  const period = billing === "annual" ? "año" : "mes";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-elev)",
        color: "var(--text)",
        fontFamily: fonts.body,
        padding: "32px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        <section
          style={{
            background: "var(--bg-elev)",
            border: "1px solid var(--border-strong)",
            borderRadius: 18,
            padding: 30,
            boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              borderRadius: 999,
              padding: "5px 10px",
              background: "rgba(14,165,233,0.09)",
              border: "1px solid rgba(14,165,233,0.22)",
              color: "var(--accent)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            Resumen de contratación
          </span>

          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 27,
              lineHeight: 1.18,
              margin: "0 0 10px",
              color: "var(--text)",
            }}
          >
            {summary
              ? `Plan ${summary.label} · ${billing === "annual" ? "anual" : "mensual"}`
              : "Selecciona un plan para continuar"}
          </h1>

          {summary ? (
            <>
              <p
                style={{
                  margin: "0 0 20px",
                  color: "var(--text-soft)",
                  fontSize: 14,
                  lineHeight: 1.65,
                }}
              >
                {summary.description}
              </p>

              <div
                style={{
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  padding: 18,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: "0 0 4px",
                        color: "var(--text-soft)",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Valor del plan
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: "var(--text)",
                        fontFamily: fonts.display,
                        fontSize: 28,
                        fontWeight: 900,
                      }}
                    >
                      {formatClp(price)}
                      <span
                        style={{
                          marginLeft: 6,
                          color: "var(--text-soft)",
                          fontFamily: fonts.body,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        + IVA/{period}
                      </span>
                    </p>
                  </div>

                  {billing === "annual" ? (
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "rgba(22,163,74,0.10)",
                        border: "1px solid rgba(22,163,74,0.24)",
                        color: "var(--accent)",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      12 meses por el precio de 11
                    </span>
                  ) : null}
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "grid",
                    gap: 9,
                  }}
                >
                  {summary.features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 9,
                        color: "var(--text-soft)",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: "var(--accent)", fontWeight: 900 }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p
              style={{
                margin: "0 0 20px",
                color: "var(--text-soft)",
                fontSize: 14,
                lineHeight: 1.65,
              }}
            >
              Revisa las alternativas disponibles y selecciona la que mejor se ajuste a tu uso.
            </p>
          )}

          {!plan ? (
            <Link
              href="/planes"
              style={{
                display: "inline-flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9,
                padding: "12px 16px",
                background: "var(--accent)",
                color: "var(--accent-contrast)",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Ver planes
            </Link>
          ) : isLoading ? (
            <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 13 }}>
              Verificando sesión...
            </p>
          ) : isAuthenticated ? (
            <BillingCheckoutButton
              plan={plan}
              billing={billing}
              style={{
                borderRadius: 9,
                padding: "13px 16px",
                background: "var(--accent)",
                color: "var(--accent-contrast)",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Continuar con la contratación
            </BillingCheckoutButton>
          ) : (
            <>
              <p
                style={{
                  margin: "0 0 12px",
                  color: "var(--text-soft)",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                Inicia sesión o crea tu cuenta para continuar con el plan seleccionado.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link
                  href={loginUrl}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "1 1 190px",
                    borderRadius: 9,
                    padding: "12px 16px",
                    background: "var(--accent)",
                    color: "var(--accent-contrast)",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href={registerUrl}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "1 1 190px",
                    borderRadius: 9,
                    padding: "12px 16px",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Crear cuenta
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
