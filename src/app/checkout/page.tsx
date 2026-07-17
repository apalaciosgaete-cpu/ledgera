"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { BillingCheckoutButton } from "@/components/billing/BillingCheckoutButton";
import { useAuth } from "@/modules/identity/client/authContext";
import type { BillingCheckoutPlan } from "@/modules/billing/client/billingClient";
import { fonts } from "@/styles/tokens";

const PLAN_LABELS: Record<BillingCheckoutPlan, string> = {
  PERSONAL: "Personal",
  PROFESIONAL: "Profesional",
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const rawPlan = searchParams.get("plan")?.toUpperCase();
  const plan: BillingCheckoutPlan | null =
    rawPlan === "PERSONAL" || rawPlan === "PROFESIONAL" ? rawPlan : null;
  const billing = searchParams.get("billing") === "annual" ? "annual" : "monthly";

  const resumePath = plan
    ? `/checkout?plan=${plan}&billing=${billing}&source=resume`
    : "/planes";
  const loginUrl = `/login?next=${encodeURIComponent(resumePath)}`;
  const registerUrl = `/register?next=${encodeURIComponent(resumePath)}`;

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
      <div style={{ width: "100%", maxWidth: 600 }}>
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
            Conexión de pago preparada
          </span>

          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 27,
              lineHeight: 1.18,
              margin: "0 0 12px",
              color: "var(--text)",
            }}
          >
            {plan
              ? `Plan ${PLAN_LABELS[plan]} · ${billing === "annual" ? "anual" : "mensual"}`
              : "Selecciona un plan para continuar"}
          </h1>

          <p
            style={{
              margin: "0 0 18px",
              color: "var(--text-soft)",
              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            La integración con la pasarela externa, el retorno y el webhook de confirmación están preparados. El cobro permanece bloqueado hasta completar la habilitación legal y comercial de LEDGERA.
          </p>

          <div
            style={{
              background: "var(--bg-sunken)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <p style={{ margin: "0 0 5px", color: "var(--text)", fontSize: 13, fontWeight: 800 }}>
              No se realizará ningún cargo mientras el modo live esté deshabilitado
            </p>
            <p style={{ margin: 0, color: "var(--text-soft)", fontSize: 12, lineHeight: 1.55 }}>
              La suscripción solo se activa después de una confirmación válida recibida desde la pasarela externa.
            </p>
          </div>

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
                padding: "12px 16px",
                background: "var(--accent)",
                color: "var(--accent-contrast)",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              Continuar a la pasarela externa
            </BillingCheckoutButton>
          ) : (
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
