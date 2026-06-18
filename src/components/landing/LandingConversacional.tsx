// src/components/landing/LandingConversacional.tsx
// UX 3.0.01 — Landing Conversacional
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";

/* ─── Data ────────────────────────────────────────────────────────────────── */

const EJEMPLOS = [
  "Quiero iniciar actividades.",
  "¿Debo crear una SpA o una EIRL?",
  "¿Cómo pago menos impuestos legalmente?",
  "Voy a contratar mi primer trabajador.",
  "¿Me conviene comprar o arrendar?",
];

const QUE_HACE = [
  {
    icon: "🔍",
    title: "Entiende",
    text: "Interpreta contexto, documentos y normativa.",
  },
  {
    icon: "💬",
    title: "Explica",
    text: "Traduce leyes y regulaciones a lenguaje claro.",
  },
  {
    icon: "📊",
    title: "Proyecta",
    text: "Muestra escenarios y consecuencias antes de decidir.",
  },
] as const;

const PARA_QUIEN = [
  {
    title: "Persona",
    text: "Organiza tus decisiones financieras y tributarias.",
  },
  {
    title: "Empresa",
    text: "Obtén claridad operativa y cumplimiento normativo.",
  },
  {
    title: "Profesional",
    text: "Aumenta capacidad analítica y velocidad de respuesta.",
  },
] as const;

const COMO_FUNCIONA = [
  { step: "01", title: "Cuéntame qué necesitas.", text: "" },
  { step: "02", title: "Analizo contexto, normativa y alternativas.", text: "" },
  { step: "03", title: "Te explico escenarios y consecuencias.", text: "" },
  { step: "04", title: "Tú decides.", text: "" },
] as const;

const FOOTER_LINKS = [
  { label: "Seguridad", href: "/seguridad" },
  { label: "Privacidad", href: "/privacidad" },
  { label: "Términos", href: "/terminos" },
  { label: "Contacto", href: "mailto:admin@ledgera.cl" },
] as const;

/* ─── Subcomponentes ──────────────────────────────────────────────────────── */

function SectionHeader({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="m-0 text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-[-0.045em] text-slate-50 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
    </div>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────────── */

function HeroConversacional() {
  const router = useRouter();
  const [currentExample, setCurrentExample] = useState(0);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % EJEMPLOS.length);
    }, 3500);
    return () => window.clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/register");
  };

  return (
    <section className="relative grid min-h-[calc(100vh-76px)] place-items-center overflow-hidden px-6 py-16 lg:py-20">
      {/* Gradiente de fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#0F2A3D_0%,#071B28_35%,#061520_65%,#0A1F2E_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(22,163,74,0.08)_0%,transparent_60%)]" />

      {/* Grid decorativo */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[820px] flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-8">
          <Logo variant="light" size="lg" showSubtitle />
        </div>

        {/* Título */}
        <h1 className="max-w-3xl font-display text-4xl font-black leading-[1.05] tracking-[-0.06em] text-slate-50 sm:text-5xl lg:text-6xl">
          Tu sistema operativo
          <br />
          <span className="text-emerald-400">financiero y tributario.</span>
        </h1>

        {/* Subtítulo */}
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          Conversa con LEDGERA y entiende las consecuencias financieras y
          tributarias de tus decisiones antes de actuar.
        </p>

        {/* Input principal */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 flex w-full max-w-[600px] flex-col gap-4 sm:flex-row"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="¿En qué te puedo ayudar hoy?"
              className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 text-sm text-slate-100 placeholder:text-slate-500 backdrop-blur-sm transition focus:border-emerald-500/40 focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700 hover:shadow-[0_0_30px_rgba(22,163,74,0.25)]"
          >
            <span>Conversar con LEDGERA</span>
            <span className="text-lg leading-none" aria-hidden="true">
              →
            </span>
          </button>
        </form>

        {/* Ejemplos dinámicos */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400">
          <span className="text-xs text-slate-500">Ejemplo:</span>
          <button
            type="button"
            onClick={() => setInputValue(EJEMPLOS[currentExample])}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-slate-300 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-200"
          >
            {EJEMPLOS[currentExample]}
          </button>
          <span className="flex gap-1.5">
            {EJEMPLOS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentExample(i)}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i === currentExample
                    ? "bg-emerald-400"
                    : "bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Ejemplo ${i + 1}`}
              />
            ))}
          </span>
        </div>

        {/* Trust line */}
        <p className="mt-10 max-w-xl text-xs leading-6 text-slate-500">
          LEDGERA organiza información financiera-tributaria. No reemplaza la
          revisión profesional de un contador ni constituye asesoría tributaria
          personalizada.
        </p>
      </div>
    </section>
  );
}

/* ─── Sección 2: Qué hace LEDGERA ─────────────────────────────────────────── */

function QueHaceSection() {
  return (
    <section className="px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-[1180px]">
        <SectionHeader eyebrow="Qué hace LEDGERA" title="Entiende, explica y proyecta." />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {QUE_HACE.map((item) => (
            <div
              key={item.title}
              className="group relative rounded-3xl border border-white/10 bg-[#0F2A3D]/70 p-8 transition hover:border-emerald-500/25 hover:bg-[#0F2A3D]"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl transition group-hover:bg-emerald-500/15">
                {item.icon}
              </div>
              <h3 className="font-display text-2xl font-black tracking-[-0.03em] text-slate-50">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Sección 3: Para quién ───────────────────────────────────────────────── */

function ParaQuienSection() {
  return (
    <section className="bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.03)_12%,rgba(255,255,255,0.03)_88%,transparent_100%)] px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-[1180px]">
        <SectionHeader eyebrow="Para quién" title="Diseñado para personas, empresas y profesionales." />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {PARA_QUIEN.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/[0.045] p-8 transition hover:bg-white/[0.065]"
            >
              <h3 className="font-display text-2xl font-black tracking-[-0.03em] text-slate-50">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Sección 4: Cómo funciona ────────────────────────────────────────────── */

function ComoFuncionaSection() {
  return (
    <section className="px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-[1180px]">
        <SectionHeader eyebrow="Cómo funciona" title="Cuatro pasos simples." />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COMO_FUNCIONA.map((item, i) => (
            <div
              key={item.step}
              className="relative rounded-3xl border border-white/10 bg-[#0F2A3D]/70 p-8"
            >
              {/* Número */}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-lg font-black text-emerald-300">
                {item.step}
              </div>

              {/* Connector line (desktop) */}
              {i < COMO_FUNCIONA.length - 1 ? (
                <div className="absolute right-0 top-12 hidden h-px w-[calc(50%-4rem)] bg-gradient-to-r from-emerald-500/40 to-transparent lg:block" />
              ) : null}

              <h3 className="font-display text-xl font-black leading-snug tracking-[-0.025em] text-slate-50">
                {item.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Sección 5: Principio de confianza ───────────────────────────────────── */

function ConfianzaSection() {
  return (
    <section className="bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.02)_12%,rgba(255,255,255,0.02)_88%,transparent_100%)] px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-[820px] text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
          <span className="text-2xl">🛡️</span>
        </div>

        <SectionHeader
          eyebrow="Principio de confianza"
          title="LEDGERA no toma decisiones por ti."
        />

        <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-slate-300">
          Te ayuda a comprender el contexto, las normas aplicables y las
          consecuencias de cada alternativa para que tomes decisiones
          informadas.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-700 hover:shadow-[0_0_30px_rgba(22,163,74,0.25)]"
          >
            Conversar con LEDGERA
            <span className="text-lg leading-none" aria-hidden="true">
              →
            </span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-slate-100 transition hover:bg-white/15"
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
    <footer className="border-t border-white/10 bg-[#040C13] px-6 py-12">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-8 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-4 sm:items-start">
          <Logo variant="light" size="sm" showSubtitle />
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

      <div className="mx-auto mt-8 max-w-[1180px] border-t border-white/10 pt-6 text-center text-sm text-slate-500">
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
    <main className="min-h-screen overflow-x-hidden bg-[#071B28] text-slate-50">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-[100] flex h-[76px] items-center justify-between border-b border-white/10 bg-[#0F2A3D]/95 px-5 backdrop-blur-md lg:px-8">
        <Link href="/" aria-label="Inicio LEDGERA">
          <Logo variant="light" size="lg" showSubtitle />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
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
            Conversar con LEDGERA
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
              Conversar con LEDGERA
            </Link>
          </div>
        </div>
      ) : null}

      {/* ── Secciones ── */}
      <HeroConversacional />

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <QueHaceSection />

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <ParaQuienSection />

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <ComoFuncionaSection />

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

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
