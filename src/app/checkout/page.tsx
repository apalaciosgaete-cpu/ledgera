"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { colors, fonts } from "@/styles/tokens";

type PublicPlan = "PERSONAL" | "PROFESIONAL" | "EMPRESA";
type CheckoutStep = "consent" | "payment";

const PLAN_COPY: Record<
  PublicPlan,
  { label: string; price: string; description: string }
> = {
  PERSONAL: {
    label: "Personal",
    price: "$4.990 / mes",
    description:
      "Para personas naturales que quieren ordenar y declarar su situación tributaria cripto.",
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

  if (
    normalized === "PERSONAL" ||
    normalized === "PROFESIONAL" ||
    normalized === "EMPRESA"
  ) {
    return normalized;
  }

  return "PROFESIONAL";
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
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
        {children}
      </div>
    </main>
  );
}

function PlanSummary({
  copy,
  plan,
  provider,
  billing,
}: {
  copy: { label: string; price: string; description: string };
  plan: PublicPlan;
  provider: string;
  billing: string;
}) {
  return (
    <div
      style={{
        background: "rgba(15,42,61,0.85)",
        border: "1px solid rgba(148,163,184,0.18)",
        borderRadius: 14,
        padding: 18,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div>
          <p style={{ margin: 0, color: "#CBD5E1", fontSize: 12 }}>Plan seleccionado</p>
          <p
            style={{
              margin: "4px 0 0",
              color: "#F8FAFC",
              fontSize: 18,
              fontWeight: 850,
            }}
          >
            {copy.label}
          </p>
        </div>
        <p
          style={{
            margin: 0,
            color: colors.accent,
            fontSize: 18,
            fontWeight: 850,
          }}
        >
          {copy.price}
        </p>
      </div>

      <div
        style={{
          height: 1,
          background: "rgba(148,163,184,0.18)",
          margin: "16px 0",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <p
          style={{
            margin: 0,
            color: "#94A3B8",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          Serás redirigido a una plataforma de pago segura para completar tu
          contratación.
        </p>
        <p
          style={{
            margin: 0,
            color: "#64748B",
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          Proveedor: {provider} · Ciclo: {billing === "annual" ? "anual" : "mensual"}
        </p>
      </div>
    </div>
  );
}

function ConsentStep({
  copy,
  plan,
  provider,
  billing,
  onAccepted,
}: {
  copy: { label: string; price: string; description: string };
  plan: PublicPlan;
  provider: string;
  billing: string;
  onAccepted: () => void;
}) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedRenewal, setAcceptedRenewal] = useState(false);

  const canContinue = acceptedTerms && acceptedPrivacy && acceptedRenewal;

  function handleContinue() {
    if (!canContinue) return;
    onAccepted();
  }

  return (
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

      <PlanSummary copy={copy} plan={plan} provider={provider} billing={billing} />

      <div
        style={{
          background: "rgba(15,42,61,0.55)",
          border: "1px solid rgba(148,163,184,0.18)",
          borderRadius: 14,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <p
          style={{
            margin: "0 0 14px",
            color: "#CBD5E1",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Antes de continuar
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              style={{ marginTop: "0.15rem" }}
            />
            <span style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.5 }}>
              Acepto los{" "}
              <Link
                href="/legal/terminos"
                target="_blank"
                style={{ color: colors.accent, textDecoration: "underline" }}
              >
                Términos y Condiciones
              </Link>
            </span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              style={{ marginTop: "0.15rem" }}
            />
            <span style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.5 }}>
              Acepto la{" "}
              <Link
                href="/legal/privacidad"
                target="_blank"
                style={{ color: colors.accent, textDecoration: "underline" }}
              >
                Política de Privacidad
              </Link>
            </span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={acceptedRenewal}
              onChange={(e) => setAcceptedRenewal(e.target.checked)}
              style={{ marginTop: "0.15rem" }}
            />
            <span style={{ color: "#CBD5E1", fontSize: 13, lineHeight: 1.5 }}>
              Entiendo que mi suscripción se renovará automáticamente hasta su
              cancelación
            </span>
          </label>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "14px",
            fontSize: "12px",
          }}
        >
          <Link
            href="/legal/terminos"
            target="_blank"
            style={{ color: "#94A3B8", textDecoration: "underline" }}
          >
            Términos y Condiciones
          </Link>
          <Link
            href="/legal/privacidad"
            target="_blank"
            style={{ color: "#94A3B8", textDecoration: "underline" }}
          >
            Política de Privacidad
          </Link>
          <Link
            href="/legal/comercial"
            target="_blank"
            style={{ color: "#94A3B8", textDecoration: "underline" }}
          >
            Política Comercial
          </Link>
        </div>
      </div>

      {!canContinue && (
        <p
          style={{
            margin: "0 0 14px",
            color: "#F59E0B",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          Debes aceptar los términos legales para continuar.
        </p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canContinue}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 10,
          padding: "14px 18px",
          background: !canContinue ? "#374151" : colors.accent,
          color: !canContinue ? "#9CA3AF" : "#062016",
          fontSize: 15,
          fontWeight: 850,
          cursor: !canContinue ? "not-allowed" : "pointer",
          opacity: !canContinue ? 0.72 : 1,
        }}
      >
        Continuar al pago
      </button>

      <p
        style={{
          margin: "14px 0 0",
          color: "#94A3B8",
          fontSize: 12,
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        ¿Quieres partir gratis?{" "}
        <Link href="/register?plan=FREE" style={{ color: colors.accent }}>
          Crear cuenta Free
        </Link>
      </p>
    </section>
  );
}

function PaymentStep({
  copy,
  plan,
  provider,
  billing,
  registerUrl,
}: {
  copy: { label: string; price: string; description: string };
  plan: PublicPlan;
  provider: string;
  billing: string;
  registerUrl: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handlePaymentCompleted() {
    setLoading(true);

    sessionStorage.setItem(
      "paidFirstCheckout",
      JSON.stringify({
        plan,
        billing,
        provider,
        completedAt: new Date().toISOString(),
      }),
    );

    console.info("[commercial]", {
      event: "checkout_payment_completed",
      plan,
      billing,
      provider,
    });

    router.push(registerUrl);
  }

  return (
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
        Pago seguro
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
        Completa tu pago
      </h1>

      <p style={{ margin: "0 0 22px", color: "#94A3B8", fontSize: 14, lineHeight: 1.6 }}>
        Una vez confirmado el pago podrás crear tu cuenta y activar el plan
        contratado.
      </p>

      <PlanSummary copy={copy} plan={plan} provider={provider} billing={billing} />

      <div
        style={{
          background: "rgba(15,42,61,0.55)",
          border: "1px solid rgba(148,163,184,0.18)",
          borderRadius: 14,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            color: "#CBD5E1",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Simulación de pasarela de pago
        </p>
        <p
          style={{
            margin: 0,
            color: "#94A3B8",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          La integración real con el proveedor de pagos se implementará en el
          bloque 4.5.03. Por ahora, este paso valida que el flujo público de
          contratación no requiera iniciar sesión ni registrarse antes de pagar.
        </p>
      </div>

      <button
        type="button"
        onClick={handlePaymentCompleted}
        disabled={loading}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 10,
          padding: "14px 18px",
          background: loading ? "#374151" : colors.accent,
          color: loading ? "#9CA3AF" : "#062016",
          fontSize: 15,
          fontWeight: 850,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.72 : 1,
        }}
      >
        {loading ? "Redirigiendo..." : "Continuar después del pago"}
      </button>

      <p
        style={{
          margin: "14px 0 0",
          color: "#94A3B8",
          fontSize: 12,
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        ¿Tienes dudas? Revisa nuestra{" "}
        <Link href="/legal/comercial" target="_blank" style={{ color: colors.accent }}>
          Política Comercial
        </Link>
      </p>
    </section>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<CheckoutStep>("consent");

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

  function handleConsentAccepted() {
    const acceptedAt = new Date().toISOString();

    sessionStorage.setItem(
      "checkoutConsent",
      JSON.stringify({
        termsAccepted: true,
        privacyAccepted: true,
        renewalAccepted: true,
        acceptedAt,
        plan,
        billing,
        provider,
      }),
    );

    sessionStorage.setItem(
      "pendingCheckout",
      JSON.stringify({
        plan,
        billing,
        provider,
        action: "checkout",
        source: "public_checkout_first",
        next: "provider_before_registration",
      }),
    );

    console.info("[commercial]", {
      event: "checkout_terms_accepted",
      plan,
      billing,
      acceptedAt,
    });

    setStep("payment");
  }

  return (
    <CheckoutShell>
      {step === "consent" ? (
        <ConsentStep
          copy={copy}
          plan={plan}
          provider={provider}
          billing={billing}
          onAccepted={handleConsentAccepted}
        />
      ) : (
        <PaymentStep
          copy={copy}
          plan={plan}
          provider={provider}
          billing={billing}
          registerUrl={registerUrl}
        />
      )}
    </CheckoutShell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
