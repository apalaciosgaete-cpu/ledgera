// src/components/landing/LedgeraLanding.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";

type BillingMode = "monthly" | "annual";

type Plan = {
  key: string;
  name: string;
  monthly: number;
  annual: number;
  description: string;
  highlight: boolean;
  cta: string;
  href: string;
  features: string[];
  note?: string;
};

const HERO_IMAGES = ["/hero-bg.jpg", "/hero1-bg.jpg", "/hero2-bg.jpg"];

const navLinks = [
  { label: "Quiénes somos", href: "/quienes-somos" },
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Planes", href: "/planes" },
  { label: "Preguntas", href: "/preguntas" },
  { label: "Blog", href: "/blog" },
];

const problems = [
  "Movimientos repartidos entre exchange, banco y archivos sueltos.",
  "Compras, ventas, depósitos y retiros difíciles de explicar.",
  "Transferencias bancarias sin contexto financiero crypto.",
  "Portafolios contaminados por importaciones automáticas o duplicadas.",
  "Información insuficiente para revisión contable o tributaria.",
];

const flow = [
  {
    step: "01",
    title: "Importa tus fuentes",
    text: "Carga movimientos desde exchanges compatibles, cartolas bancarias o registros manuales.",
  },
  {
    step: "02",
    title: "Revisa antes de confirmar",
    text: "Cada evento queda en una bandeja de importaciones para evitar duplicados y errores.",
  },
  {
    step: "03",
    title: "Concilia banco y crypto",
    text: "Relaciona transferencias bancarias con movimientos confirmados del portafolio.",
  },
  {
    step: "04",
    title: "Prepara información clara",
    text: "Obtén portafolio limpio, trazabilidad y una base útil para revisión financiera y tributaria.",
  },
];

const modules = [
  {
    title: "Importaciones",
    text: "Revisa datos antes de confirmarlos. Nada entra al portafolio sin control.",
  },
  {
    title: "Banco",
    text: "Carga cartolas y detecta movimientos que pueden tener relación con actividad crypto.",
  },
  {
    title: "Portafolio",
    text: "Conserva solo movimientos confirmados para construir una vista financiera limpia.",
  },
  {
    title: "Conciliación",
    text: "Relaciona banco, exchange y portafolio con revisión humana antes de cerrar coincidencias.",
  },
  {
    title: "Tributario",
    text: "Prepara una base ordenada para revisar impuestos crypto en Chile.",
  },
  {
    title: "Auditoría",
    text: "Mantén trazabilidad de decisiones, cambios y movimientos relevantes.",
  },
];

const plans: Plan[] = [
  {
    key: "free",
    name: "Gratuito",
    monthly: 0,
    annual: 0,
    description: "Para explorar LEDGERA",
    highlight: false,
    cta: "Crear cuenta gratis",
    href: "/register",
    features: [
      "Ilimitado para organizar",
      "Importaciones básicas",
      "Portafolio inicial",
      "Panel tributario básico",
    ],
  },
  {
    key: "personal",
    name: "Personal",
    monthly: 4990,
    annual: 54890,
    description: "Para usuarios crypto individuales",
    highlight: true,
    cta: "Ver plan Personal",
    href: "/planes#precios",
    features: [
      "Movimientos ilimitados",
      "Conciliación banco y crypto",
      "Exportación CSV y PDF",
      "Auditoría de movimientos",
    ],
    note: "Disponible mensual y anual.",
  },
  {
    key: "profesional",
    name: "Profesional",
    monthly: 14990,
    annual: 164890,
    description: "Para asesores y equipos con clientes",
    highlight: false,
    cta: "Ver plan Profesional",
    href: "/planes#precios",
    features: [
      "Todo lo de Personal",
      "Hasta 5 clientes incluidos",
      "Cliente adicional +20%",
      "Soporte prioritario",
    ],
    note: "Pensado para operación con clientes.",
  },
  {
    key: "empresa",
    name: "Empresa",
    monthly: 29990,
    annual: 329890,
    description: "Para operación corporativa",
    highlight: false,
    cta: "Ver plan Empresa",
    href: "/planes#precios",
    features: [
      "Todo lo de Profesional",
      "Clientes ilimitados",
      "Auditoría operacional",
      "Soporte dedicado",
    ],
    note: "Para empresas, oficinas contables y mayor volumen.",
  },
];

function formatClp(value: number) {
  if (value === 0) return "Gratis";

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value);
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="m-0 text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-[-0.045em] text-slate-50 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="relative grid min-h-[calc(100vh-76px)] overflow-hidden px-6 py-16 lg:place-items-center lg:py-20">
      {HERO_IMAGES.map((image, index) => (
        <div
          key={image}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url('${image}')`,
            opacity: current === index ? 1 : 0,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,12,19,0.94)_0%,rgba(15,42,61,0.88)_52%,rgba(15,42,61,0.76)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent_0%,rgba(15,42,61,0.85)_60%,#0F2A3D_100%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="flex flex-col justify-center">
          <div className="mb-3 w-fit inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
            Declaración crypto simplificada
          </div>

          <h1 className="max-w-4xl font-display text-4xl font-black leading-[0.98] tracking-[-0.07em] text-slate-50 sm:text-5xl lg:text-7xl">
            Calcula tus impuestos
            <br />
            <span className="text-emerald-500">crypto para el SII</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Importa tus movimientos de Buda, Binance o CSV. LEDGERA calcula tu
            ganancia y te dice qué poner en el Formulario 22.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/register"
              className="inline-flex justify-center rounded-xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              Calcular mi declaración gratis
            </Link>
            <Link
              href="/login"
              className="inline-flex justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-slate-100 transition hover:bg-white/15"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-400">
            LEDGERA organiza información financiera-tributaria. No reemplaza la
            revisión profesional de un contador ni constituye asesoría
            tributaria personalizada.
          </p>
        </div>

        <div className="hidden rounded-[28px] border border-white/15 bg-[#0F2A3D]/85 p-4 shadow-2xl md:block">
          <div className="rounded-[22px] bg-[#040C13]/75 p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="m-0 text-xs font-black uppercase tracking-[0.18em] text-amber-400">
                  Flujo LEDGERA
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Revisión antes de confirmar
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
                Trazable
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {[
                ["Importaciones", "Exchange, banco o carga manual"],
                ["Banco", "Movimientos con posible relación crypto"],
                ["Portafolio", "Solo movimientos confirmados"],
                ["Conciliación", "Banco, exchange y portafolio conectados"],
                ["Tributario", "Base para revisión en Chile"],
                ["Auditoría", "Trazabilidad de cambios y decisiones"],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="m-0 font-black text-slate-50">{title}</p>
                  <p className="mt-1 text-sm text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LedgeraLanding() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [billing, setBilling] = useState<BillingMode>("monthly");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#0F2A3D_0%,#071B28_28%,#061520_58%,#0F2A3D_100%)] text-slate-50">
      <nav className="sticky top-0 z-[100] flex h-[76px] items-center justify-between border-b border-white/10 bg-[#0F2A3D]/95 px-5 backdrop-blur-md lg:px-8">
        <Link href="/" aria-label="Inicio LEDGERA">
          <Logo variant="light" size="lg" showSubtitle />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}

          <span className="mx-2 h-6 w-px bg-white/15" />

          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            Calcular gratis
          </Link>
        </div>

        <button
          type="button"
          className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-slate-100 md:hidden"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-expanded={mobileMenuOpen}
          aria-label="Abrir menú"
        >
          Menú
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div className="sticky top-[76px] z-[90] border-b border-white/10 bg-[#0F2A3D]/98 px-6 py-4 backdrop-blur-md md:hidden">
          <div className="grid gap-3">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-bold text-slate-300"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="font-bold text-slate-300"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl bg-emerald-600 px-4 py-3 text-center font-black text-white"
            >
              Calcular gratis
            </Link>
          </div>
        </div>
      ) : null}

      <HeroCarousel />

      <section className="px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeader
            eyebrow="Problema real"
            title="Tu información crypto está dispersa antes de llegar a impuestos."
            description="Exchange, banco, portafolio y reportes tributarios no deberían vivir separados. LEDGERA conecta esas piezas antes de preparar cualquier análisis."
          />

          <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {problems.map((problem) => (
              <div
                key={problem}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="m-0 text-sm font-semibold leading-6 text-slate-300">
                  {problem}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.03)_12%,rgba(255,255,255,0.03)_88%,transparent_100%)] px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeader
            eyebrow="Cómo funciona"
            title="De datos dispersos a información financiera revisada."
          />

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/10 bg-[#0F2A3D]/70 p-6"
              >
                <span className="text-sm font-black text-amber-400">
                  {item.step}
                </span>
                <h3 className="mt-3 font-display text-xl font-black text-slate-50">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeader
            eyebrow="Producto construido"
            title="LEDGERA no es una extensión de un exchange. Es un sistema de orden financiero crypto."
          />

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <div
                key={module.title}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-6"
              >
                <h3 className="font-display text-2xl font-black text-slate-50">
                  {module.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {module.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planes" className="bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.03)_12%,rgba(255,255,255,0.03)_88%,transparent_100%)] px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeader
            eyebrow="Planes"
            title="Precios claros para empezar, ordenar y escalar."
          />

          <div className="mt-7 flex flex-col items-center justify-center gap-3">
            <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.06] p-1">
              {[
                { value: "monthly", label: "Mensual" },
                { value: "annual", label: "Anual · 1 mes bonificado" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBilling(option.value as BillingMode)}
                  className={`rounded-xl px-5 py-3 text-sm font-black transition ${
                    billing === option.value
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="m-0 text-center text-xs font-bold text-slate-500">
              El anual equivale a 11 mensualidades por 12 meses de uso.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const price = billing === "monthly" ? plan.monthly : plan.annual;

              return (
                <article
                  key={plan.key}
                  className={`flex h-full flex-col rounded-2xl border p-5 transition ${
                    plan.highlight
                      ? "border-emerald-500/45 bg-emerald-500/[0.08] shadow-[0_18px_50px_rgba(16,185,129,0.10)]"
                      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.055]"
                  }`}
                >
                  <div className="flex-1">
                    <h3 className="font-display text-2xl font-black tracking-[-0.035em] text-slate-50">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {plan.description}
                    </p>

                    <div className="mt-5 flex items-end gap-2">
                      <span className="font-display text-3xl font-black tracking-[-0.04em] text-slate-50">
                        {plan.key === "personal" ? formatClp(9990) : formatClp(price)}
                      </span>
                      {plan.key === "personal" ? (
                        <span className="pb-1 text-xs font-bold text-slate-500">
                          por año fiscal
                        </span>
                      ) : price > 0 ? (
                        <span className="pb-1 text-xs font-bold text-slate-500">
                          / {billing === "monthly" ? "mes" : "año"}
                        </span>
                      ) : null}
                    </div>

                    <ul className="mt-5 grid list-none gap-2.5 p-0">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm leading-6 text-slate-300"
                        >
                          <span className="mt-0.5 text-emerald-300" aria-hidden="true">
                            ✓
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.note ? (
                    <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs leading-5 text-slate-500">
                      {plan.note}
                    </p>
                  ) : null}

                  <Link
                    href={plan.href}
                    className={`mt-5 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-black transition ${
                      plan.highlight
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/planes#precios"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-4 text-sm font-black text-slate-100 transition hover:bg-white/[0.09]"
            >
              Ver detalle completo de planes
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 lg:py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid grid-cols-1 items-center gap-6 rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(22,163,74,0.16),rgba(15,42,61,0.92))] p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-8">
            <div>
              <h2 className="font-display text-3xl font-black leading-tight tracking-[-0.045em] text-slate-50 lg:text-4xl">
                Ordena tu historial crypto antes de tomar decisiones tributarias.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Primero importa, revisa y confirma. Después analiza portafolio,
                conciliación y base tributaria.
              </p>
            </div>

            <Link
              href="/register"
              className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-center text-sm font-black text-white transition hover:bg-emerald-700 lg:w-auto"
            >
              Calcular mi declaración gratis
            </Link>
          </div>
        </div>
      </section>

      <div className="h-16 w-full bg-[linear-gradient(180deg,#061520_0%,#040C13_100%)]" />

      <footer className="border-t border-white/10 bg-[#040C13] px-6 py-12">
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,minmax(150px,1fr))]">
          <div>
            <Logo variant="light" size="lg" showSubtitle />
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              Sistema financiero-tributario para ordenar actividad crypto,
              conciliar fuentes y preparar información clara en Chile.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-black text-slate-50">Producto</h4>
            <div className="grid gap-3">
              {navLinks.map((item) => (
                <Link key={item.href} href={item.href} className="text-sm text-slate-400">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-black text-slate-50">Legal</h4>
            <div className="grid gap-3">
              <Link href="/terminos" className="text-sm text-slate-400">
                Términos y condiciones
              </Link>
              <Link href="/privacidad" className="text-sm text-slate-400">
                Política de privacidad
              </Link>
              <Link href="/cookies" className="text-sm text-slate-400">
                Política de cookies
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-black text-slate-50">Contacto</h4>
            <a href="mailto:admin@ledgera.cl" className="text-sm text-slate-400">
              admin@ledgera.cl
            </a>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-[1180px] border-t border-white/10 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} LEDGERA. Todos los derechos reservados.
        </div>
      </footer>

      {showScrollTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-[80] h-12 w-12 rounded-full border border-white/15 bg-[#13364F] font-black text-white"
          aria-label="Volver arriba"
        >
          ↑
        </button>
      ) : null}
    </main>
  );
}
