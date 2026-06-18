// src/components/landing/LandingConversacional.tsx
// UX 3.0.01 v1.1 — Landing Conversacional
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";
import type { CSSProperties } from "react";

/* ─── Brand constant ─────────────────────────────────────────────────────── */

const BRAND_SUBTITLE = "Sistema Operativo Financiero y Tributario";

/* ─── Data ────────────────────────────────────────────────────────────────── */

const EJEMPLOS_CHIPS = [
  "¿Me conviene comprar o arrendar?",
  "Voy a contratar mi primer trabajador",
  "Quiero iniciar actividades",
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

/* ─── Particle Network Background ─────────────────────────────────────────── */

function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 180;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.25;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 197, 94, 0.6)";
        ctx.fill();
      }

      // Update positions
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
}

/* ─── Dynamic Glow ────────────────────────────────────────────────────────── */

function DynamicGlow() {
  const glowStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    pointerEvents: "none",
    background:
      "radial-gradient(ellipse 70% 40% at 50% 15%, rgba(34,197,94,0.12) 0%, transparent 60%)," +
      "radial-gradient(ellipse 50% 30% at 30% 60%, rgba(16,185,129,0.06) 0%, transparent 50%)," +
      "radial-gradient(ellipse 40% 25% at 70% 40%, rgba(20,184,166,0.05) 0%, transparent 50%)",
  };

  return <div style={glowStyle} aria-hidden="true" />;
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
    <section className="relative grid min-h-[calc(100vh-76px)] place-items-center overflow-hidden px-6 py-16 lg:py-20">
      {/* Layer 1: Particle network */}
      <ParticleNetwork />

      {/* Layer 2: Dark overlay */}
      <div
        className="absolute inset-0 z-[2]"
        style={{ background: "rgba(2,6,23,0.78)" }}
        aria-hidden="true"
      />

      {/* Layer 3: Dynamic LEDGERA glow */}
      <DynamicGlow />

      <div className="relative z-10 mx-auto flex w-full max-w-[820px] flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-8">
          <Logo
            variant="light"
            size="lg"
            showSubtitle
            subtitle={BRAND_SUBTITLE}
          />
        </div>

        {/* Título */}
        <h1 className="max-w-3xl font-display text-4xl font-black leading-[1.15] tracking-[-0.06em] text-slate-50 sm:text-5xl lg:text-6xl">
          Conversa con LEDGERA.
          <br />
          <span className="text-emerald-400">Entiende antes de decidir.</span>
        </h1>

        {/* Input principal — centrado, premium */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-[600px] flex-col gap-4 sm:flex-row"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="¿En qué te puedo ayudar hoy?"
              className="w-full rounded-2xl border-2 border-white/20 bg-white/[0.08] px-6 py-5 text-lg text-slate-100 placeholder:text-slate-500 backdrop-blur-sm transition-all duration-300 ease-out focus:border-emerald-500/50 focus:bg-white/[0.12] focus:outline-none focus:ring-[3px] focus:ring-emerald-500/20 focus:shadow-[0_0_40px_rgba(16,185,129,0.12)]"
              style={{ fontSize: "18px" }}
            />
          </div>
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-5 text-base font-black text-white transition-all duration-300 hover:bg-emerald-700 hover:shadow-[0_0_40px_rgba(16,185,129,0.35)] active:scale-[0.97]"
          >
            <span>Iniciar conversación</span>
            <span className="text-xl leading-none" aria-hidden="true">
              →
            </span>
          </button>
        </form>

        {/* Ejemplos — 3 chips estáticos */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {EJEMPLOS_CHIPS.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => handleChipClick(text)}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-slate-300 transition-all duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-200 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
            >
              {text}
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-10 max-w-2xl text-xs leading-6 text-slate-500">
          LEDGERA te ayuda a comprender normas, alternativas y consecuencias
          financieras y tributarias antes de tomar una decisión. No reemplaza la
          asesoría profesional especializada.
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
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-lg font-black text-emerald-300">
                {item.step}
              </div>

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
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white transition hover:bg-emerald-700 hover:shadow-[0_0_30px_rgba(22,163,74,0.25)] active:scale-[0.97]"
          >
            Iniciar conversación
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
    <main className="min-h-screen overflow-x-hidden bg-[#020617] text-slate-50">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-[100] flex h-[76px] items-center justify-between border-b border-white/10 bg-[#020617]/90 px-5 backdrop-blur-md lg:px-8">
        <Link href="/" aria-label="Inicio LEDGERA">
          <Logo
            variant="light"
            size="lg"
            showSubtitle
            subtitle={BRAND_SUBTITLE}
          />
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
          >
            Iniciar conversación
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
        <div className="sticky top-[76px] z-[90] border-b border-white/10 bg-[#020617]/98 px-6 py-4 backdrop-blur-md md:hidden">
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
              Iniciar conversación
              <span aria-hidden="true">→</span>
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
