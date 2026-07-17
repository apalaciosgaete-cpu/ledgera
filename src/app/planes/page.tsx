"use client";

import Link from "next/link";
import { Suspense, useState, type CSSProperties } from "react";
import { BillingCheckoutButton } from "@/components/billing/BillingCheckoutButton";
import { BillingPaymentStatusBanner } from "@/components/billing/BillingPaymentStatusBanner";
import { PublicContainer, PublicHero, PublicShell, publicPalette } from "@/components/public/PublicLayout";
import { useAuth } from "@/modules/identity/client/authContext";

type PlanKey = "free" | "personal" | "profesional";
type BillingCycle = "monthly" | "annual";
type CheckoutPlan = "PERSONAL" | "PROFESIONAL";

type Plan = {
  key: PlanKey;
  name: string;
  monthly: number;
  annual: number;
  description: string;
  availability: string;
  highlight: boolean;
  cta: string;
  annualCta: string;
  checkoutPlan?: CheckoutPlan;
  features: string[];
  disabled: string[];
  note: string | null;
  taxLabel: string | null;
};

const plans: Plan[] = [
  {
    key: "free",
    name: "Gratuito",
    monthly: 0,
    annual: 0,
    description: "El punto de entrada para descubrir cómo LEDGERA ordena tus operaciones.",
    availability: "Sin pago",
    highlight: false,
    cta: "Comenzar análisis",
    annualCta: "Comenzar análisis",
    features: [
      "Hasta 100 movimientos",
      "Una fuente de importación",
      "Vista preliminar del análisis",
      "Detección básica de inconsistencias",
      "Sin PDF ni Excel finales",
    ],
    disabled: ["Sin PDF ni Excel finales"],
    note: "El plan gratuito demuestra el valor del análisis antes de contratar.",
    taxLabel: null,
  },
  {
    key: "personal",
    name: "Personal",
    monthly: 5990,
    annual: 59900,
    description: "Para traders, inversionistas y personas con actividad cripto.",
    availability: "Mensual o anual",
    highlight: true,
    cta: "Activar Personal",
    annualCta: "Activar Personal anual",
    checkoutPlan: "PERSONAL",
    features: [
      "Historial cripto continuo",
      "Conciliación completa",
      "Corrección de inconsistencias",
      "Trazabilidad del costo por activo",
      "PDF y Excel completos",
      "Soporte por email",
    ],
    disabled: [],
    note: "Mantén tu historial ordenado y preparado para revisión tributaria durante todo el año.",
    taxLabel: "+\u00A0IVA",
  },
  {
    key: "profesional",
    name: "Profesional",
    monthly: 29990,
    annual: 299900,
    description: "Para contadores y asesores que administran varios contribuyentes.",
    availability: "Hasta 5 clientes activos",
    highlight: false,
    cta: "Activar Profesional",
    annualCta: "Activar Profesional anual",
    checkoutPlan: "PROFESIONAL",
    features: [
      "Todo lo de Personal",
      "Panel multicliente",
      "Hasta 5 clientes activos",
      "Estados de avance por contribuyente",
      "Reportes trazables para revisión",
      "Soporte prioritario",
    ],
    disabled: [],
    note: "Cliente activo adicional: $4.990 + IVA al mes.",
    taxLabel: "+\u00A0IVA",
  },
];

const faqItems = [
  {
    q: "¿Qué estoy pagando en el plan Personal?",
    a: "Pagas por mantener un historial cripto ordenado, conciliado y documentado: corrección de inconsistencias, trazabilidad por activo y respaldos completos en PDF y Excel.",
  },
  {
    q: "¿Qué diferencia al plan Profesional?",
    a: "Profesional incorpora una operación multicliente para contadores y asesores: espacios separados por contribuyente, estados de avance, reportes estandarizados y soporte prioritario.",
  },
  {
    q: "¿El pago anual tiene descuento?",
    a: "Sí. Personal cuesta $59.900 + IVA al año y Profesional $299.900 + IVA al año, equivalentes aproximadamente a dos mensualidades bonificadas.",
  },
  {
    q: "¿La contratación en línea ya procesa cobros?",
    a: "La conexión técnica con la pasarela externa está preparada, pero permanece deshabilitada hasta completar la habilitación legal y comercial. LEDGERA no realizará cargos mientras el modo de cobro siga bloqueado.",
  },
  {
    q: "¿Cuándo se activa el plan?",
    a: "Solo después de que la pasarela externa confirme el pago mediante webhook. Crear una orden pendiente o volver desde la pasarela no activa por sí solo la suscripción.",
  },
  {
    q: "¿Puedo cancelar?",
    a: "Sí. La cancelación impide el siguiente cobro y mantiene el acceso hasta finalizar el período ya pagado, según las condiciones comerciales vigentes.",
  },
];

const primaryCheckoutStyle: CSSProperties = {
  alignItems: "center",
  background: "var(--accent)",
  border: "1px solid var(--accent)",
  borderRadius: "14px",
  color: "var(--accent-contrast)",
  display: "inline-flex",
  fontSize: "14px",
  fontWeight: 900,
  justifyContent: "center",
  minHeight: "48px",
  padding: "0 20px",
  textDecoration: "none",
  width: "100%",
};

const secondaryCheckoutStyle: CSSProperties = {
  ...primaryCheckoutStyle,
  background: "var(--bg-elev)",
  border: "1px solid var(--border-strong)",
  color: "var(--text)",
};

function formatClp(value: number) {
  if (value === 0) return "Gratis";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value);
}

function PlanCard({
  plan,
  billing,
  isAuthenticated,
}: {
  plan: Plan;
  billing: BillingCycle;
  isAuthenticated: boolean;
}) {
  const price = billing === "monthly" ? plan.monthly : plan.annual;
  const ctaStyle = plan.highlight ? primaryCheckoutStyle : secondaryCheckoutStyle;

  return (
    <article
      className={
        plan.highlight
          ? "relative flex h-full flex-col rounded-3xl border border-accent bg-accent-soft p-6 shadow-2xl"
          : "relative flex h-full flex-col rounded-3xl border border-border bg-bg-elev p-6"
      }
    >
      <div className="mb-6">
        <h3 className="font-display text-2xl font-black tracking-[-0.04em] text-text">
          {plan.name}
        </h3>
        <p className="mt-2 text-sm leading-6 text-text-soft">{plan.description}</p>
        <p className="mt-3 inline-flex rounded-full border border-border bg-bg-sunken px-3 py-1 text-xs font-black text-accent">
          {plan.availability}
        </p>
        <div className="mt-6 flex flex-wrap items-baseline gap-2">
          <span className="font-display text-4xl font-black tracking-[-0.05em] text-text">
            {formatClp(price)}
          </span>
          {plan.monthly > 0 ? (
            <span className="text-sm font-bold text-text-faint">
              /{billing === "monthly" ? "mes" : "año"}
            </span>
          ) : null}
        </div>
        {plan.taxLabel ? (
          <p className="mt-2 text-xs font-bold text-text-faint">{plan.taxLabel}</p>
        ) : null}
        {billing === "annual" && plan.annual > 0 ? (
          <p className="mt-2 text-xs font-bold text-accent">
            Aproximadamente 2 meses bonificados
          </p>
        ) : null}
      </div>

      <ul className="mb-5 grid flex-1 gap-3 p-0">
        {plan.features.map((feature) => {
          const isDisabled = plan.disabled.includes(feature);
          return (
            <li
              key={feature}
              className={
                isDisabled
                  ? "flex list-none items-start gap-3 text-sm text-text-faint"
                  : "flex list-none items-start gap-3 text-sm text-text-soft"
              }
            >
              <span
                className={
                  isDisabled
                    ? "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong text-text-faint"
                    : "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent text-accent"
                }
                aria-hidden="true"
              >
                {isDisabled ? "–" : "✓"}
              </span>
              {feature}
            </li>
          );
        })}
      </ul>

      {plan.note ? (
        <p className="mb-5 rounded-2xl border border-border bg-bg-sunken px-4 py-3 text-xs leading-6 text-text-faint">
          {plan.note}
        </p>
      ) : null}

      {!plan.checkoutPlan ? (
        <Link
          href={isAuthenticated ? "/panel" : "/register"}
          style={secondaryCheckoutStyle}
        >
          {isAuthenticated ? "Ir al panel" : plan.cta}
        </Link>
      ) : (
        <BillingCheckoutButton
          plan={plan.checkoutPlan}
          billing={billing}
          style={ctaStyle}
        >
          {billing === "annual" ? plan.annualCta : plan.cta}
        </BillingCheckoutButton>
      )}
    </article>
  );
}

function PlanesContent() {
  const { isAuthenticated } = useAuth();
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <PublicShell activePath="/planes">
      <PublicHero
        eyebrow="Planes y precios"
        title="Paga por orden, continuidad y respaldo"
        description="Tres niveles claros: entra gratis, mantén tu historial cripto permanentemente ordenado con Personal o administra contribuyentes desde Profesional."
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="inline-flex rounded-2xl border border-border bg-bg-elev p-1">
            {(["monthly", "annual"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBilling(option)}
                className={
                  billing === option
                    ? "rounded-xl bg-accent px-5 py-3 text-sm font-black text-accent-contrast"
                    : "rounded-xl px-5 py-3 text-sm font-black text-text-faint transition hover:text-text"
                }
              >
                {option === "monthly" ? "Mensual" : "Anual · mayor ahorro"}
              </button>
            ))}
          </div>
          <p className="m-0 max-w-2xl text-center text-xs font-bold leading-5 text-text-faint">
            La pasarela externa está técnicamente preparada y permanece bloqueada hasta completar la habilitación legal.
          </p>
        </div>
      </PublicHero>

      <section id="precios" style={{ background: publicPalette.section }}>
        <PublicContainer>
          <div className="py-14">
            <BillingPaymentStatusBanner />
            <div className="mt-8 overflow-x-auto pb-4">
              <div className="grid min-w-[760px] grid-cols-3 gap-4 lg:min-w-0">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.key}
                    plan={plan}
                    billing={billing}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </div>
          </div>
        </PublicContainer>
      </section>

      <section style={{ background: publicPalette.page }}>
        <PublicContainer style={{ maxWidth: "860px" }}>
          <div className="py-16">
            <div className="mb-8 text-center">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-text-faint">
                Preguntas sobre planes
              </p>
              <h2 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-text md:text-4xl">
                Condiciones claras antes de activar
              </h2>
            </div>
            <div className="grid gap-3">
              {faqItems.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-border bg-bg-elev p-5"
                >
                  <summary className="cursor-pointer list-none font-display text-lg font-black tracking-[-0.025em] text-text marker:hidden">
                    {item.q}
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-text-soft">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </PublicContainer>
      </section>
    </PublicShell>
  );
}

export default function PlanesPage() {
  return (
    <Suspense>
      <PlanesContent />
    </Suspense>
  );
}
