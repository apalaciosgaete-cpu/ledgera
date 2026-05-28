"use client";

import Link from "next/link";
import { Suspense, useState, type CSSProperties } from "react";

import { BillingCheckoutButton } from "@/components/billing/BillingCheckoutButton";
import { BillingPaymentStatusBanner } from "@/components/billing/BillingPaymentStatusBanner";
import {
  PUBLIC_CONTACT_EMAIL,
  PublicContainer,
  PublicHero,
  PublicShell,
  publicPalette,
} from "@/components/public/PublicLayout";
import { useAuth } from "@/modules/identity/client/authContext";

type PlanKey = "free" | "personal" | "contador" | "empresa";
type BillingCycle = "monthly" | "annual";
type CheckoutMode = "free" | "checkout" | "contact";
type CheckoutPlan = "PROFESIONAL" | "EMPRESA";

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
  checkoutMode: CheckoutMode;
  checkoutPlan?: CheckoutPlan;
  features: string[];
  disabled: string[];
  note: string | null;
};

const plans: Plan[] = [
  {
    key: "free",
    name: "Gratuito",
    monthly: 0,
    annual: 0,
    description: "Para explorar la plataforma",
    availability: "Disponible para empezar sin pago",
    highlight: false,
    cta: "Crear cuenta gratis",
    annualCta: "Crear cuenta gratis",
    checkoutMode: "free",
    features: [
      "Hasta 25 movimientos",
      "Motor FIFO incluido",
      "Panel tributario básico",
      "Sin exportaciones",
      "Sin auditoría",
    ],
    disabled: ["Sin exportaciones", "Sin auditoría"],
    note: null,
  },
  {
    key: "personal",
    name: "Personal",
    monthly: 4990,
    annual: 54890,
    description: "Para el inversor individual",
    availability: "Disponible mensual y anual",
    highlight: true,
    cta: "Activar plan",
    annualCta: "Solicitar anual",
    checkoutMode: "checkout",
    checkoutPlan: "PROFESIONAL",
    features: [
      "Movimientos ilimitados",
      "Motor FIFO automático",
      "Exportación CSV y PDF",
      "Auditoría completa",
      "Soporte por email",
    ],
    disabled: [],
    note: null,
  },
  {
    key: "contador",
    name: "Profesional",
    monthly: 14990,
    annual: 164890,
    description: "Para asesores y equipos con clientes",
    availability: "Disponible con clientes adicionales +20%",
    highlight: false,
    cta: "Solicitar activación",
    annualCta: "Solicitar anual",
    checkoutMode: "contact",
    features: [
      "Todo lo de Personal",
      "Hasta 5 clientes incluidos",
      "Cliente adicional +20% del valor del plan",
      "Reportes verificables SII",
      "Soporte prioritario",
    ],
    disabled: [],
    note: "Cliente adicional: +20% del valor del plan · Mensual $2.998 · Anual $32.978",
  },
  {
    key: "empresa",
    name: "Empresa",
    monthly: 29990,
    annual: 329890,
    description: "Para operación corporativa",
    availability: "Disponible mensual y anual",
    highlight: false,
    cta: "Activar empresa",
    annualCta: "Solicitar anual",
    checkoutMode: "checkout",
    checkoutPlan: "EMPRESA",
    features: [
      "Todo lo de Profesional",
      "Clientes ilimitados",
      "Régimen primera categoría",
      "Configuración tributaria",
      "Soporte dedicado",
    ],
    disabled: [],
    note: "Plan recomendado para empresas, oficinas contables y operaciones con revisión previa.",
  },
];

const faqItems = [
  {
    q: "¿Puedo pagar con tarjeta?",
    a: "Sí. Los planes con activación en línea usan Mercado Pago cuando está disponible para esa modalidad.",
  },
  {
    q: "¿El anual incluye 1 mes bonificado?",
    a: "Sí. Los precios anuales equivalen a 11 mensualidades, por lo que pagas 11 meses y obtienes 12 meses de uso.",
  },
  {
    q: "¿Cuánto aumenta un cliente adicional en el plan Profesional?",
    a: "El cliente adicional aumenta un 20% sobre el valor del plan Profesional: $2.998 mensual o $32.978 anual.",
  },
  {
    q: "¿Cuándo se activa el plan?",
    a: "Cuando el pago queda confirmado, se activa el plan contratado. El usuario obtiene el plan que seleccionó y pagó; no queda sujeto a una validación comercial posterior para cambiarlo por otro plan.",
  },
  {
    q: "¿Puedo cambiar de plan después?",
    a: "Sí. Puedes subir de plan cuando tu operación crezca. El cambio se coordina para evitar duplicar cobros o perder continuidad del período ya pagado.",
  },
  {
    q: "¿Puedo cancelar la suscripción?",
    a: "Sí. Puedes solicitar la cancelación antes del siguiente ciclo de cobro. El acceso se mantiene activo hasta el término del período ya pagado.",
  },
  {
    q: "¿Hay devoluciones?",
    a: "Las devoluciones se revisan caso a caso. Si existe cobro duplicado, error de activación o un problema imputable a LEDGERA, se regulariza o devuelve según corresponda. En períodos ya activados y usados, no se considera devolución proporcional automática.",
  },
];

const primaryCheckoutStyle: CSSProperties = {
  alignItems: "center",
  background: "#16A34A",
  border: "1px solid rgba(22,163,74,0.55)",
  borderRadius: "14px",
  color: "#FFFFFF",
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
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#E2E8F0",
};

function formatClp(value: number) {
  if (value === 0) return "Gratis";

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value);
}

function buildContactMailto(plan: Plan, billing: BillingCycle) {
  const billingLabel = billing === "monthly" ? "mensual" : "anual";
  const subject = encodeURIComponent(`Activación plan ${plan.name} LEDGERA`);
  const body = encodeURIComponent(
    `Hola, quiero activar el plan ${plan.name} en modalidad ${billingLabel}.`,
  );

  return `mailto:${PUBLIC_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
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
  const shouldUseCheckout =
    plan.checkoutMode === "checkout" && billing === "monthly" && Boolean(plan.checkoutPlan);

  return (
    <article
      className={
        plan.highlight
          ? "relative flex h-full flex-col rounded-3xl border border-emerald-500/35 bg-emerald-500/[0.08] p-6 shadow-2xl shadow-emerald-950/20"
          : "relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.045] p-6"
      }
    >
      <div className="mb-6">
        <h3 className="font-display text-2xl font-black tracking-[-0.04em] text-white">{plan.name}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{plan.description}</p>
        <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-emerald-300">
          {plan.availability}
        </p>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="font-display text-4xl font-black tracking-[-0.05em] text-white">
            {formatClp(price)}
          </span>
          {plan.monthly > 0 ? (
            <span className="text-sm font-bold text-slate-500">
              /{billing === "monthly" ? "mes" : "año"}
            </span>
          ) : null}
        </div>

        {billing === "annual" && plan.annual > 0 ? (
          <p className="mt-2 text-xs font-bold text-emerald-300">
            Pagas 11 meses · 1 mes bonificado
          </p>
        ) : null}
      </div>

      <ul className="mb-5 grid flex-1 gap-3 p-0">
        {plan.features.map((feature) => {
          const isDisabled = plan.disabled.includes(feature);

          return (
            <li
              key={feature}
              className={isDisabled ? "flex list-none items-start gap-3 text-sm text-slate-600" : "flex list-none items-start gap-3 text-sm text-slate-300"}
            >
              <span
                className={
                  isDisabled
                    ? "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-700 text-slate-700"
                    : "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500 text-emerald-400"
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
        <p className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs leading-6 text-slate-500">
          {plan.note}
        </p>
      ) : null}

      {plan.checkoutMode === "free" ? (
        <Link href={isAuthenticated ? "/dashboard" : "/register"} style={secondaryCheckoutStyle}>
          {isAuthenticated ? "Ir al panel" : plan.cta}
        </Link>
      ) : shouldUseCheckout && plan.checkoutPlan ? (
        <BillingCheckoutButton plan={plan.checkoutPlan} style={ctaStyle}>
          {plan.cta}
        </BillingCheckoutButton>
      ) : (
        <a href={buildContactMailto(plan, billing)} style={secondaryCheckoutStyle}>
          {billing === "annual" ? plan.annualCta : plan.cta}
        </a>
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
        title="Elige el nivel de operación que necesita tu historial crypto"
        description="Planes disponibles para ordenar movimientos, conciliación, portafolio y base tributaria trazable en Chile, con precios claros para uso personal, profesional y empresa."
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.055] p-1">
            {(["monthly", "annual"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBilling(option)}
                className={
                  billing === option
                    ? "rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"
                    : "rounded-xl px-5 py-3 text-sm font-black text-slate-500 transition hover:text-slate-200"
                }
              >
                {option === "monthly" ? "Mensual" : "Anual · 1 mes bonificado"}
              </button>
            ))}
          </div>
          <p className="m-0 text-center text-xs font-bold text-slate-500">
            El valor anual corresponde a 11 mensualidades por 12 meses de uso.
          </p>
        </div>
      </PublicHero>

      <section id="precios" style={{ background: publicPalette.section }}>
        <PublicContainer>
          <div className="py-14">
            <BillingPaymentStatusBanner />

            <div className="mt-8 overflow-x-auto pb-4">
              <div className="grid min-w-[940px] grid-cols-4 gap-4 lg:min-w-0">
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
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                Preguntas sobre planes
              </p>
              <h2 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
                Condiciones claras antes de activar
              </h2>
            </div>

            <div className="grid gap-3">
              {faqItems.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                  <summary className="cursor-pointer list-none font-display text-lg font-black tracking-[-0.025em] text-white marker:hidden">
                    {item.q}
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </PublicContainer>
      </section>

      <section style={{ background: publicPalette.page }}>
        <PublicContainer>
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] px-6 py-10 text-center md:px-10">
            <h2 className="font-display text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
              Revisa los valores disponibles
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
              Compara los planes mensual y anual antes de elegir el nivel de operación que necesitas.
            </p>
            <Link
              href="#precios"
              className="mt-7 inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-7 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              Ver precios
            </Link>
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
