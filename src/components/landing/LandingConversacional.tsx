// src/components/landing/LandingConversacional.tsx
// UX 3.0.01 v1.2 — Replanteamiento
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";

/* ─── Brand constant ─────────────────────────────────────────────────────── */

const BRAND_SUBTITLE = "Sistema Operativo Financiero y Tributario";

/* ─── Data ────────────────────────────────────────────────────────────────── */

const CHIPS = [
  "¿Debo formalizar mi empresa?",
  "¿Conviene comprar o arrendar propiedad?",
  "¿Cómo optimizar mi carga tributaria?",
];

const CASOS_REALES = [
  {
    area: "Activos Digitales",
    text: "Analiza tributación, tenencia y movimientos de criptoactivos.",
  },
  {
    area: "Empresas",
    text: "Evalúa estructuras societarias, costos e impuestos.",
  },
  {
    area: "Inversiones",
    text: "Compara escenarios y consecuencias futuras.",
  },
  {
    area: "Cumplimiento",
    text: "Identifica obligaciones y riesgos regulatorios.",
  },
] as const;

const FOOTER_LINKS = [
  { label: "Seguridad", href: "/seguridad" },
  { label: "Privacidad", href: "/privacidad" },
  { label: "Términos", href: "/terminos" },
  { label: "Contacto", href: "mailto:admin@ledgera.cl" },
] as const;

/* ─── Abstract Background ──────────────────────────────────────────────────── */

function AbstractFinanceBg() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Gradient base — deep, premium */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0B1A2E] to-[#020617]" />

      {/* Gradient orbs — wealth/finance feel */}
      <div className="absolute -left-[20%] top-[5%] h-[55%] w-[55%] rounded-full opacity-[0.04] blur-[120px]"
        style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }}
      />
      <div className="absolute -right-[15%] top-[20%] h-[45%] w-[45%] rounded-full opacity-[0.03] blur-[100px]"
        style={{ background: "radial-gradient(circle, #0ea5e9 0%, transparent 70%)" }}
      />
      <div className="absolute left-[20%] bottom-[10%] h-[35%] w-[35%] rounded-full opacity-[0.025] blur-[90px]"
        style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }}
      />

      {/* Subtle grid — architectural / Bloomberg */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Abstract block shapes — edificios / patrimonio */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%] opacity-[0.012]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0px, transparent 120px, rgba(255,255,255,0.08) 120px, rgba(255,255,255,0.08) 121px, transparent 121px, transparent 240px)," +
            "repeating-linear-gradient(0deg, transparent 0px, transparent 180px, rgba(255,255,255,0.06) 180px, rgba(255,255,255,0.06) 181px, transparent 181px, transparent 360px)",
          backgroundSize: "240px 360px",
        }}
      />
    </div>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────────── */

function HeroConversacional() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/register");
  };

  const handleChipClick = (text: string) => {
    setInputValue(text);
  };

  return (
    <section className="relative grid min-h-screen place-items-center overflow-hidden px-6 py-24 lg:py-32">
      <AbstractFinanceBg />

      <div className="relative z-10 mx-auto flex w-full max-w-[900px] flex-col items-center text-center">
        {/* Marca — mucho más grande, más respiración, más presencia */}
        <div className="mb-12 scale-125 sm:scale-150 origin-center">
          <Logo
            variant="light"
            size="lg"
            showSubtitle
            subtitle={BRAND_SUBTITLE}
          />
        </div>

        {/* Título */}
        <h1 className="max-w-4xl font-display text-5xl font-black leading-[1.08] tracking-[-0.05em] text-slate-50 sm:text-7xl lg:text-8xl">
          Comprende el impacto de tus decisiones
          <br />
          <span className="text-emerald-400">antes de tomarlas.</span>
        </h1>

        {/* Subtítulo */}          <p className="mt-6 max-w-2xl text-2xl leading-8 text-slate-400 sm:text-[30px] sm:leading-9">
          LEDGERA analiza contexto, normativa, impuestos, patrimonio y
          escenarios futuros para ayudarte a tomar mejores decisiones.
        </p>

        {/* Input principal — el elemento más importante */}
        <form
          onSubmit={handleSubmit}
          className="mt-12 flex w-full max-w-[680px] flex-col gap-4 sm:flex-row"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="¿Qué decisión estás evaluando hoy?"
              className="w-full rounded-2xl border-2 border-white/20 bg-white/[0.08] px-7 py-6 text-xl text-slate-100 placeholder:text-slate-500 backdrop-blur-sm transition-all duration-300 ease-out focus:border-emerald-500/50 focus:bg-white/[0.12] focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:shadow-[0_0_50px_rgba(16,185,129,0.12)]"
            />
          </div>
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-6 text-lg font-black text-white transition-all duration-300 hover:bg-emerald-700 hover:shadow-[0_0_50px_rgba(16,185,129,0.35)] active:scale-[0.97]"
          >
            <span>Comenzar</span>
            <span className="text-xl leading-none" aria-hidden="true">
              →
            </span>
          </button>
        </form>

        {/* Chips — 18px */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {CHIPS.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => handleChipClick(text)}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-lg text-slate-300 transition-all duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-200 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
            >
              {text}
            </button>
          ))}
        </div>

        {/* Disclaimer — 16px */}
        <p className="mt-12 max-w-3xl text-base leading-7 text-slate-500 sm:text-lg">
          LEDGERA te ayuda a comprender normas, alternativas y consecuencias
          financieras y tributarias antes de tomar una decisión. No reemplaza la
          asesoría profesional especializada.
        </p>
      </div>
    </section>
  );
}

/* ─── Casos Reales ──────────────────────────────────────────────────────────── */

function CasosRealesSection() {
  return (
    <section className="relative border-t border-white/[0.04] bg-[#020617] px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-[1180px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="m-0 text-sm font-black uppercase tracking-[0.18em] text-emerald-400/70">
            Capacidades
          </p>
          <h2 className="mt-5 font-display text-3xl font-black leading-tight tracking-[-0.04em] text-slate-50 sm:text-4xl lg:text-5xl">
            Analiza casos reales.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            LEDGERA evalúa escenarios concretos con contexto normativo,
            financiero y patrimonial.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {CASOS_REALES.map((caso) => (
            <div
              key={caso.area}
              className="group rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.04] sm:p-10"
            >
              <h3 className="font-display text-2xl font-black tracking-[-0.025em] text-slate-50 transition-colors duration-300 group-hover:text-emerald-300 sm:text-3xl">
                {caso.area}
              </h3>
              <p className="mt-4 text-lg leading-7 text-slate-400 sm:text-xl sm:leading-8">
                {caso.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Principio de confianza ───────────────────────────────────────────────── */

function ConfianzaSection() {
  return (
    <section className="relative border-t border-white/[0.04] bg-[#020617] px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-[820px] text-center">
        <h2 className="font-display text-3xl font-black leading-tight tracking-[-0.04em] text-slate-50 sm:text-4xl lg:text-5xl">
          LEDGERA no toma decisiones por ti.
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Te ayuda a comprender el contexto, las normas aplicables y las
          consecuencias de cada alternativa para que tomes decisiones
          informadas.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-7 py-5 text-lg font-black text-white transition-all duration-300 hover:bg-emerald-700 hover:shadow-[0_0_40px_rgba(16,185,129,0.30)] active:scale-[0.97]"
          >
            Comenzar
            <span className="text-xl leading-none" aria-hidden="true">
              →
            </span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-2xl border border-white/20 bg-white/10 px-7 py-5 text-base font-bold text-slate-100 transition hover:bg-white/15"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */

function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#020617] px-6 py-12">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-8 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-4 sm:items-start">
          <Logo
            variant="light"
            size="sm"
            showSubtitle
            subtitle={BRAND_SUBTITLE}
          />
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {FOOTER_LINKS.map((link) =>
            link.href.startsWith("mailto:") ? (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-slate-400 transition hover:text-slate-200"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-slate-400 transition hover:text-slate-200"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>

      <div className="mx-auto mt-8 max-w-[1180px] border-t border-white/[0.04] pt-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} LEDGERA. Todos los derechos reservados.
      </div>
    </footer>
  );
}

/* ─── Componente principal ────────────────────────────────────────────────── */

export default function LandingConversacional() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
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
    <main className="min-h-screen overflow-x-hidden bg-[#020617] text-slate-50">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-[100] flex h-[76px] items-center justify-between border-b border-white/[0.04] bg-[#020617]/90 px-5 backdrop-blur-md lg:px-8">
        <Link href="/" aria-label="Inicio LEDGERA">
          <Logo
            variant="light"
            size="md"
            showSubtitle
            subtitle={BRAND_SUBTITLE}
          />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            Comenzar
            <span aria-hidden="true">→</span>
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
        <div className="sticky top-[76px] z-[90] border-b border-white/[0.04] bg-[#020617]/98 px-6 py-4 backdrop-blur-md md:hidden">
          <div className="grid gap-3">
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
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-3 text-center font-black text-white"
            >
              Comenzar
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      ) : null}

      {/* ── Secciones ── */}
      <HeroConversacional />

      <CasosRealesSection />

      <ConfianzaSection />

      <LandingFooter />

      {/* ── Scroll to top ── */}
      {showScrollTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-[80] h-12 w-12 rounded-full border border-white/15 bg-[#13364F] font-black text-white shadow-lg transition hover:bg-[#1e4a6b]"
          aria-label="Volver arriba"
        >
          ↑
        </button>
      ) : null}
    </main>
  );
}
