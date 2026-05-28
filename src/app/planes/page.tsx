"use client";

import Link from "next/link";
import { Suspense, useState, type CSSProperties } from "react";

import { BillingCheckoutButton } from "@/components/billing/BillingCheckoutButton";
import { BillingPaymentStatusBanner } from "@/components/billing/BillingPaymentStatusBanner";
import {
  PUBLIC_CONTACT_EMAIL,
  PUBLIC_WHATSAPP_URL,
  PublicButton,
  PublicContainer,
  PublicCta,
  PublicHero,
  PublicShell,
  publicPalette,
} from "@/components/public/PublicLayout";
import { useAuth } from "@/modules/identity/client/authContext";

type PlanKey = "free" | "personal" | "contador" | "empresa";
type BillingCycle = "monthly" | "annual";
type CheckoutMode = "free" | "checkout" | "contact";

type Plan = {
  key: PlanKey;
  name: string;
  monthly: number;
  annual: number;
  description: string;
  highlight: boolean;
  cta: string;
  checkoutMode: CheckoutMode;
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
    highlight: false,
    cta: "Crear cuenta gratis",
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
    annual: 49900,
    description: "Para el inversor individual",
    highlight: true,
    cta: "Empezar ahora",
    checkoutMode: "checkout",
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
    name: "Contador",
    monthly: 14990,
    annual: 149900,
    description: "Múltiples clientes",
    highlight: false,
    cta: "Hablar con LEDGERA",
    checkoutMode: "contact",
    features: [
      "Todo lo de Personal",
      "Hasta 5 clientes incluidos",
      "Cliente adicional +20%",
      "Reportes verificables SII",
      "Soporte prioritario",
    ],
    disabled: [],
    note: "Mensual: $2.998/cliente adicional · Anual: $29.980/cliente adicional",
  },
  {
    key: "empresa",
    name: "Empresa",
    monthly: 29990,
    annual: 299900,
    description: "Para operación corporativa",
    highlight: false,
    cta: "Contactar ventas",
    checkoutMode: "contact",
    features: [
      "Todo lo de Contador",
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
    a: "Sí. El plan Personal puede activarse mediante Mercado Pago con los medios disponibles en su checkout.",
  },
  {
    q: "¿Por qué Contador y Empresa requieren contacto?",
    a: "Porque pueden requerir revisión de volumen, cantidad de clientes, soporte, configuración y condiciones operativas antes de activar el servicio.",
  },
  {
    q: "¿El anual realmente incluye 2 meses gratis?",
    a: "Sí. Los precios anuales equivalen aproximadamente a 10 mensualidades, lo que representa 2 meses sin costo frente al pago mensual por 12 meses.",
  },
  {
    q: "¿Cuándo se activa el plan?",
    a: "En el plan Personal, la activación ocurre cuando el proveedor confirma el pago mediante webhook. En planes comerciales, la activación se coordina con LEDGERA.",
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
  const subject = encodeURIComponent(`Consulta plan ${plan.name} LEDGERA`);
  const body = encodeURIComponent(
    `Hola, quiero información sobre el plan ${plan.name} en modalidad ${billingLabel}.`,
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

  return (
    <article
      className={
        plan.highlight
          ? "relative flex h-full flex-col rounded-3xl border border-emerald-500/35 bg-emerald-500/[0.08] p-6 shadow-2xl shadow-emerald-950/20"
          : "relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.045] p-6"
      }
    >
      {plan.highlight ? (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <span className="rounded-full bg-emerald-600 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white">
            Más popular
          </span>
        </div>
      ) : null}

      <div className="mb-6">
        <h3 className="font-display text-2xl font-black tracking-[-0.04em] text-white">{plan.name}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{plan.description}</p>

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
            Equivale a {formatClp(Math.round(plan.annual / 12))}/mes · 2 meses gratis
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
      ) : plan.checkoutMode === "checkout" ? (
        <BillingCheckoutButton plan="PROFESIONAL" style={ctaStyle}>
          {plan.cta}
        </BillingCheckoutButton>
      ) : (
        <a href={buildContactMailto(plan, billing)} style={secondaryCheckoutStyle}>
          {plan.cta}
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
        title="Simple, transparente y preparado para escalar"
        description="El plan Personal se activa mediante checkout. Los planes Contador y Empresa se coordinan con LEDGERA para validar volumen, soporte y operación antes de activar el servicio."
      >
        <div className="flex flex-col items-center justify-center gap-4">
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
                {option === "monthly" ? "Mensual" : "Anual · 2 meses gratis"}
              </button>
            ))}
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <PublicButton href={isAuthenticated ? "/dashboard" : "/register"}>
              {isAuthenticated ? "Ir al panel" : "Comenzar ahora"}
            </PublicButton>
            <PublicButton href={PUBLIC_WHATSAPP_URL} variant="secondary">
              Hablar con LEDGERA
            </PublicButton>
          </div>
        </div>
      </PublicHero>

      <section style={{ background: publicPalette.section }}>
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

      <PublicCta
        title="Elige el nivel de operación que necesitas"
        description="Empieza con un plan simple o coordina una operación para clientes, empresas o equipos con mayor volumen."
        primaryLabel={isAuthenticated ? "Ir al panel" : "Comenzar ahora"}
        primaryHref={isAuthenticated ? "/dashboard" : "/register"}
        secondaryLabel="Hablar con LEDGERA"
        secondaryHref={PUBLIC_WHATSAPP_URL}
      />
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
