"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Logo } from "@/components/brand/Logo";
import { colors, fonts } from "@/styles/tokens";

type PublicPlan = "PERSONAL" | "PROFESIONAL" | "EMPRESA";
type CheckoutStep = "consent" | "payment";

interface CouponValidation {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    name: string;
    type: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
  };
  discountAmount: number;
  finalAmount: number;
  message?: string;
}

const PLAN_COPY: Record<
  PublicPlan,
  { label: string; price: string; description: string; amount: number }
> = {
  PERSONAL: {
    label: "Personal",
    price: "$4.990 / mes",
    description:
      "Para personas naturales que quieren ordenar y declarar su situación tributaria cripto.",
    amount: 4990,
  },
  PROFESIONAL: {
    label: "Profesional",
    price: "$29.990 / mes",
    description: "Para operación avanzada, reportes y gestión experta.",
    amount: 29990,
  },
  EMPRESA: {
    label: "Empresa",
    price: "$59.990 / mes",
    description: "Para equipos, multiempresa y administración comercial avanzada.",
    amount: 59990,
  },
};

function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value);
}

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
  provider,
  billing,
  coupon,
}: {
  copy: { label: string; price: string; description: string; amount: number };
  provider: string;
  billing: string;
  coupon: CouponValidation | null;
}) {
  const finalAmount = coupon?.valid ? coupon.finalAmount : copy.amount;
  const discountAmount = coupon?.valid ? coupon.discountAmount : 0;

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
          {formatClp(copy.amount)}
        </p>
      </div>

      {coupon?.valid && coupon.coupon && (
        <>
          <div
            style={{
              height: 1,
              background: "rgba(148,163,184,0.18)",
              margin: "14px 0",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <p style={{ margin: 0, color: "#CBD5E1", fontSize: 13 }}>
              Cupón: <strong style={{ color: "#F8FAFC" }}>{coupon.coupon.code}</strong>
            </p>
            <p style={{ margin: 0, color: "#F87171", fontSize: 13, fontWeight: 700 }}>
              -{formatClp(discountAmount)}
            </p>
          </div>
        </>
      )}

      <div
        style={{
          height: 1,
          background: "rgba(148,163,184,0.18)",
          margin: "14px 0",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
        }}
      >
        <p style={{ margin: 0, color: "#F8FAFC", fontSize: 14, fontWeight: 700 }}>
          Total a pagar
        </p>
        <p
          style={{
            margin: 0,
            color: colors.accent,
            fontSize: 20,
            fontWeight: 850,
          }}
        >
          {formatClp(finalAmount)}
        </p>
      </div>

      <div
        style={{
          height: 1,
          background: "rgba(148,163,184,0.18)",
          margin: "14px 0",
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
  coupon,
  onCouponChange,
  onAccepted,
}: {
  copy: { label: string; price: string; description: string; amount: number };
  plan: PublicPlan;
  provider: string;
  billing: string;
  coupon: CouponValidation | null;
  onCouponChange: (coupon: CouponValidation | null) => void;
  onAccepted: () => void;
}) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedRenewal, setAcceptedRenewal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const canContinue = acceptedTerms && acceptedPrivacy && acceptedRenewal;

  async function handleValidateCoupon() {
    const code = couponCode.trim();

    if (!code) {
      onCouponChange(null);
      setCouponError(null);
      return;
    }

    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const response = await fetch("/api/billing/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, plan, amount: copy.amount }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        onCouponChange(null);
        setCouponError(result.message ?? "Cupón inválido.");
        return;
      }

      onCouponChange(result.data as CouponValidation);
    } catch {
      onCouponChange(null);
      setCouponError("No fue posible validar el cupón.");
    } finally {
      setValidatingCoupon(false);
    }
  }

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

      <PlanSummary copy={copy} provider={provider} billing={billing} coupon={coupon} />

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
          Código promocional
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Ej: LANZAMIENTO50"
            disabled={validatingCoupon}
            style={{
              flex: 1,
              padding: "10px 12px",
              border: "1px solid rgba(148,163,184,0.25)",
              borderRadius: 8,
              background: colors.primary,
              color: "#F8FAFC",
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={handleValidateCoupon}
            disabled={validatingCoupon || !couponCode.trim()}
            style={{
              padding: "10px 14px",
              border: "none",
              borderRadius: 8,
              background: validatingCoupon || !couponCode.trim() ? "#374151" : colors.accent,
              color: validatingCoupon || !couponCode.trim() ? "#9CA3AF" : "#062016",
              fontSize: 13,
              fontWeight: 700,
              cursor: validatingCoupon || !couponCode.trim() ? "not-allowed" : "pointer",
            }}
          >
            {validatingCoupon ? "Validando..." : "Aplicar"}
          </button>
        </div>

        {couponError && (
          <p style={{ margin: "10px 0 0", color: "#F87171", fontSize: 12 }}>
            {couponError}
          </p>
        )}

        {coupon?.valid && coupon.coupon && (
          <p style={{ margin: "10px 0 0", color: "#34D399", fontSize: 12 }}>
            Cupón {coupon.coupon.code} aplicado: -{formatClp(coupon.discountAmount)}
          </p>
        )}
      </div>

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
  coupon,
  registerUrl,
}: {
  copy: { label: string; price: string; description: string; amount: number };
  plan: PublicPlan;
  provider: string;
  billing: string;
  coupon: CouponValidation | null;
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
        coupon: coupon?.coupon?.code ?? null,
        discountAmount: coupon?.discountAmount ?? 0,
        finalAmount: coupon?.finalAmount ?? copy.amount,
        completedAt: new Date().toISOString(),
      }),
    );

    console.info("[commercial]", {
      event: "checkout_payment_completed",
      plan,
      billing,
      provider,
      coupon: coupon?.coupon?.code ?? null,
      finalAmount: coupon?.finalAmount ?? copy.amount,
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

      <PlanSummary copy={copy} provider={provider} billing={billing} coupon={coupon} />

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
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);

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
        coupon: coupon?.coupon?.code ?? null,
        originalAmount: copy.amount,
        discountAmount: coupon?.discountAmount ?? 0,
        finalAmount: coupon?.finalAmount ?? copy.amount,
      }),
    );

    console.info("[commercial]", {
      event: "checkout_terms_accepted",
      plan,
      billing,
      provider,
      coupon: coupon?.coupon?.code ?? null,
      finalAmount: coupon?.finalAmount ?? copy.amount,
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
          coupon={coupon}
          onCouponChange={setCoupon}
          onAccepted={handleConsentAccepted}
        />
      ) : (
        <PaymentStep
          copy={copy}
          plan={plan}
          provider={provider}
          billing={billing}
          coupon={coupon}
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
