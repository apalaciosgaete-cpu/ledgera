"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { colors, fonts } from "@/styles/tokens";

type PublicPlan = "PERSONAL" | "PROFESIONAL" | "EMPRESA";

const PLAN_COPY: Record<PublicPlan, { label: string; price: string; description: string }> = {
  PERSONAL: {
    label: "Personal",
    price: "$4.990 / mes",
    description: "Para personas naturales que quieren ordenar y declarar su situación tributaria cripto.",
  },
  PROFESIONAL: {
    label: "Profesional",
    price: "$29.990 / mes",
    description: "Para operación avanzada, reportes y gestión experta.",
  },
  EMPRESA: {
    label: "Empresa",
    price: "$59.990 / mes",
    description: "Para equipos, multiempresa y administración comercial avanzada.",
  },
};

function normalizePlan(value: string | null): PublicPlan {
  const normalized = value?.toUpperCase();

  if (normalized === "PERSONAL" || normalized === "PROFESIONAL" || normalized === "EMPRESA") {
    return normalized;
  }

  return "PROFESIONAL";
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const plan = normalizePlan(searchParams.get("plan"));
  const provider = searchParams.get("provider") ?? "flow";
  const billing = searchParams.get("billing") ?? "monthly";
  const copy = PLAN_COPY[plan];

  const registerUrl = useMemo(() => {
    const params = new URLSearchParams({
      plan,
      provider,
      billing,
      checkout: "paid-first",
      source: "public_checkout",
    });

    return `/register?${params.toString()}`;
  }, [billing, plan, provider]);

  function handleContinue() {
    setLoading(true);

    sessionStorage.setItem(
      "pendingCheckout",
      JSON.stringify({
        plan,
        billing,
        provider,
        action: "checkout",
        source: "public_checkout_first",
        next: "register_after_payment",
      }),
    );

    sessionStorage.setItem(
      "paidFirstCheckout",
      JSON.stringify({
        plan,
        billing,
        provider,
        confirmedAt: new Date().toISOString(),
      }),
    );

    router.push(registerUrl);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: colors.primary,
        color: "#F8FAFC",
        fontFamily: fonts.body,
        padding: "32px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        <section
          style={{
            background: colors.surfaceDark,
            border: `1px solid ${colors.borderDark}`,
            borderRadius: 18,
            padding: 28,
            boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: colors.accent,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Checkout primero
          </p>

          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 26,
              lineHeight: 1.15,
              margin: "0 0 10px",
              color: "#F8FAFC",
            }}
          >
            Estás contratando LEDGERA {copy.label}
          </h1>

          <p style={{ margin: "0 0 22px", color: "#94A3B8", fontSize: 14, lineHeight: 1.6 }}>
            {copy.description}
          </p>

          <div
            style={{
              background: "rgba(15,42,61,0.85)",
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: 14,
              padding: 18,
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
              <div>
                <p style={{ margin: 0, color: "#CBD5E1", fontSize: 12 }}>Plan seleccionado</p>
                <p style={{ margin: "4px 0 0", color: "#F8FAFC", fontSize: 18, fontWeight: 850 }}>{copy.label}</p>
              </div>
              <p style={{ margin: 0, color: colors.accent, fontSize: 18, fontWeight: 850 }}>{copy.price}</p>
            </div>

            <div style={{ height: 1, background: "rgba(148,163,184,0.18)", margin: "16px 0" }} />

            <p style={{ margin: 0, color: "#94A3B8", fontSize: 12, lineHeight: 1.6 }}>
              Provider preparado: {provider}. En producción este paso redirige directo a Stripe, Flow o MercadoPago. Después del pago se completa cuenta y seguridad.
            </p>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 10,
              padding: "14px 18px",
              background: colors.accent,
              color: "#062016",
              fontSize: 15,
              fontWeight: 850,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.72 : 1,
            }}
          >
            {loading ? "Preparando pago..." : "Continuar al pago"}
          </button>

          <p style={{ margin: "14px 0 0", color: "#94A3B8", fontSize: 12, lineHeight: 1.5, textAlign: "center" }}>
            ¿Quieres partir gratis? <Link href="/register?plan=FREE" style={{ color: colors.accent }}>Crear cuenta Free</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
