// src/components/landing/LandingConversacional.tsx
// UX 3.0.01 v1.3 — Identidad corporativa + narrativa de decisión
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/modules/identity/client/authContext";

const BRAND_SUBTITLE = "Sistema Operativo Financiero y Tributario";

const PROMPTS = [
  "Tengo activos digitales y quiero ordenar mi situación tributaria",
  "Quiero crear una empresa y elegir bien el régimen tributario",
  "Estoy evaluando comprar, arrendar o invertir",
] as const;

const DECISION_CASES = [
  {
    index: "01",
    title: "Activos digitales",
    text: "Ordena movimientos, tenencia, valorización e impacto tributario antes de declarar o mover patrimonio.",
    signal: "Patrimonio · SII · riesgo",
  },
  {
    index: "02",
    title: "Empresa y régimen",
    text: "Evalúa estructura societaria, régimen tributario, costos de cumplimiento y obligaciones futuras.",
    signal: "SpA · EIRL · régimen",
  },
  {
    index: "03",
    title: "Inversión y patrimonio",
    text: "Compara escenarios financieros y tributarios antes de comprar, vender, reinvertir o retirar fondos.",
    signal: "escenarios · flujo · impacto",
  },
  {
    index: "04",
    title: "Cumplimiento",
    text: "Identifica obligaciones, fechas críticas, documentación necesaria y consecuencias de cada alternativa.",
    signal: "norma · proceso · trazabilidad",
  },
] as const;

const FOOTER_LINKS = [
  { label: "Seguridad", href: "/seguridad" },
  { label: "Privacidad", href: "/privacidad" },
  { label: "Términos", href: "/terminos" },
  { label: "Contacto", href: "mailto:admin@ledgera.cl" },
] as const;

function DecisionFieldBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#0F2A3D]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(22,163,74,0.18),transparent_34%),radial-gradient(circle_at_78%_10%,rgba(245,158,11,0.10),transparent_28%),linear-gradient(180deg,rgba(15,42,61,0.08)_0%,rgba(5,15,23,0.72)_72%,rgba(3,9,14,0.96)_100%)]" />

      <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(246,248,250,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(246,248,250,0.10)_1px,transparent_1px)] [background-size:96px_96px]" />

      <svg
        className="absolute inset-0 h-full w-full opacity-80"
        viewBox="0 0 1440 860"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          className="ledger-line ledger-line-a"
          d="M-40 610 C180 520 250 680 420 540 C590 400 680 452 830 330 C990 200 1090 270 1480 120"
          stroke="#16A34A"
          strokeWidth="2"
          strokeOpacity="0.32"
        />
        <path
          className="ledger-line ledger-line-b"
          d="M-20 280 C190 250 260 340 420 300 C625 248 710 120 930 185 C1120 241 1235 188 1480 242"
          stroke="#F59E0B"
          strokeWidth="1.4"
          strokeOpacity="0.18"
        />
        <path
          className="ledger-line ledger-line-c"
          d="M60 780 C230 688 355 704 510 618 C696 514 748 590 910 468 C1102 324 1266 398 1420 310"
          stroke="#F6F8FA"
          strokeWidth="1.2"
          strokeOpacity="0.12"
        />
      </svg>

      <div className="decision-orb left-[9%] top-[25%]" />
      <div className="decision-orb left-[29%] top-[62%] animation-delay-700" />
      <div className="decision-orb left-[55%] top-[40%] animation-delay-1000" />
      <div className="decision-orb left-[76%] top-[24%] animation-delay-1500" />
      <div className="decision-orb left-[87%] top-[68%] animation-delay-2000" />

      <div className="absolute bottom-0 left-0 right-0 h-[34%] opacity-[0.07] [background-image:repeating-linear-gradient(90deg,transparent_0px,transparent_110px,rgba(246,248,250,0.32)_110px,rgba(246,248,250,0.32)_112px,transparent_112px,transparent_220px)]" />
    </div>
  );
}

function HeroConversacional() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");

  const startConversation = (value: string) => {
    const cleanValue = value.trim();
    if (cleanValue) {
      window.sessionStorage.setItem("ledgera.initialDecision", cleanValue);
    }
    router.push("/register");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startConversation(inputValue);
  };

  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
      <DecisionFieldBackground />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-188px)] max-w-[1240px] items-center gap-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.78fr)]">
        <div className="max-w-[860px]">
          <div className="mb-10 inline-flex rounded-full border border-[#16A34A]/25 bg-[#16A34A]/10 px-5 py-2 text-sm font-extrabold uppercase tracking-[0.24em] text-[#86EFAC]">
            IA como interfaz principal
          </div>

          <h1 className="font-display text-[52px] font-black leading-[0.96] tracking-[-0.06em] text-[#F6F8FA] sm:text-[76px] lg:text-[96px]">
            Comprende el impacto
            <span className="block text-[#16A34A]">antes de decidir.</span>
          </h1>

          <p className="mt-8 max-w-[760px] text-[22px] leading-[1.55] text-[#D7E0EA] sm:text-[26px]">
            LEDGERA interpreta contexto, normativa chilena, patrimonio,
            impuestos y escenarios futuros para ayudarte a evaluar decisiones
            financieras y tributarias con claridad.
          </p>

          <form onSubmit={handleSubmit} className="mt-11 max-w-[820px]">
            <div className="rounded-[28px] border border-[#1e4a6b] bg-[#071B28]/82 p-2 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl transition focus-within:border-[#16A34A]/70 focus-within:shadow-[0_0_70px_rgba(22,163,74,0.18)]">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="¿Qué decisión necesitas evaluar hoy?"
                  className="min-h-[76px] flex-1 rounded-[22px] border-0 bg-transparent px-6 text-[20px] font-semibold text-[#F6F8FA] outline-none placeholder:text-[#94A3B8] sm:text-[22px]"
                />
                <button
                  type="submit"
                  className="min-h-[68px] rounded-[22px] bg-[#16A34A] px-8 text-[18px] font-black text-white transition hover:bg-[#15803D] active:scale-[0.98]"
                >
                  Evaluar decisión →
                </button>
              </div>
            </div>
          </form>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInputValue(prompt)}
                className="min-h-[76px] rounded-2xl border border-[#1e4a6b] bg-[#13364F]/56 px-5 text-left text-[16px] font-bold leading-snug text-[#E8EEF5] transition hover:border-[#16A34A]/60 hover:bg-[#16A34A]/12 hover:text-white sm:text-[17px]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <aside className="rounded-[34px] border border-[#1e4a6b] bg-[#071B28]/76 p-6 shadow-[0_34px_120px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#86EFAC]">
                Mapa de decisión
              </p>
              <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.04em] text-[#F6F8FA]">
                De pregunta a escenario
              </h2>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#16A34A]/25 bg-[#16A34A]/10 text-2xl font-black text-[#86EFAC]">
              L
            </div>
          </div>

          <div className="space-y-4">
            {[
              ["Contexto", "Quién eres, qué tienes y qué quieres resolver."],
              ["Normativa", "Reglas chilenas aplicables a tu situación."],
              ["Escenarios", "Alternativas, costos, riesgos y consecuencias."],
              ["Decisión", "Tú eliges con información clara y trazable."],
            ].map(([title, text], index) => (
              <div key={title} className="group flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-5 transition hover:border-[#16A34A]/35 hover:bg-[#16A34A]/[0.07]">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#13364F] text-sm font-black text-[#86EFAC]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="text-[19px] font-black text-[#F6F8FA]">{title}</h3>
                  <p className="mt-1 text-[16px] leading-6 text-[#CBD5E1]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function CasosRealesSection() {
  return (
    <section className="relative border-t border-[#1e4a6b]/60 bg-[#071B28] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1240px]">
        <div className="max-w-[820px]">
          <p className="text-base font-black uppercase tracking-[0.22em] text-[#86EFAC]">
            Casos que sí representan LEDGERA
          </p>
          <h2 className="mt-5 font-display text-[42px] font-black leading-[1.02] tracking-[-0.055em] text-[#F6F8FA] sm:text-[64px]">
            Decisiones financieras, tributarias y patrimoniales.
          </h2>
          <p className="mt-6 text-[21px] leading-[1.55] text-[#CBD5E1]">
            La landing deja de hablar como software genérico. Ahora muestra los
            problemas reales que LEDGERA debe interpretar.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {DECISION_CASES.map((caso) => (
            <article
              key={caso.title}
              className="group min-h-[270px] rounded-[32px] border border-[#1e4a6b] bg-[#0F2A3D] p-8 transition hover:-translate-y-1 hover:border-[#16A34A]/60 hover:bg-[#13364F] sm:p-10"
            >
              <div className="mb-9 flex items-center justify-between gap-6">
                <span className="font-display text-[42px] font-black tracking-[-0.06em] text-[#16A34A]/55">
                  {caso.index}
                </span>
                <span className="rounded-full border border-[#F59E0B]/25 bg-[#F59E0B]/10 px-4 py-2 text-sm font-black uppercase tracking-[0.16em] text-[#FCD34D]">
                  {caso.signal}
                </span>
              </div>
              <h3 className="font-display text-[32px] font-black tracking-[-0.045em] text-[#F6F8FA] sm:text-[40px]">
                {caso.title}
              </h3>
              <p className="mt-5 text-[20px] leading-[1.55] text-[#D7E0EA]">
                {caso.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConfianzaSection() {
  return (
    <section className="relative border-t border-[#1e4a6b]/60 bg-[#0F2A3D] px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[980px] text-center">
        <p className="text-base font-black uppercase tracking-[0.22em] text-[#86EFAC]">
          Principio de producto
        </p>
        <h2 className="mt-5 font-display text-[42px] font-black leading-[1.04] tracking-[-0.055em] text-[#F6F8FA] sm:text-[64px]">
          LEDGERA no decide por ti.
        </h2>
        <p className="mx-auto mt-7 max-w-[820px] text-[22px] leading-[1.6] text-[#D7E0EA]">
          Explica qué ocurre, qué normas aplican, qué alternativas existen y qué
          consecuencias tiene cada camino. La decisión final siempre pertenece
          al usuario.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex min-h-[64px] items-center rounded-2xl bg-[#16A34A] px-8 text-[18px] font-black text-white transition hover:bg-[#15803D] active:scale-[0.98]"
          >
            Evaluar una decisión →
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-[64px] items-center rounded-2xl border border-[#1e4a6b] bg-[#13364F] px-8 text-[17px] font-black text-[#F6F8FA] transition hover:bg-[#1e4a6b]"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-[#1e4a6b]/60 bg-[#071B28] px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-8 sm:flex-row sm:justify-between">
        <Logo variant="light" size="sm" showSubtitle subtitle={BRAND_SUBTITLE} />

        <nav className="flex flex-wrap justify-center gap-x-7 gap-y-3">
          {FOOTER_LINKS.map((link) =>
            link.href.startsWith("mailto:") ? (
              <a
                key={link.label}
                href={link.href}
                className="text-base font-semibold text-[#CBD5E1] transition hover:text-[#F6F8FA]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-base font-semibold text-[#CBD5E1] transition hover:text-[#F6F8FA]"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>

      <div className="mx-auto mt-8 max-w-[1240px] border-t border-[#1e4a6b]/60 pt-6 text-center text-base text-[#94A3B8]">
        © {new Date().getFullYear()} LEDGERA. Todos los derechos reservados.
      </div>
    </footer>
  );
}

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
    <main className="min-h-screen overflow-x-hidden bg-[#0F2A3D] text-[#F6F8FA]">
      <style jsx global>{`
        @keyframes ledgerDash {
          0% { stroke-dashoffset: 900; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.48; }
          50% { transform: scale(1.5); opacity: 1; }
        }
        .ledger-line {
          stroke-dasharray: 18 24;
          animation: ledgerDash 18s linear infinite;
        }
        .ledger-line-b { animation-duration: 24s; }
        .ledger-line-c { animation-duration: 30s; }
        .decision-orb {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: #16A34A;
          box-shadow: 0 0 30px rgba(22, 163, 74, 0.62);
          animation: orbPulse 4.8s ease-in-out infinite;
        }
        .animation-delay-700 { animation-delay: 700ms; }
        .animation-delay-1000 { animation-delay: 1000ms; }
        .animation-delay-1500 { animation-delay: 1500ms; }
        .animation-delay-2000 { animation-delay: 2000ms; }
      `}</style>

      <nav className="sticky top-0 z-[100] flex min-h-[84px] items-center justify-between border-b border-[#1e4a6b]/70 bg-[#071B28]/92 px-5 backdrop-blur-xl lg:px-10">
        <Link href="/" aria-label="Inicio LEDGERA">
          <Logo variant="light" size="md" showSubtitle subtitle={BRAND_SUBTITLE} />
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-xl px-5 py-3 text-base font-black text-[#CBD5E1] transition hover:bg-white/8 hover:text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-6 py-4 text-base font-black text-white transition hover:bg-[#15803D]"
          >
            Evaluar decisión
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-xl border border-[#1e4a6b] bg-[#13364F] px-4 py-3 text-sm font-black text-[#F6F8FA] md:hidden"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-expanded={mobileMenuOpen}
          aria-label="Abrir menú"
        >
          Menú
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div className="sticky top-[84px] z-[90] border-b border-[#1e4a6b]/70 bg-[#071B28]/98 px-6 py-5 backdrop-blur-xl md:hidden">
          <div className="grid gap-4">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-black text-[#CBD5E1]"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-4 text-center font-black text-white"
            >
              Evaluar decisión
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      ) : null}

      <HeroConversacional />
      <CasosRealesSection />
      <ConfianzaSection />
      <LandingFooter />

      {showScrollTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-[80] h-12 w-12 rounded-full border border-[#1e4a6b] bg-[#13364F] font-black text-white shadow-lg transition hover:bg-[#1e4a6b]"
          aria-label="Volver arriba"
        >
          ↑
        </button>
      ) : null}
    </main>
  );
}
